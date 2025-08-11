const path = require('path');
const CrawlerController = require('./controllers/crawlerController');

const START_URL = process.env.START_URL || '';
const MAX_PAGES = parseInt(process.env.MAX_PAGES || '10', 10);
const WAIT_AFTER_CLICK_MS = parseInt(process.env.WAIT_AFTER_CLICK_MS || '600', 10);
const OUTPUT_PATH = process.env.OUTPUT_PATH || path.resolve(__dirname, 'results', 'cookies.json');
const HEADLESS = (process.env.HEADLESS || 'true') === 'true';

(async () => {
  const crawler = new CrawlerController(START_URL, MAX_PAGES, WAIT_AFTER_CLICK_MS, OUTPUT_PATH, HEADLESS);
  await crawler.start();
})();
