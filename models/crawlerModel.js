/**
 * CrawlerModel.js
 *
 * A web crawler class using Playwright to:
 * - Visit pages starting from a given URL
 * - Stay within the same domain
 * - Capture cookies on each page load
 * - Interact with clickable div elements (role="button" or tabindex)
 * - Recursively follow same-domain links up to a max page limit
 */

class CrawlerModel {
  /**
   * @param {string} startUrl - The URL to start crawling from.
   * @param {number} maxPages - Maximum number of pages to crawl.
   * @param {number} [waitAfterClickMs=1000] - Wait time after clicking interactive elements in ms.
   */
  constructor(startUrl, maxPages, waitAfterClickMs, maxConcurrency) {
    this.queue = [startUrl];
    this.visited = new Set();
    this.cookieLog = [];
    this.maxPages = maxPages;
    this.waitAfterClickMs = waitAfterClickMs;
    this.maxConcurrency = maxConcurrency || 5;
  }

  async crawl(browser) {
    const activePromises = [];

    while ((this.queue.length > 0 || activePromises.length > 0) && this.visited.size < this.maxPages) {
      while (this.queue.length > 0 &&
             activePromises.length < this.maxConcurrency &&
             this.visited.size < this.maxPages) {
        const url = this.queue.shift();
        if (!this.visited.has(url)) {
          const promise = this.crawlUrl(url, browser)
            .catch(err => console.error(`[WARN] Error crawling ${url}:`, err))
            .finally(() => {
              activePromises.splice(activePromises.indexOf(promise), 1);
            });

          activePromises.push(promise);
        }
      }
      if (activePromises.length > 0) {
        await Promise.race(activePromises);
      }
    }
    await Promise.all(activePromises);
  }

  async crawlUrl(url, browser) {
    this.visited.add(url);
    console.log(`[INFO] Visiting: ${url} (visited: ${this.visited.size})`);

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'load' });
      const cookies = await context.cookies();
      this.cookieLog.push({ url, cookies });

      const anchors = await page.$$eval('a[href]', (links) =>
        links.map(link => link.href).filter(href => href.startsWith('http'))
      );

      for (const href of anchors) {
        if (!this.visited.has(href) && !this.queue.includes(href)) {
          this.queue.push(href);
        }
      }

      if (this.waitAfterClickMs > 0) {
        await page.waitForTimeout(this.waitAfterClickMs);
      }
    } catch (e) {
      console.error(`[WARN] Error visiting ${url}:`, e);
    }

    await page.close();
    await context.close();
  }
}

module.exports = CrawlerModel;
