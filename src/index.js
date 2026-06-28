// セバス：デモサイト自動生成のメイン処理
// 案件管理シートから「デモ依頼」のある店を探し、テンプレートに差し込んでHTMLを出力する

const fs = require("fs");
const path = require("path");
const { fetchRequests, markDone } = require("./sheets");
const { generateCopy } = require("./claudeWriter");
const { renderTemplate } = require("./renderer");

async function main() {
  console.log("=== セバス デモ生成 開始 ===");

  let requests;
  try {
    requests = await fetchRequests();
  } catch (e) {
    console.log("シート読み取りエラー: " + e.message);
    process.exit(1);
  }

  if (!requests || requests.length === 0) {
    console.log("デモ依頼のある店舗はありません。終了します。");
    return;
  }

  console.log("デモ依頼: " + requests.length + "件");

  const outDir = path.join(__dirname, "..", "docs");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const results = [];

  for (const shop of requests) {
    console.log("\n制作中: " + shop.name + "（" + shop.area + "・" + shop.category + "）");

    let copy;
    try {
      copy = await generateCopy(shop);
    } catch (e) {
      console.log("  文章生成エラー: " + e.message + " → スキップ");
      continue;
    }

    let html;
    try {
      html = renderTemplate(shop, copy);
    } catch (e) {
      console.log("  差し込みエラー: " + e.message + " → スキップ");
      continue;
    }

    const slug = makeSlug(shop, results.length);
    const fileName = slug + ".html";
    fs.writeFileSync(path.join(outDir, fileName), html, "utf8");
    console.log("  生成完了: docs/" + fileName);

    results.push({ row: shop.row, name: shop.name, fileName: fileName });
    await sleep(1200);
  }

  if (results.length > 0) {
    const baseUrl = process.env.PAGES_BASE_URL || "";
    for (const r of results) {
      const url = baseUrl ? (baseUrl.replace(/\/$/, "") + "/" + r.fileName) : ("docs/" + r.fileName);
      try {
        await markDone(r.row, url);
        console.log("シート更新: " + r.name + " → " + url);
      } catch (e) {
        console.log("シート更新エラー(" + r.name + "): " + e.message);
      }
    }
  }

  console.log("\n=== 完了: " + results.length + "件生成 ===");
}

function makeSlug(shop, idx) {
  const d = new Date();
  const stamp = "" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
  let base = (shop.name || "").replace(/[^A-Za-z0-9]/g, "");
  if (!base) base = "shop" + (shop.row || idx);
  return "demo_" + base + "_" + (shop.row || idx) + "_" + stamp;
}

function pad(n) { return n < 10 ? "0" + n : "" + n; }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

main().catch(function (e) {
  console.log("致命的エラー: " + e.message);
  process.exit(1);
});
