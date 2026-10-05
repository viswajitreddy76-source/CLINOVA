const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const sourceDir = path.resolve(__dirname, "src");
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

const server = http.createServer(async (request, response) => {
  let requestPath;
  try {
    requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request\n");
    return;
  }

  let filePath = path.resolve(sourceDir, `.${requestPath}`);
  if (filePath !== sourceDir && !filePath.startsWith(`${sourceDir}${path.sep}`)) {
    response.writeHead(403).end("Forbidden\n");
    return;
  }

  try {
    if ((await fs.promises.stat(filePath)).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch {
    response.writeHead(404).end("Not found\n");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  fs.createReadStream(filePath).pipe(response);
});

const port = Number(process.env.PORT || 5000);
server.listen(port, "0.0.0.0", () => {
  console.log(`CLINOVA is available on port ${port}`);
});
