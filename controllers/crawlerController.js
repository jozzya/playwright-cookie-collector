/**
 * crawlerController.js
 *
 * Controls the crawling process:
 * - Launches Playwright Chromium browser instance
 * - Instantiates and runs CrawlerModel with concurrency
 * - Handles output directory creation using async fs
 * - Saves crawl results (visited URLs and cookie logs) to JSON file
 * - Logs key events and errors
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
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
   * @param {number} maxConcurrency - Maximum number of concurrent pages to crawl.
   */
  constructor(startUrl, maxPages, waitAfterClickMs, outputPath, headless, maxConcurrency) {
    this.startUrl = startUrl;
    this.maxPages = maxPages;
    this.waitAfterClickMs = waitAfterClickMs;
    this.outputPath = outputPath;
    this.headless = headless;
    this.maxConcurrency = maxConcurrency || 5;
  }

  /**
   * Starts the crawl process:
   * - Ensures output directory exists
   * - Launches Chromium browser with specified options
   * - Creates CrawlerModel instance and begins crawling
   * - Writes visited URLs and cookie logs to output file
   * - Logs progress and errors
   */
  async start() {
    CrawlerLogger.info(`Starting crawl: ${this.startUrl}`);

    try {
      // Create output directory if missing.
      const dir = path.dirname(this.outputPath);
      await fs.mkdir(dir, { recursive: true });

      // Launch browser with recommended security flags.
      CrawlerLogger.info('Launching browser...');
      this.browser = await chromium.launch({
        headless: this.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      // Instantiate CrawlerModel with concurrency settings.
      const crawler = new CrawlerModel(
        this.startUrl,
        this.maxPages,
        this.waitAfterClickMs,
        this.maxConcurrency
      );

      // Begin crawling.
      await crawler.crawl(this.browser);

      // Save crawl results to JSON.
      const outputData = {
        startedAt: new Date().toISOString(),
        visited: Array.from(crawler.visited),
        cookieLog: crawler.cookieLog,
      };

      await fs.writeFile(this.outputPath, JSON.stringify(outputData, null, 2), 'utf8');

      CrawlerLogger.info('Crawl completed');
      CrawlerLogger.info(`Results saved to ${this.outputPath}`);

    } catch (err) {
      CrawlerLogger.error('Crawler fatal error:', err);
    } finally {
      if (this.browser) {
        CrawlerLogger.info('Closing browser...');
        try {
          await this.browser.close();
        } catch (closeErr) {
          CrawlerLogger.error('Error closing browser:', closeErr);
        }
      }
    }
  }
}

module.exports = CrawlerController;
