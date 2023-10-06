FROM node:18.16.1
WORKDIR /workspace/
COPY ["package.json", "package-lock.json", "/workspace/"]
RUN npm i
COPY ["index.ts", "tsconfig.json", "/workspace/"]
RUN npx tsc
CMD node index.js
