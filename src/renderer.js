// テンプレート差し込み：店情報＋Claude生成テキストをHTMLに埋め込む
const fs = require("fs");
const path = require("path");

function renderTemplate(shop, copy) {
  const tplPath = path.join(__dirname, "..", "templates", "standard.html");
  let html = fs.readFileSync(tplPath, "utf8");

  // 機械的に入る情報（シート由来）。店名は伏せる方針なのでLOGO表示のまま、
  // テンプレ内の店名関連はテンプレ側で既にLOGO化済み。
  // 画像は空（=素材待ち案内が出る）。地図は店名+エリアで検索リンク化。
  const mapQuery = encodeURIComponent((shop.area || "") + " " + (shop.name || ""));
  const values = {
    AREA: shop.area || "",
    CATEGORY: shop.category || "",
    ADDRESS: shop.address || "（住所はお店からご提供いただきます）",
    PHONE: shop.phone || "",
    HOURS: shop.hours || "（営業時間はお店からご提供いただきます）",
    CLOSED: shop.closed || "（定休日はお店からご提供いただきます）",
    ACCENT: "#C8A96E",
    HERO_IMAGE: "",   // 空＝素材待ち案内
    ABOUT_IMAGE: "",  // 空＝素材待ち案内
    MAP_URL: "https://www.google.com/maps/search/?api=1&query=" + mapQuery,
    // Claude生成テキスト
    HERO_HEADLINE: copy.HERO_HEADLINE || "",
    HERO_TEXT: copy.HERO_TEXT || "",
    ABOUT_TITLE: copy.ABOUT_TITLE || "",
    ABOUT_TEXT_1: copy.ABOUT_TEXT_1 || "",
    ABOUT_TEXT_2: copy.ABOUT_TEXT_2 || "",
    MENU1_NAME: copy.MENU1_NAME || "", MENU1_PRICE: copy.MENU1_PRICE || "", MENU1_DESC: copy.MENU1_DESC || "",
    MENU2_NAME: copy.MENU2_NAME || "", MENU2_PRICE: copy.MENU2_PRICE || "", MENU2_DESC: copy.MENU2_DESC || "",
    MENU3_NAME: copy.MENU3_NAME || "", MENU3_PRICE: copy.MENU3_PRICE || "", MENU3_DESC: copy.MENU3_DESC || "",
    CTA_HEADLINE: copy.CTA_HEADLINE || "",
    CTA_TEXT: copy.CTA_TEXT || "",
  };

  // メニュー価格が空のときは「時価/応相談」と分かる表示にせず、価格行を控えめにする
  // テンプレ側は {{MENUx_PRICE}} をそのまま表示するので、空なら空文字でOK

  for (const key in values) {
    // {{KEY}} を全置換
    const re = new RegExp("\\{\\{" + key + "\\}\\}", "g");
    html = html.replace(re, values[key]);
  }

  // 未置換のプレースホルダーが残っていないか軽くチェックし、残れば空にする
  html = html.replace(/\{\{[A-Z_0-9]+\}\}/g, "");

  return html;
}

module.exports = { renderTemplate };
