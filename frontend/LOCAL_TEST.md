# ローカルフロントエンドからAzureバックエンドへの接続テスト

このドキュメントでは、ローカルのフロントエンドからAzureにデプロイ済みのバックエンドに接続してテストする手順を説明します。

## 前提条件

- Azureバックエンドがデプロイ済み
- バックエンドURL: `https://stock-backend-app.yellowocean-cd0d3c73.japaneast.azurecontainerapps.io`
- Node.jsとnpmがインストール済み

## 設定手順

### 1. 環境変数の設定

`frontend/.env.local` ファイルが既に作成されています：

```bash
NEXT_PUBLIC_API_URL=https://stock-backend-app.yellowocean-cd0d3c73.japaneast.azurecontainerapps.io
```

このファイルは `.gitignore` に含まれているため、Gitにコミットされません。

### 2. バックエンドのCORS設定確認

Azure Container Appsの環境変数 `CORS_ORIGINS` に、ローカル開発用のURLが含まれているか確認してください：

```
CORS_ORIGINS=http://localhost:3000,https://your-frontend.azurestaticapps.net
```

**確認方法（Azure Portal）:**
1. Container App（`stock-backend-app`）を開く
2. 左メニューから「**環境変数**」をクリック
3. `CORS_ORIGINS` を確認
4. `http://localhost:3000` が含まれていない場合は追加

**確認方法（Azure CLI）:**
```bash
az containerapp show \
  --name stock-backend-app \
  --resource-group <リソースグループ名> \
  --query "properties.template.containers[0].env" \
  --output table
```

### 3. フロントエンドの起動

```bash
cd frontend

# 依存関係のインストール（初回のみ）
npm install

# 開発サーバーの起動
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

## テスト手順

### 1. バックエンドの動作確認

ブラウザで以下のURLにアクセスして、バックエンドが正常に動作しているか確認：

```
https://stock-backend-app.yellowocean-cd0d3c73.japaneast.azurecontainerapps.io/docs
```

FastAPIのSwagger UIが表示されれば正常です。

### 2. フロントエンドからの接続テスト

1. ブラウザで `http://localhost:3000` にアクセス
2. ブラウザの開発者ツール（F12）を開く
3. 「**コンソール**」タブと「**ネットワーク**」タブを開く
4. 株価データを取得してみる（例: NVDAを選択）
5. 以下を確認：
   - ネットワークタブでAPIリクエストが送信されているか
   - レスポンスが正常に返ってきているか
   - コンソールにエラーが表示されていないか

### 3. CORSエラーの確認

もしCORSエラーが発生する場合、ブラウザのコンソールに以下のようなエラーが表示されます：

```
Access to XMLHttpRequest at 'https://stock-backend-app...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解決方法:**
1. Azure Container Appsの環境変数 `CORS_ORIGINS` に `http://localhost:3000` が含まれているか確認
2. 環境変数を変更した後、Container Appを再起動

## トラブルシューティング

### 環境変数が反映されない

Next.jsでは、環境変数は**サーバー起動時**に読み込まれます。

**解決方法:**
1. 開発サーバーを停止（Ctrl+C）
2. `frontend/.env.local` の内容を確認
3. 再度 `npm run dev` で起動

### CORSエラーが発生する

**症状:** ブラウザのコンソールにCORSエラーが表示される

**確認項目:**
1. バックエンドの `CORS_ORIGINS` に `http://localhost:3000` が含まれているか
2. URLの末尾にスラッシュがないか（`http://localhost:3000` と `http://localhost:3000/` は異なる）
3. プロトコルが正しいか（`http://` vs `https://`）

**解決方法:**
```bash
# Azure CLIで環境変数を更新
az containerapp update \
  --name stock-backend-app \
  --resource-group <リソースグループ名> \
  --set-env-vars "CORS_ORIGINS=http://localhost:3000,https://your-frontend.azurestaticapps.net"
```

### ネットワークエラーが発生する

**症状:** `Network Error` や `Failed to fetch` エラー

**確認項目:**
1. バックエンドのURLが正しいか
2. バックエンドが起動しているか（`/docs` エンドポイントにアクセス可能か）
3. インターネット接続が正常か

### APIリクエストがタイムアウトする

**症状:** リクエストが長時間待機してタイムアウトする

**確認項目:**
1. バックエンドのログを確認（Azure Portalの「ログストリーム」）
2. バックエンドのリソース使用状況を確認

## 環境変数の切り替え

### ローカルバックエンドに切り替える場合

`frontend/.env.local` を以下のように変更：

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

開発サーバーを再起動してください。

### Azureバックエンドに戻す場合

`frontend/.env.local` を以下のように変更：

```bash
NEXT_PUBLIC_API_URL=https://stock-backend-app.yellowocean-cd0d3c73.japaneast.azurecontainerapps.io
```

開発サーバーを再起動してください。

## 確認チェックリスト

- [ ] `frontend/.env.local` ファイルが作成されている
- [ ] `NEXT_PUBLIC_API_URL` が正しく設定されている
- [ ] バックエンドの `/docs` エンドポイントにアクセス可能
- [ ] バックエンドの `CORS_ORIGINS` に `http://localhost:3000` が含まれている
- [ ] フロントエンドが `http://localhost:3000` で起動している
- [ ] ブラウザの開発者ツールでエラーが表示されていない
- [ ] 株価データの取得が正常に動作する
- [ ] 予測機能が正常に動作する

## 参考

- バックエンドURL: https://stock-backend-app.yellowocean-cd0d3c73.japaneast.azurecontainerapps.io/docs
- フロントエンド開発サーバー: http://localhost:3000

