import { executablePath } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

class BrowserClient {
  private browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  private page: Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>["newPage"]>> | null = null;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      executablePath: executablePath(),
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
        "--disable-features=site-per-process",
      ],
    });
    const pages = await this.browser.pages();
    this.page = pages[0];

    await this.page.setRequestInterception(true);
    this.page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await this.page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
  }

  close(): void {
    if (this.browser) {
      this.browser.close();
      this.browser = null;
    }
  }

  async getData(url: string, retries = 1): Promise<string> {
    if (!this.page) {
      throw new Error("not-initialized");
    }

    const page = this.page;

    try {
      const rawHtmlPromise = new Promise<string>((resolve) => {
        page.on("response", async (response) => {
          if (
            response.url() === url &&
            response.request().resourceType() === "document"
          ) {
            resolve(await response.text());
          }
        });
      });

      await page.goto(url, { waitUntil: "domcontentloaded" });

      return await rawHtmlPromise;
    } catch (error) {
      if (retries > 0) {
        await this.initialize();
        return this.getData(url, retries - 1);
      } else {
        throw error;
      }
    }
  }
}

export const browserClient = new BrowserClient();
