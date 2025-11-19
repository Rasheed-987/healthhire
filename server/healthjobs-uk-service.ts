import puppeteer from "puppeteer";

export interface HealthJobsUkCategory {
  name: string;
  url: string;
}

export interface HealthJobsUkJob {
  title: string;
  employer: string;
  location: string;
  salary: string;
  grade: string;
  band: string; // ✅ Added for consistency
  speciality: string;
  url: string;
  description?: string;
  id?: string;
  closeDate?: string;
}

console.log("🩺 HealthJobsUkService module loaded");

export class HealthJobsUkService {
  private readonly baseUrl = "https://www.healthjobsuk.com";

  async getCategoriesAndJobs(): Promise<HealthJobsUkJob[]> {
    console.log("📡 Fetching job categories from HealthJobsUK...");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(`${this.baseUrl}/`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // 🍪 Handle cookie consent popup
    try {
      const acceptBtn = await page.$("button#onetrust-accept-btn-handler");
      if (acceptBtn) {
        await acceptBtn.click();
        console.log("🍪 Accepted cookie banner");
        await page.waitForTimeout(2000);
      }
    } catch {
      console.log("No cookie popup found, continuing...");
    }

    // 🕐 Wait for category list
    try {
      await page.waitForFunction(
        () => document.querySelectorAll("ul.list-group li a").length > 0,
        { timeout: 60000 }
      );
      console.log("✅ Category elements detected in DOM");
    } catch {
      console.warn("⚠️ Categories not detected, taking screenshot...");
      await page.screenshot({ path: "healthjobsuk_debug.png", fullPage: true });
      console.log("📸 Screenshot saved: healthjobsuk_debug.png");
    }

    // 🧩 Extract categories
    const categories: HealthJobsUkCategory[] = await page.evaluate(() => {
      const categoryElements = Array.from(
        document.querySelectorAll("ul.list-group li a")
      );
      return categoryElements.map((a) => {
        const name =
          a
            .querySelector(".hj-css-sector-default-buttons")
            ?.textContent?.trim() ||
          a.textContent?.trim() ||
          "";
        const href = a.getAttribute("href") || "";
        const url = href.startsWith("http")
          ? href
          : `https://www.healthjobsuk.com${href}`;
        return { name, url };
      });
    });

    console.log(`✅ Found ${categories.length} categories`);
    console.table(categories.slice(0, 5));

    const allJobs: HealthJobsUkJob[] = [];

    // 🌀 Loop through categories and collect jobs
    for (const category of categories) {
      try {
        console.log(`➡️ Visiting category: ${category.name}`);
        await page.goto(category.url, {
          waitUntil: "networkidle2",
          timeout: 60000,
        });

        await page.waitForSelector("#JobSearch", { timeout: 20000 });

        const safeSelect = async (selector: string, value: string) => {
          const exists = await page.$(selector);
          if (exists) {
            await page.select(selector, value).catch(() => {});
          }
        };

        await safeSelect("#JobSearch.d", "");
        await safeSelect("#JobSearch.g", "");
        await safeSelect("#JobSearch.re\\.0", "1");
        await safeSelect("#JobSearch.re\\.1", "1-_-_-");
        await safeSelect("#JobSearch.re\\.2", "1-_-_--_-_-");

        await page.click("#JobSearch\\.Submit");
        try {
          await page.waitForSelector("li.hj-job, .hj-jobtitle", {
            timeout: 60000,
          });
          console.log(`✅ Jobs loaded for ${category.name}`);
        } catch {
          console.warn(`⚠️ No jobs visible or slow load for ${category.name}`);
        }

        console.log(`✅ Search submitted successfully for ${category.name}`);

        const jobs = await this.extractAllJobs(page);

        console.log(
          `📦 Found ${jobs.length} jobs in ${category.name}. Sample:`,
          jobs.slice(0, 3)
        );

        allJobs.push(...jobs);
      } catch (err) {
        console.error(`❌ Error processing category ${category.name}:`, err);
      }
    }

    await browser.close();
    console.log(`🏁 Completed all categories. Total jobs: ${allJobs.length}`);

    // ✅ FIXED: Return all jobs instead of categories
    return allJobs;
  }

  private async extractAllJobs(
    page: puppeteer.Page
  ): Promise<HealthJobsUkJob[]> {
    const jobs: HealthJobsUkJob[] = [];

    while (true) {
      await page
        .waitForSelector("li.hj-job", { timeout: 20000 })
        .catch(() => {});

      const pageJobs = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll("li.hj-job"));
        return items.map((el) => {
          const title =
            el.querySelector(".hj-jobtitle")?.textContent?.trim() || "";
          const employer =
            el.querySelector(".hj-employername")?.textContent?.trim() || "";
          const location =
            el.querySelector(".hj-locationtown")?.textContent?.trim() || "";
          const salary =
            el
              .querySelector(".hj-salary")
              ?.textContent?.replace("Salary:", "")
              .trim() || "";
          const grade =
            el
              .querySelector(".hj-grade")
              ?.textContent?.replace("Grade:", "")
              .trim() || "";
          const speciality =
            el
              .querySelector(".hj-primaryspeciality")
              ?.textContent?.replace("Speciality:", "")
              .trim() || "";
          const href =
            (el.querySelector("a") as HTMLAnchorElement)?.getAttribute(
              "href"
            ) || "";
          const url = href.startsWith("http")
            ? href
            : `https://www.healthjobsuk.com${href}`;
          return { title, employer, location, salary, grade, speciality, url };
        });
      });

      console.log(`🧾 Extracted ${pageJobs.length} jobs on current page`);
      jobs.push(...pageJobs);

      const nextButton = await page.$("a[rel='next'], .pagination a.next");
      if (nextButton) {
        console.log(`➡️ Going to next page (${jobs.length} jobs so far)`);
        await Promise.all([
          nextButton.click(),
          page.waitForNavigation({ waitUntil: "networkidle2", timeout: 60000 }),
        ]);
      } else {
        console.log("🚫 No more pages");
        break;
      }
    }

    return jobs;
  }

  async getJobById(jobUrl: string) {
    console.log(`🔍 Fetching job details from: ${jobUrl}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(jobUrl, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Extract job details
    const job = await page.evaluate(() => {
      const getText = (sel: string) =>
        document.querySelector(sel)?.textContent?.trim() || "";

      return {
        title: getText(".hj-jobtitle, h1"),
        employer: getText(".hj-employername, .employer"),
        location: getText(".hj-locationtown, .location"),
        salary: getText(".hj-salary, .salary"),
        grade: getText(".hj-grade, .grade"),
        speciality: getText(".hj-primaryspeciality, .speciality"),
        description:
          document.querySelector(".hj-jobdetails, .job-description")
            ?.innerHTML || "",
      };
    });

    job.url = jobUrl;
    job.id = jobUrl;

    await browser.close();
    console.log(`✅ Extracted job: ${job.title}`);
    return job;
  }

  async searchJobs(params: {
    keyword?: string;
    location?: string;
    page?: number;
  }) {
    console.log("🌐 HealthJobsUK: starting searchJobs()...");
    const jobs = await this.getCategoriesAndJobs();

    return {
      jobs: jobs.map((job) => ({
        ...job,
        description: "",
        id: job.url,
      })),
      totalResults: jobs.length,
    };
  }

  convertToInternalFormat(job: any) {
    return {
      title: job.title,
      employer: job.employer,
      location: job.location,
      description: job.description,
      url: job.url,
      band: job.band || job.grade || "",
      salary: job.salary || "",
      closingDate: job.closeDate || "",
    };
  }
}
