import { load } from "cheerio"; // npm install cheerio
import { parseStringPromise } from "xml2js"; // still needed for consistency with other feeds

import puppeteer from "puppeteer";

export interface ScotNhsJobFromApi {
  externalId: string;
  id: string;
  title: string;
  employer: string;
  description: string;
  closeDate: string;
  postDate: string;
  location: string;
  reference: string;
  salary: string;
  band: string;
  jobFamily: string;
  employmentType: string;
  hoursPerWeek: string;
  department: string;
  url: string;
}

export interface ScotNhsJobsApiResponse {
  totalResults: number;
  jobs: ScotNhsJobFromApi[];
}

function safeParseDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date.toISOString();

  // Try UK-style dd/mm/yyyy
  const ukMatch = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ukMatch) {
    const [, day, month, year] = ukMatch;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }

  return null; // fallback for invalid dates
}
export class ScotNhsJobsService {
  private recentSearchCache = new Map<string, ScotNhsJobsApiResponse>();
  private extractBandFromSalary(salary: string): {
    band: string;
    cleanSalary: string;
  } {
    if (!salary) return { band: "", cleanSalary: "" };

    // Example: "Band 5 (£33,247 - £41,424)"
    const bandMatch = salary.match(/Band\s*([0-9]+[A-Za-z]?)/i);
    const band = bandMatch ? `Band ${bandMatch[1].toUpperCase()}` : "";

    // Remove "Band 5" or similar from the salary text
    const cleanSalary = salary.replace(/Band\s*[0-9]+[A-Za-z]?\s*/i, "").trim();

    return { band, cleanSalary };
  }

