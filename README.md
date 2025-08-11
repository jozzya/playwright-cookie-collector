# Playwright Cookie Collector

## Overview

This tool crawls a website starting from a specified URL, visiting pages up to a set limit. It captures all cookies set during page visits and interactions (such as clicking interactive divs). 

The output is saved as a JSON file containing detailed cookie information with timestamps and page URLs.

It is designed to only visit pages within the starting domain and avoid external navigations.

## Features

- Controlled crawl depth by limiting the number of pages visited.
- Captures cookies after initial page load and after interacting with clickable div elements.
- Saves results in a structured JSON file.
- Dockerised for easy deployment.

## Prerequisites

- [Docker](https://www.docker.com/)

## Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:jozzya/playwright-cookie-collector.git playwright-cookie-collector
   cd playwright-cookie-collector
   ```

2. Build the docker environment
```
docker build --no-cache -t playwright-crawler:latest .
```
3. Run the docker script
```
docker run --rm \
  -e START_URL="https://change-me.com" \
  -e MAX_PAGES=10 \
  -e HEADLESS=true \
  -e WAIT_AFTER_CLICK_MS=600 \
  -e OUTPUT_PATH="/app/results/cookies.json" \
  -v "$(pwd)/results":/app/results \
  playwright-crawler
```
4. Review the cookies.json for all unique cookies found by the crawler.
