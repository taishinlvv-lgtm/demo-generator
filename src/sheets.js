// シート連携：Apps Script の Web アプリ経由で読み書きする
// GOOGLE_SHEET_URL は Scout と同じ Apps Script の exec URL

const https = require("https");
const { URL } = require("url");

const SHEET_URL = process.env.GOOGLE_SHEET_URL;

function fetchRequests() {
  return new Promise(function (resolve, reject) {
    if (!SHEET_URL) return reject(new Error("GOOGLE_SHEET_URL 未設定"));
    const payload = JSON.stringify({ action: "getDemoRequests", sheet: "案件管理" });
    postToScript(payload, function (err, body) {
      if (err) return reject(err);
      try {
        const data = JSON.parse(body);
        if (!Array.isArray(data)) {
          return reject(new Error("予期しない応答: " + body.slice(0, 120)));
        }
        resolve(data);
      } catch (e) {
        reject(new Error("JSON解析失敗: " + body.slice(0, 120)));
      }
    });
  });
}

function markDone(row, url) {
  return new Promise(function (resolve, reject) {
    if (!SHEET_URL) return reject(new Error("GOOGLE_SHEET_URL 未設定"));
    const payload = JSON.stringify({
      action: "markDemoDone",
      sheet: "案件管理",
      row: row,
      url: url,
    });
    postToScript(payload, function (err, body) {
      if (err) return reject(err);
      resolve(body);
    });
  });
}

function postToScript(payload, cb) {
  let u;
  try { u = new URL(SHEET_URL); } catch (e) { return cb(new Error("URL不正")); }
  const options = {
    hostname: u.hostname,
    path: u.pathname + u.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
    timeout: 30000,
  };
  const req = https.request(options, function (res) {
    if (res.statusCode === 302 && res.headers.location) {
      followRedirect(res.headers.location, cb);
      res.resume();
      return;
    }
    let body = "";
    res.on("data", function (c) { body += c; });
    res.on("end", function () { cb(null, body); });
  });
  req.on("error", function (e) { cb(e); });
  req.on("timeout", function () { req.destroy(); cb(new Error("タイムアウト")); });
  req.write(payload);
  req.end();
}

function followRedirect(location, cb) {
  https.get(location, function (res) {
    let body = "";
    res.on("data", function (c) { body += c; });
    res.on("end", function () { cb(null, body); });
  }).on("error", function (e) { cb(e); });
}

module.exports = { fetchRequests, markDone };
