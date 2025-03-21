FROM node:22.4.1-alpine
COPY src/ ./src
COPY package.json ./
COPY tsconfig.json ./
RUN apk add --no-cache aws-cli
RUN npm install
ENTRYPOINT ["npx", "ts-node", "src/pollingService/pollingService.ts"]