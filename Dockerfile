FROM node:18.16.1
WORKDIR /workspace/
COPY ["package.json", "package-lock.json", "/workspace/"]
RUN npm i
COPY ["index.js", "/workspace/"]
CMD node index.js
