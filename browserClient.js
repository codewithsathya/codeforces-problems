const { executablePath } = require("puppeteer");
const puppeteer = require("puppeteer-extra")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")

puppeteer.use(StealthPlugin());;

class BrowserClient {
    browser = null;
    page = null;
    browserExecutablePath = null;
    cacheDir = null;

    async initialize() {
        this.browser = await puppeteer.launch({
            enableExtensions: false,
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
        this.page = (await this.browser.pages())[0];

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
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        );
    }

    close() {
        if (this.browser) {
            this.browser.close();
            this.browser = null;
        }
    }

    async getData(url, retries = 1) {
        if (!this.page) {
            throw new Error("not-initialized");
        }

        try {
            const rawHtmlPromise = new Promise((resolve) => {
                this.page.on("response", async (response) => {
                    if (
                        response.url() === url &&
                        response.request().resourceType() === "document"
                    ) {
                        resolve(await response.text());
                    }
                });
            });

            await this.page.goto(url, { waitUntil: "domcontentloaded" });

            const rawHtml = await rawHtmlPromise;
            return rawHtml;
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

module.exports = {
    browserClient: new BrowserClient()
}
