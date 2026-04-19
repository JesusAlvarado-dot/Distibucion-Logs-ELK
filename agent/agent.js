const http = require("node:http");

const TARGET_HOST = process.env.TARGET_HOST || "log-server-1";
const TARGET_PORT = process.env.TARGET_PORT || 3000;
const SOURCE = process.env.SOURCE || "agent-1";

function sendLog() {
  const payload = JSON.stringify({
    level: "INFO",
    message: `Log enviado por ${SOURCE} a las ${new Date().toISOString()}`,
    source: SOURCE
  });

  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: "/logs",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload)
    }
  };

  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log(`[${SOURCE}] ${res.statusCode}: ${data}`);
    });
  });

  req.on("error", (err) => {
    console.error(`[${SOURCE}] Error: ${err.message}`);
  });

  req.write(payload);
  req.end();
}

sendLog();
setInterval(sendLog, 5000);