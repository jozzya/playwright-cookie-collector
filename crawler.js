/**
 * crawler.js
 * 
 * Entry point script for running the Playwright-based web crawler.
 * 
 * This script initialises the crawler controller with configuration
 * options supplied via environment variables (or default values)
 * and starts the crawling process.
 * 
 * Environment Variables:
 * - START_URL: The initial URL from which the crawler will begin.
 * - MAX_PAGES: Maximum number of pages to visit during the crawl.
 * - WAIT_AFTER_CLICK_MS: Milliseconds to wait after clicking interactive elements on a page.
 * - OUTPUT_PATH: File path to save the crawl results (cookies and visited URLs).
 * - HEADLESS: Whether to run the browser in headless mode.
 * 
 * The crawler visits pages within the same domain, interacts with clickable
 * div elements, captures cookie and recursively crawls discovered links
 * until MAX_PAGES limit is reached.
 * 
 * Usage example:
 *   START_URL=https://example.com MAX_PAGES=20 node crawler.js
 */
const path = require('path');
const CrawlerController = require('./controllers/crawlerController');

// Read configuration from environment variables or use the defaults.
const START_URL = process.env.START_URL || '';
const MAX_PAGES = parseInt(process.env.MAX_PAGES || '10', 10);
const WAIT_AFTER_CLICK_MS = parseInt(process.env.WAIT_AFTER_CLICK_MS || '600', 10);
const OUTPUT_PATH = process.env.OUTPUT_PATH || path.resolve(__dirname, 'results', 'cookies.json');
const HEADLESS = (process.env.HEADLESS || 'true') === 'true';

(async () => {
  // Create a new crawler controller instance with given configuration.
  const crawler = new CrawlerController(
    START_URL,
    MAX_PAGES,
    WAIT_AFTER_CLICK_MS,
    OUTPUT_PATH,
    HEADLESS
  );

  // Start the crawling process.
  await crawler.start();
})();