  async searchJobs(
    params: { keyword?: string; location?: string; employer?: string } = {}
  ): Promise<ScotNhsJobsApiResponse> {
    // console.log("📡 Fetching NHS Scotland jobs using Puppeteer...");

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://apply.jobs.scot.nhs.uk/Home/Job", {
      waitUntil: "networkidle2",
    });

    const jobs: ScotNhsJobFromApi[] = await page.evaluate(() => {
      const jobElements = Array.from(
        document.querySelectorAll("div.card-body.p-20")
      );

      return jobElements.map((el) => {
        const titleEl = el.querySelector("div.job-row__details a");
        const title = titleEl?.textContent?.trim() || "";

        const href = titleEl?.getAttribute("href") || "";
        const url = href.startsWith("http")
          ? href
          : `https://apply.jobs.scot.nhs.uk${href}`;

        const reference =
          el
            .querySelector(".jobreference")
            ?.textContent?.replace("Job reference:", "")
            .trim() || "";
        const salary =
          el
            .querySelector(".salary")
            ?.textContent?.replace("Salary:", "")
            .trim() || "";
        const closeDate =
          el
            .querySelector(".closingdate")
            ?.textContent?.replace("Closing date:", "")
            .trim() || "";
        const jobFamily =
          el
            .querySelector(".department")
            ?.textContent?.replace("Job Family:", "")
            .trim() || "";
        const location =
          el
            .querySelector(".location")
            ?.textContent?.replace("Location:", "")
            .trim() || "";
        const employmentType =
          el
            .querySelector(".employmenttype")
            ?.textContent?.replace("Employment type:", "")
            .trim() || "";
        const hoursPerWeek =
          el
            .querySelector(".hours")
            ?.textContent?.replace("Hours per week:", "")
            .trim() || "";
        const postDate =
          el
            .querySelector(".livedate")
            ?.textContent?.replace("Live date:", "")
            .trim() || "";
        const employer =
          el
            .querySelector(".school")
            ?.textContent?.replace("Employer (NHS Board):", "")
            .trim() || "NHS Scotland";
        const department =
          el
            .querySelector(".shift")
            ?.textContent?.replace("Department:", "")
            .trim() || "";

        const description = ""; // if you want full description, might need to navigate to job detail page

        return {
          id: reference || title,
          title,
          employer,
          description,
          closeDate,
          postDate,
          location,
          reference,
          salary,
          band: "", // optional: parse from salary text like "Band 4"
          jobFamily,
          employmentType,
          hoursPerWeek,
          department,
          url,
        };
      });
    });

    await browser.close();

    // Apply filters
    const now = new Date();
    let filteredJobs = jobs.filter((job) => {
      const parsedClose = safeParseDate(job.closeDate);
      if (!parsedClose) return true;
      const closeDate = new Date(parsedClose);
      return closeDate >= now; // keep only if closing date is today or future
    });
    if (params.keyword)
      filteredJobs = filteredJobs.filter((j) =>
        j.title.toLowerCase().includes(params.keyword!.toLowerCase())
      );
    if (params.location)
      filteredJobs = filteredJobs.filter((j) =>
        j.location.toLowerCase().includes(params.location!.toLowerCase())
      );
    if (params.employer)
      filteredJobs = filteredJobs.filter((j) =>
        j.employer.toLowerCase().includes(params.employer!.toLowerCase())
      );

    const result = { totalResults: filteredJobs.length, jobs: filteredJobs };

    const cacheKey = JSON.stringify(params);
    this.recentSearchCache.set(cacheKey, result);
    if (this.recentSearchCache.size > 50)
      this.recentSearchCache.delete(this.recentSearchCache.keys().next().value);

    // console.log(`✅ Parsed ${filteredJobs.length} jobs from NHS Scotland`);

    return result;
  }
  async getJobById(jobId: string): Promise<ScotNhsJobFromApi | null> {
    // console.log(`🔍 Fetching detailed job info for NHS Scotland ID: ${jobId}`);

    const cleanId = jobId.replace(/^scot_/, "").trim();
    const url = `https://apply.jobs.scot.nhs.uk/Job/JobDetail?JobId=${cleanId}`;
    // console.log(`Constructed URL for job ID ${jobId}: ${url}`);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      await page.waitForSelector("h1, .jobreference", { timeout: 20000 });
      // Defensive patch for Puppeteer serialization bug
      if (typeof __name === "undefined") {
        var __name = null;
      }

      const job = await page.evaluate(`
  (() => {
    function getByTestId(id) {
      const el = document.querySelector('[data-testid="' + id + '"]');
      return el ? el.textContent.trim() : "";
    }

    const title =
      document.querySelector("h1")?.textContent?.trim() ||
      document.querySelector(".job-title")?.textContent?.trim() ||
      "";

    const reference = getByTestId("span-reference");
    const salary = getByTestId("span-salary");
    const closeDate =
      document.querySelector('[data-testid="div-vacancies-close-date"] span')
        ?.textContent?.trim() || "";

    const jobType = getByTestId("span-vacancies-department");
    const location = getByTestId("span-vacancies-location-name");
    const employmentType = getByTestId("span-vacancies-employment-type");
    const hoursPerWeek = getByTestId("span-sub-vacancies-hours");
    const postDate =
      document.querySelector('[data-testid="div-vacancies-live-date"] span')
        ?.textContent?.trim() || "";
    const employer = getByTestId("span-vacancies-school") || "NHS Scotland";
    const department = getByTestId("span-vacancies-shift-pattern");
   
let descriptionEl = document.querySelector(".Table.cke_show_border td");
let description = "";
if (descriptionEl) {
  description = descriptionEl.innerHTML.trim();
} else {
  const alt = document.querySelector(".jt-opensans-regular");
  if (alt) description = alt.innerText.trim();
}


    return {
      id: reference || title,
      title,
      employer,
      description,
      closeDate,
      postDate,
      location,
      reference,
      salary,
      band: "",
      jobFamily: jobType,
      employmentType,
      hoursPerWeek,
      department,
      url: window.location.href,
    };
  })()
`);

      const { band, cleanSalary } = this.extractBandFromSalary(job.salary);

      const unified: ScotNhsJobFromApi = {
        externalId: jobId,
        ...job,
        salary: cleanSalary,
        band,
      };
      // console.log("Job details fetched from page:", job);
      // console.log("Fetched job details:", unified);
      // console.log(`✅ Job ${jobId} fetched successfully`);
      return unified;
    } catch (err) {
      console.error(`❌ Failed to fetch job ${jobId}:`, err);
      return null;
    } finally {
      await browser.close();
    }
  }

  processJobList(jobs: ScotNhsJobFromApi[]): ScotNhsJobFromApi[] {
    return jobs.map((job) => {
      const { band, cleanSalary } = this.extractBandFromSalary(job.salary);
      return { ...job, salary: cleanSalary, band };
    });
  }

  /** Convert NHS Scotland job to your internal standard format */
  convertToInternalFormat(job: ScotNhsJobFromApi) {
    // Example: parse salary if available
    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    if (job.salary) {
      const match = job.salary.match(/£([\d,.]+)(?:\s*to\s*£([\d,.]+))?/);
      if (match) {
        salaryMin = parseFloat(match[1].replace(/,/g, ""));
        salaryMax = match[2] ? parseFloat(match[2].replace(/,/g, "")) : null;
      }
    }

    return {
      title: job.title,
      employer: job.employer,
      location: job.location,
      band: job.band || null,
      salaryMin,
      salaryMax,
      description: job.description,
      personSpec: "", // if available, parse separately
      visaSponsorship: false, // default false unless mentioned
      featured: false, // if NHS Scotland has featured flag, map it
      closingDate: safeParseDate(job.closeDate),
      reference: job.reference,
      url: job.url,
      externalId: job.id,
      postDate: safeParseDate(job.postDate),
    };
  }
}
