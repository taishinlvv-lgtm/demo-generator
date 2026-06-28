# セバス：デモサイト自動生成システム（demo-generator）

案件管理シートで「デモ依頼」とマークした店舗のデモサイトを、
Claude がテキストを生成し、テンプレートに差し込んで自動で作る仕組みです。

---

## 全体の流れ

1. Kk が、成約見込みの高い店を選び、案件管理シートの **M列「デモ依頼」に「依頼」** と入力
2. （任意）LINE でエリに「○○店のデモお願い」と合図
3. GitHub Actions が動き、セバスが「依頼」の店のデモを生成
   - Claude がその店に合うキャッチコピー・こだわり文などを生成
   - テンプレート（standard.html）に差し込み
   - 写真は「お写真をご提供ください」の案内表示（後で差し替え）
4. 生成した HTML を `docs/` に保存し、GitHub Pages で公開
5. シートの I列にURL記入、M列を「完成」に更新
6. エリが Kk に「できました」と報告 → 営業で使用

---

## セットアップ手順

### 1. GitHubリポジトリを作る
- リポジトリ名：`demo-generator`（taishinlvv-lgtm）
- このフォルダの中身を全部アップロード

### 2. GitHub Secrets を登録
Settings → Secrets and variables → Actions → New repository secret

| 名前 | 値 |
|------|-----|
| `ANTHROPIC_API_KEY` | `sk-ant-...`（Scoutと同じキーでOK） |
| `GOOGLE_SHEET_URL` | Apps Script の exec URL（Scoutと同じ） |
| `PAGES_BASE_URL` | `https://taishinlvv-lgtm.github.io/demo-generator/docs`（下記3の後で確定） |

### 3. GitHub Pages を有効化
Settings → Pages → Source を「Deploy from a branch」、Branch を `main` / フォルダ `/docs` に設定 → Save
→ 公開URLが `https://taishinlvv-lgtm.github.io/demo-generator/` になります
→ 生成物は `…/docs/demo_xxx.html` で見られます

### 4. Apps Script を更新
- `AppsScript_追加コード.gs` の中身で、既存の doPost を置き換え
- **案件管理シートに M列を追加し、M1 に「デモ依頼」と入力**
- 「デプロイ → デプロイを管理 → 編集 → 新バージョン → デプロイ」で再デプロイ
  （exec URL は変わりません）

### 5. テスト
- 案件管理シートのどれか1店の M列に「依頼」と入力
- GitHub → Actions → Demo Generator → Run workflow
- 数分後、シートの I列にURLが入れば成功。そのURLを開いてデモを確認

---

## ファイル構成

```
demo-generator/
├─ src/
│  ├─ index.js         … メイン処理（依頼取得→生成→記録）
│  ├─ sheets.js        … シート読み書き（Apps Script経由）
│  ├─ claudeWriter.js  … Claudeでテキスト生成
│  └─ renderer.js      … テンプレートに差し込み
├─ templates/
│  └─ standard.html    … スタンダードプランのテンプレート
├─ docs/               … 生成されたデモHTML（GitHub Pagesで公開）
├─ .github/workflows/
│  └─ generate.yml     … GitHub Actions（手動＋毎日AM10時）
├─ AppsScript_追加コード.gs … Apps Scriptに追記するコード
├─ package.json
└─ README.md
```

---

## 注意点

- **依存パッケージなし**（Node標準のみ）。Scoutと同じ構成で安定動作
- 写真は自動では入りません。商談後にお店から写真をもらって差し替える運用です
- メニューの価格は自動では入れません（架空の値段を載せないため）
- 今はスタンダードプランのみ。プロ・プレミアムは後から追加できます
