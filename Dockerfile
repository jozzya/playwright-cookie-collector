FROM mcr.microsoft.com/playwright:v1.54.2

WORKDIR /app

COPY package.json package-lock.json* /app/
RUN npm install

COPY . /app/

RUN mkdir -p /app/results
VOLUME ["/app/results"]

ENV MAX_PAGES="10"
ENV HEADLESS="true"
ENV OUTPUT_PATH="/app/results/cookies.json"
ENV WAIT_AFTER_CLICK_MS="600"

CMD ["node", "crawler.js"]
