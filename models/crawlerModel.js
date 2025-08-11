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
  constructor(startUrl, maxPages, waitAfterClickMs) {
    this.startUrl = startUrl;
    this.maxPages = maxPages;
    this.waitAfterClickMs = waitAfterClickMs || 1000;
    this.visited = new Set();
    this.recordedCookieNames = new Set();
    this.cookieLog = [];
    this.startHostname = new URL(startUrl).hostname;
  }

  /**
   * Check if a hostname is the same or subdomain of the start hostname.
   * @param {string} hostname - Hostname to check.
   * @returns {boolean} True if hostname is within the crawl domain.
   */
  isSameDomain(hostname) {
    return (
      hostname === this.startHostname ||
      hostname.endsWith('.' + this.startHostname)
    );
  }

  /**
   * Capture and log new cookies from the current page context.
   * Avoid logging duplicate cookie names.
   */
  async captureCookies(page, stepDescription) {
    try {
      const cookies = await page.context().cookies();
      
      // Filter out cookies that have already been recorded.
      const newCookies = cookies.filter(
        (cookie) => !this.recordedCookieNames.has(cookie.name)
      );
      if (newCookies.length === 0) return;

      // Mark new cookie names as recorded.
      newCookies.forEach((cookie) => this.recordedCookieNames.add(cookie.name));

      // Log cookie capture event.
      this.cookieLog.push({
        url: page.url(),
        step: stepDescription,
        timestamp: new Date().toISOString(),
        cookies: newCookies,
      });
    } catch (err) {
      throw new Error(`captureCookies error: ${err.message || err}`);
    }
  }

  /**
   * Check if an element handle is visible and clickable.
   */
  async isVisibleAndClickable(page, handle) {
    try {
      const box = await handle.boundingBox();
      if (!box || box.width === 0 || box.height === 0) return false;

      const visible = await handle.isVisible();
      if (!visible) return false;

      // Check if the element has a disabled attribute.
      const disabled = await handle.getAttribute('disabled');
      if (disabled !== null) return false;

      return true;
    } catch (err) {
      // On any error, assume not clickable.
      return false;
    }
  }

  /**
   * Find and click on interactive div elements on the page.
   * Targets divs with role="button" or tabindex attribute.
   * Waits for a configured time after each click.
   * Ignores errors during clicking.
   */
  async interactWithDivs(page) {
    // Select div elements that may be clickable.
    const divs = await page.$$('div[role="button"], div[tabindex]');
    for (const div of divs) {
      if (await this.isVisibleAndClickable(page, div)) {
        try {
          await div.click();
          
          // Wait after clicking to allow page update or navigation.
          await page.waitForTimeout(this.waitAfterClickMs);
        } catch (err) {
          // Ignore errors such as detached elements or navigation interrupts.
        }
      }
    }
  }

  /**
   * Crawl a single URL, capture cookies, interact with divs,
   * extract same-domain links, and recursively crawl them.
   * @param {string} url - URL to crawl.
   * @param {import('playwright').Browser} browser - Playwright browser instance.
   */
  async crawl(url, browser) {
    if (this.visited.has(url)) return; // Skip already visited URLs
    if (this.visited.size >= this.maxPages) return; // Respect max pages limit
    this.visited.add(url);

    console.log(`[INFO] Visiting: ${url} (visited: ${this.visited.size})`);

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Navigate to the URL and wait for DOM content to load.
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Ensure page is within the same domain.
      if (!this.isSameDomain(new URL(page.url()).hostname)) {
        await page.close();
        await context.close();
        return;
      }

      // Capture cookies after initial load.
      await this.captureCookies(page, 'initial load');

      // Interact with clickable divs on the page.
      await this.interactWithDivs(page);

      // Extract all same domain anchor links for recursive crawling.
      const anchors = await page.$$('a[href]');
      const links = [];

      for (const anchor of anchors) {
        const href = await anchor.getAttribute('href');
        if (!href) continue;

        try {
          // Resolve relative URLs to absolute.
          const absoluteUrl = new URL(href, page.url()).toString();

          // Check domain and visited status.
          if (
            this.isSameDomain(new URL(absoluteUrl).hostname) &&
            !this.visited.has(absoluteUrl)
          ) {
            links.push(absoluteUrl);
          }
        } catch {
          // Ignore invalid URLs.
        }
      }

      // Close page and context before recursion to release resources.
      await page.close();
      await context.close();

      // Recursively crawl extracted links respecting max page limit.
      for (const link of links) {
        if (this.visited.size >= this.maxPages) break;
        await this.crawl(link, browser);
      }
    } catch (err) {
      // On error - attempt to clean up resources.
      try {
        await page.close();
        await context.close();
      } catch {}

      // Rethrow error for handling upstream.
      throw err;
    }
  }
}

module.exports = CrawlerModel;
