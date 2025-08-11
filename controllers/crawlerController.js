/**
 * crawlerController.js
 *
 * Controls the crawling process:
 * - Launches a Playwright Chromium browser instance
 * - Instantiates and runs the CrawlerModel
 * - Handles output directory creation
 * - Saves crawl results (visited URLs and cookie log) to a JSON file
 * - Logs key events and errors
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const CrawlerModel = require('../models/crawlerModel');
const CrawlerLogger = require('../views/crawlerLogger');

class CrawlerController {
  /**
   * @param {string} startUrl - URL to start crawling from.
   * @param {number} maxPages - Maximum number of pages to crawl.
   * @param {number} waitAfterClickMs - Milliseconds to wait after clicking interactive elements.
   * @param {string} outputPath - File path where crawl results will be saved.
   * @param {boolean} headless - Whether to run the browser in headless mode.
   */
  constructor(startUrl, maxPages, waitAfterClickMs, outputPath, headless) {
    this.startUrl = startUrl;
    this.maxPages = maxPages;
    this.waitAfterClickMs = waitAfterClickMs;
    this.outputPath = outputPath;
    this.headless = headless;
  }

  /**
   * Starts the crawl process:
   * - Ensures output directory exists
   * - Launches Chromium browser with specified options
   * - Creates a CrawlerModel instance and begins crawling from startUrl
   * - Writes the visited URLs and cookie log to outputPath as JSON
   * - Logs progress and errors
   */
  async start() {
    CrawlerLogger.info(`Starting crawl: ${this.startUrl}`);

    // Create output directory if missing.
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Launch browser with security-related flags.
    this.browser = await chromium.launch({
      headless: this.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      // Instantiate CrawlerModel with crawl parameters.
      const crawler = new CrawlerModel(
        this.startUrl,
        this.maxPages,
        this.waitAfterClickMs
      );

      // Begin crawling starting from startUrl.
      await crawler.crawl(this.startUrl, this.browser);

      // Save crawl results to JSON file.
      fs.writeFileSync(
        this.outputPath,
        JSON.stringify(
          {
            startedAt: new Date().toISOString(),
            visited: Array.from(crawler.visited),
            cookieLog: crawler.cookieLog,
          },
          null,
          2
        )
      );

      CrawlerLogger.info('Crawl completed');
      CrawlerLogger.info(`Results saved to ${this.outputPath}`);
    } catch (err) {
      // Log any fatal errors during crawling.
      CrawlerLogger.error('Crawler fatal error:', err);
    } finally {
      // Ensure browser is closed to free resources.
      await this.browser.close();
    }
  }
}

module.exports = CrawlerController;
