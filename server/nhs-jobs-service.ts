import { parseStringPromise } from "xml2js";

export interface NhsJobFromApi {
  id: string;
  title: string;
  employer: string;
  description: string;
  closeDate: string;
  postDate: string;
  locations: string[];
  reference: string;
  salary: string;
  type: string;
  url: string;
}

export interface NhsJobsApiResponse {
  totalPages: number;
  totalResults: number;
  vacancies: NhsJobFromApi[];
}

interface CachedSearchResult {
  data: NhsJobsApiResponse;
  timestamp: number;
  ttl: number;
}

export class NhsJobsService {
  private readonly baseUrl = "https://www.jobs.nhs.uk/api/v1/search_xml";
  private recentSearchCache = new Map<string, CachedSearchResult>();
  private static readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private static readonly MAX_CACHE_SIZE = 50;

  private isValidCacheEntry(entry: CachedSearchResult): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  private cleanExpiredCache(): void {
    for (const [key, entry] of this.recentSearchCache.entries()) {
      if (!this.isValidCacheEntry(entry)) {
        this.recentSearchCache.delete(key);
      }
    }
  }

  async searchJobs(
    params: {
      keyword?: string;
      location?: string;
      distance?: number;
      payBandFilter?: string;
      contractType?: string;
      page?: number;
      sort?: string;
    } = {}
  ): Promise<NhsJobsApiResponse> {
    try {
      // Generate consistent cache key
      const cacheKey = JSON.stringify({
        ...params,
        _source: "nhs-jobs",
      });

      // Check cache first
      this.cleanExpiredCache();
      const cachedEntry = this.recentSearchCache.get(cacheKey);
      if (cachedEntry && this.isValidCacheEntry(cachedEntry)) {
        return cachedEntry.data;
      }
      const urlParams = new URLSearchParams();

      // Add search parameters
      if (params.keyword) urlParams.append("keyword", params.keyword);
      if (params.location) urlParams.append("location", params.location);
      if (params.distance)
        urlParams.append("distance", params.distance.toString());
      if (params.payBandFilter)
        urlParams.append("payBandFilter", params.payBandFilter);
      if (params.contractType)
        urlParams.append("contractType", params.contractType);
      if (params.page) urlParams.append("page", params.page.toString());
      if (params.sort) urlParams.append("sort", params.sort);

      const url = `${this.baseUrl}?${urlParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "HealthHire Portal - Healthcare Career Platform",
        },
      });

      if (!response.ok) {
        throw new Error(
          `NHS Jobs API error: ${response.status} ${response.statusText}`
        );
      }

      const xmlText = await response.text();
      const parsedXml = await parseStringPromise(xmlText);

      const nhsJobs = parsedXml?.nhsJobs;
      if (!nhsJobs) {
        throw new Error("Invalid XML response from NHS Jobs API");
      }

      const totalPages = parseInt(nhsJobs.totalPages?.[0] || "0");
      const totalResults = parseInt(nhsJobs.totalResults?.[0] || "0");

      const vacancies: NhsJobFromApi[] = [];

      if (nhsJobs.vacancyDetails && Array.isArray(nhsJobs.vacancyDetails)) {
        for (const vacancy of nhsJobs.vacancyDetails) {
          // Parse locations array - fix XML parsing structure
          const locations: string[] = [];
          if (vacancy.locations?.[0]?.location) {
            if (Array.isArray(vacancy.locations[0].location)) {
              locations.push(...vacancy.locations[0].location);
            } else {
              locations.push(vacancy.locations[0].location);
            }
          }

          vacancies.push({
            id: vacancy.id?.[0] || "",
            title: vacancy.title?.[0] || "",
            employer: vacancy.employer?.[0] || "",
            description: vacancy.description?.[0] || "",
            closeDate: vacancy.closeDate?.[0] || "",
            postDate: vacancy.postDate?.[0] || "",
            locations,
            reference: vacancy.reference?.[0] || "",
            salary: vacancy.salary?.[0] || "",
            type: vacancy.type?.[0] || "",
            url: vacancy.url?.[0] || "",
          });
        }
      }

      const result = {
        totalPages,
        totalResults,
        vacancies,
      };

      // Cache the results with TTL
      const cachedResult: CachedSearchResult = {
        data: result,
        timestamp: Date.now(),
        ttl: NhsJobsService.CACHE_TTL,
      };
      this.recentSearchCache.set(cacheKey, cachedResult);

      // Keep cache size manageable
      if (this.recentSearchCache.size > NhsJobsService.MAX_CACHE_SIZE) {
        const firstKey = this.recentSearchCache.keys().next().value;
        this.recentSearchCache.delete(firstKey);
      }

      return result;
    } catch (error) {
      console.error("NHS Jobs API error:", error);

      // Provide more specific error handling
      if (error instanceof TypeError) {
        // Network or parsing error
        throw new Error(
          "NHS Jobs API is currently unavailable. Please try again later."
        );
      }

      if (error.message?.includes("timeout")) {
        throw new Error("NHS Jobs API request timed out. Please try again.");
      }

      // For other errors, provide meaningful error message but still return empty results
      // to prevent complete app failure while logging the issue
      console.warn(
        "Returning empty results due to NHS Jobs API error. Error details logged."
      );

      return {
        totalPages: 0,
        totalResults: 0,
        vacancies: [],
        error: "NHS Jobs API temporarily unavailable",
      };
    }
  }

  async getJobById(jobId: string): Promise<any> {
    try {
      // Try multiple search strategies to find the job
      let apiJob: NhsJobFromApi | null = null;

      // Strategy 1: Search multiple pages to find the job
      for (let page = 1; page <= 10; page++) {
        const searchResults = await this.searchJobs({ page });
        apiJob = searchResults.vacancies.find((job) => job.id === jobId);
        if (apiJob) break;

        // If no results on this page, stop searching
        if (searchResults.vacancies.length === 0) break;
      }

      // Strategy 2: If not found, try different search approaches
      if (!apiJob) {
        // Try searching by reference number if the jobId looks like a reference
        const refSearchResults = await this.searchJobs({ keyword: jobId });
        apiJob = refSearchResults.vacancies.find(
          (job) => job.id === jobId || job.reference === jobId
        );
      }

      // Strategy 3: Search through valid cached results
      if (!apiJob && this.recentSearchCache) {
        this.cleanExpiredCache();
        for (const cachedEntry of this.recentSearchCache.values()) {
          if (this.isValidCacheEntry(cachedEntry)) {
            apiJob = cachedEntry.data.vacancies.find((job) => job.id === jobId);
            if (apiJob) break;
          }
        }
      }

      if (!apiJob) {
        console.warn(`Job ${jobId} not found after comprehensive search`);
        return null;
      }

      // Convert to our internal format and add external URL
      const convertedJob = this.convertToInternalFormat(apiJob);

      return {
        ...convertedJob,
        id: jobId, // Ensure the ID is preserved
        externalUrl:
          apiJob.url || `https://www.jobs.nhs.uk/candidate/jobadvert/${jobId}`,
      };
    } catch (error) {
      console.error("Error fetching job by ID:", error);
      return null;
    }
  }

  // Convert NHS API format to our internal database format
  convertToInternalFormat(apiJob: NhsJobFromApi) {
    // Parse salary range with improved regex and error handling
    let salaryMin: number | undefined;
    let salaryMax: number | undefined;

    if (apiJob.salary && typeof apiJob.salary === "string") {
      // console.log("Parsing salary:", apiJob.salary);

      // Handle various salary formats - improved regex
      if (apiJob.salary.toLowerCase().includes("negotiable")) {
        // Leave salary fields undefined for negotiable
      } else {
        // COMPLETELY FIXED salary matching - capture full numbers without decimals interfering
        const salaryMatch =
          apiJob.salary.match(/£?(\d+)\.?\d*\s*(?:to|-)\s*£?(\d+)\.?\d*/i) ||
          apiJob.salary.match(/£?(\d+)\.?\d*/i);

        if (salaryMatch) {
          const min = parseInt(salaryMatch[1]);
          const max = salaryMatch[2] ? parseInt(salaryMatch[2]) : undefined;

          // console.log("Parsed salary values:", {
          //   min,
          //   max,
          //   original: apiJob.salary,
          // });

          // Validate salary ranges
          if (min && min > 5000 && min < 300000) {
            salaryMin = min;
          }
          if (max && max > 5000 && max < 300000 && max > min) {
            salaryMax = max;
          }
        }
      }
    }

    // Extract NHS pay band from title or salary if possible, also check description
    let band = "";
    const bandMatch =
      apiJob.title.match(/band\s*(\d+[a-z]?)/i) ||
      apiJob.salary?.match(/band\s*(\d+[a-z]?)/i) ||
      apiJob.description?.match(/band\s*(\d+[a-z]?)/i);
    if (bandMatch) {
      band = `Band ${bandMatch[1].toUpperCase()}`;
    } else {
      // Fallback - guess band from salary range
      if (salaryMin) {
        if (salaryMin >= 20000 && salaryMin <= 25000) band = "Band 2-3";
        else if (salaryMin >= 25000 && salaryMin <= 35000) band = "Band 4-5";
        else if (salaryMin >= 35000 && salaryMin <= 45000) band = "Band 6-7";
        else if (salaryMin >= 45000 && salaryMin <= 60000) band = "Band 8a-8b";
        else if (salaryMin >= 60000) band = "Band 8c+";
      }
    }

    // Use first location for main location field
    const location = apiJob.locations[0] || "";

    return {
      externalId: apiJob.id,
      title: apiJob.title,
      employer: apiJob.employer,
      location: location,
      band: band,
      salaryMin: salaryMin,
      salaryMax: salaryMax,
      description: apiJob.description,
      closingDate: this.parseDate(apiJob.closeDate),
      isActive: true,
      featured: false, // We'll determine featured status based on our own criteria
      visaSponsorship: false, // Would need to parse description or have explicit field
    };
  }

  async getFeaturedJobs(limit: number = 10): Promise<NhsJobFromApi[]> {
    // Get recent, high-paying jobs as "featured"
    const result = await this.searchJobs({
      sort: "salaryDesc",
      page: 1,
    });

    return result.vacancies.slice(0, limit);
  }

  // Helper method to parse dates safely
  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Try parsing common NHS date formats
        const ukDateMatch = dateString.match(
          /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/
        );
        if (ukDateMatch) {
          const [, day, month, year] = ukDateMatch;
          const parsedDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );
          return isNaN(parsedDate.getTime()) ? null : parsedDate;
        }
        return null;
      }
      return date;
    } catch (error) {
      console.warn("Error parsing date:", dateString, error);
      return null;
    }
  }
}
