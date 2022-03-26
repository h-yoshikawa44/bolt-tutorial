# Bolt チュートリアル
個人勉強用リポジトリ

教材出典：[Bolt チュートリアル](https://slack.dev/bolt-js/ja-jp/tutorial/getting-started)

プラス、色々検証したやつ。

## 環境
- Node.js：16.13.0

前提：[ngrok](https://ngrok.com/) 導入済み

## Slack App の用意
Slack ワークスペースと、アプリ（+ Bot）を作成してワークスペースにインストールしておく。

### Bot トークンのスコープについて
- アプリ管理画面のサイドバーの「OAuth & Permissions」へ
- Bot Token Scopes の欄に行き、「Add OAuth Scope」でスコープを設定（最低限、以下があれば OK）
  - channels:history：アプリが連携されたチャンネルの履歴へのアクセスを許可する
  - chat:write.public：アプリが連携されてないチャンネルへもメッセージの投稿を許可する
  - chat:write：アプリが連携されたチャンネルへのメッセージの投稿を許可する
  - reactions:read：アプリが連携されたチャンネルと会話で絵文字リアクションや関連するコンテンツへのアクセスを許可する

### 環境変数
Bolt を使用するために以下の情報が必要になるので環境変数に設定。
- ボットトークン： OAuth & Permissions の Bot User OAuth Token から
- signing secret：Basic Information の Signing Secret から
- Slack ワークスペースの URL：ワークスペース名のところから
- 転送するチャンネル ID：任意のチャンネル ID

```bash
# 作成した .env に環境変数を設定
cp .env.example .env
```

### イベントの設定について
あらかじめ、ngrok で3000ポートを公開しておく。  
（起動ごと？に URL が変わるので注意）

- アプリ管理画面のサイドバーから「Event Subscriptions」へ
- Enable Events を ON にする
- Request URL を追加する（イベントに対応する HTTP POST リクエストをこの URL に送る）
  - URL は`ngrok の 公開 URL`+`/slack/events`形式
  - この URL の検証が済むとチェックマークがつく
- Subscribe to bot events で監視するイベント（必要なやつだけ）を登録
（OAuth Scope にも追加されて、アプリ再インストールしてねと案内されるので、再度「許可する」）
    - message.channels：アプリが連携しているパブリックチャンネルのメッセージを監視
    - message.groups：アプリが連携しているプライベートチャンネルのメッセージを監視
    - message.im：アプリとユーザーのダイレクトメッセージを監視
    - message.mpim：アプリが連携しているグループDMを監視
    - reaction_added：アプリが連携しているチャンネルの。カスタム絵文字リアクションを監視

### アクションの設定について
- アプリ管理画面のサイドバーから「Interactivity & Shortcuts」を選択
- Interactivity を ON にする
- Request URL を入力（Bolt はデフォルトでは、イベントに使用しているのと同じエンドポイントをインタラクティブコンポーネントに使用するように設定されている）して保存

### Bot をチャンネルに追加
検証したい Slack チャンネルに、作成した Bot のアプリを追加しておく。

## 環境立ち上げ
ライブラリインストール
```bash
yarn install
```

サーバ立ち上げ
```
node app.js
```

この状態で、検証したい Slack チャンネル上で`hello`と投稿すると、Bot が反応する。
