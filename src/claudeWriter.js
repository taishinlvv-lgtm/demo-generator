// セバスの文章生成：店の情報から、デモサイトに差し込む日本語テキスト一式を作る

const https = require("https");

function generateCopy(shop) {
  return new Promise(function (resolve, reject) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log("  ANTHROPIC_API_KEY 未設定 → フォールバック文を使用");
      return resolve(fallback(shop));
    }

    const prompt =
      "あなたはWeb制作会社XmousyTimeの開発者セバスです。以下の飲食店向けに、高級感のあるデモサイトに載せる日本語テキストを作成します。\n\n" +
      "店名: " + (shop.name || "") + "\n" +
      "エリア: " + (shop.area || "") + "\n" +
      "ジャンル: " + (shop.category || "") + "\n\n" +
      "次のJSON形式のみで返してください。前置きやMarkdownは不要です。各項目は和モダンで上品な表現にし、誇張しすぎないこと。実在しない受賞歴や具体的数値は書かないこと。\n" +
      "{\n" +
      '  "HERO_HEADLINE": "トップの見出し。20字前後。句点で2行に分かれてよい（<br>で改行可）",\n' +
      '  "HERO_TEXT": "見出し下の説明文。60〜80字",\n' +
      '  "ABOUT_TITLE": "こだわりセクションの見出し。15字前後（<br>で改行可）",\n' +
      '  "ABOUT_TEXT_1": "こだわり本文1。60〜80字",\n' +
      '  "ABOUT_TEXT_2": "こだわり本文2。60〜80字",\n' +
      '  "MENU1_NAME": "代表メニュー名1", "MENU1_DESC": "説明30字前後",\n' +
      '  "MENU2_NAME": "代表メニュー名2", "MENU2_DESC": "説明30字前後",\n' +
      '  "MENU3_NAME": "代表メニュー名3", "MENU3_DESC": "説明30字前後",\n' +
      '  "CTA_HEADLINE": "予約を促す見出し。15字前後",\n' +
      '  "CTA_TEXT": "予約セクションの説明文。40字前後"\n' +
      "}";

    const data = JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    const options = {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(data),
      },
      timeout: 40000,
    };

    const req = https.request(options, function (res) {
      let body = "";
      res.on("data", function (c) { body += c; });
      res.on("end", function () {
        try {
          const json = JSON.parse(body);
          if (!json.content || !json.content[0]) {
            console.log("  API応答異常 → フォールバック");
            return resolve(fallback(shop));
          }
          const text = json.content[0].text.trim().replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(text);
          parsed.MENU1_PRICE = "";
          parsed.MENU2_PRICE = "";
          parsed.MENU3_PRICE = "";
          resolve(parsed);
        } catch (e) {
          console.log("  JSON解析失敗(" + shop.name + ") → フォールバック: " + e.message);
          resolve(fallback(shop));
        }
      });
    });
    req.on("error", function (e) {
      console.log("  API通信エラー → フォールバック: " + e.message);
      resolve(fallback(shop));
    });
    req.on("timeout", function () {
      req.destroy();
      console.log("  APIタイムアウト → フォールバック");
      resolve(fallback(shop));
    });
    req.write(data);
    req.end();
  });
}

function fallback(shop) {
  const area = shop.area || "地域";
  return {
    HERO_HEADLINE: "確かな一皿を、<br>あなたのために。",
    HERO_TEXT: area + "で大切にしてきた味を、ひとつひとつ丁寧にお届けします。特別な時間をお過ごしください。",
    ABOUT_TITLE: "素材へのこだわり。",
    ABOUT_TEXT_1: "厳選した素材を、最も美味しい状態でお出しすることを大切にしています。",
    ABOUT_TEXT_2: "一品一品に心を込めて。お客様にとって忘れられない一皿を目指しています。",
    MENU1_NAME: "おすすめ料理", MENU1_PRICE: "", MENU1_DESC: "当店自慢の一品です。",
    MENU2_NAME: "季節の逸品", MENU2_PRICE: "", MENU2_DESC: "旬の素材を使った料理です。",
    MENU3_NAME: "本日のコース", MENU3_PRICE: "", MENU3_DESC: "特別な日にふさわしいコース。",
    CTA_HEADLINE: "ご予約をお待ちしております。",
    CTA_TEXT: "ご宴会・ご記念日など、お気軽にお問い合わせください。",
  };
}

module.exports = { generateCopy };
