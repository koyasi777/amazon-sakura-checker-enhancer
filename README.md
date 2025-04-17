# サクラチェッカー簡易分析 For Amazon 🔍️

## 📌 概要

Amazon.co.jp の商品ページに、**サクラチェッカーの信頼度スコア・判定結果**を高速で自動表示するユーザースクリプトです。  
レビューの信頼性をワンクリックもせずに確認可能！購入前の「ちょっと怪しいかも…？」を即解決します。

- GM_xmlhttpRequest により CORS 制限を突破し、超高速でデータ取得
- 軽量キャッシュ対応（ローカルStorageに保存、再取得なし）
- 判定結果を色分け＆スタイリッシュに表示
- 動的ページ切り替え（SPA対応）にも自動追従
- サクラチェッカーの詳細ページへリンク付き

## 🧩 対応サイト

- `https://www.amazon.co.jp/*`

## ⚙️ インストール方法

1. お使いのブラウザに Violentmonkey または Tampermonkey を導入
2. **[このスクリプトをインストールする](https://raw.githubusercontent.com/koyasi777/amazon-sakura-checker-enhancer/main/amazon-sakura-checker.user.js)** ← クリックで直接インストール！
3. 自動的にインストール画面が開きます。確認して有効化すれば完了！

## 💡 機能詳細

- 商品 ASIN を自動で抽出し、対応するサクラチェッカーのスコア情報を取得
- サクラチェッカーの判定（「危険」「警告」「安全」など）を色付きで表示
- 詳細カテゴリごとのスコア表（表形式）も併せて表示
- CSSでAmazonのUIに溶け込むようなカードデザイン
- 表示済みの ASIN を記録し、無駄な再取得を排除

## 🛠 技術構成

- `GM_xmlhttpRequest` によるクロスドメイン通信（サクラチェッカー本体と通信）
- `localStorage` にキャッシュ保存（同一ASIN再取得なし）
- `MutationObserver` により、SPA型Amazon UIの動的変化にも対応
- DOMパース処理（sakura-checker.jp のHTMLを読み取ってスコア抽出）
- ユーザーがレビューを読む前に、即時に信頼度がわかる設計

## 🔗 関連サービス・リンク

- [サクラチェッカー公式サイト](https://sakura-checker.jp/)
- [Violentmonkey公式サイト](https://violentmonkey.github.io/)
- [Tampermonkey公式サイト](https://www.tampermonkey.net/)
- [このスクリプトのGitHubリポジトリ](https://github.com/koyasi777/amazon-sakura-checker-enhancer)

## 📜 ライセンス

MIT License  
自由に改変・再配布いただけますが、利用は自己責任でお願いします。

---

> Amazonレビューの「サクラっぽさ」、事前にチェックしませんか？  
> このスクリプトでレビューの見極めが一目瞭然になります。
