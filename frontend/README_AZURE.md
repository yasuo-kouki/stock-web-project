# Azure Static Web Apps デプロイガイド

このドキュメントでは、フロントエンドをAzure Static Web Appsにデプロイする手順を説明します。

## 前提条件

- Azureアカウント
- バックエンドが既にデプロイ済み（Container Apps または App Service）
- バックエンドのURLを把握している

## 設定ファイル

### 1. `next.config.ts`

既にAzure Static Web Apps用に設定済みです：
- `output: 'export'` - 静的エクスポート
- `images.unoptimized: true` - 画像最適化を無効化
- 環境変数 `NEXT_PUBLIC_API_URL` の設定

### 2. `staticwebapp.config.json`

Azure Static Web Apps用の設定ファイルを作成済み：
- SPAのリダイレクト設定
- キャッシュ設定

## デプロイ手順

### 方法1: Azure Portalから作成（推奨）

1. **Azure Portal**にログイン
2. 「**リソースの作成**」をクリック
3. 「**Static Web App**」を検索して選択
4. 「**作成**」をクリック
5. **基本**タブで以下を入力：
   - **サブスクリプション**: 使用するサブスクリプション
   - **リソースグループ**: `stock-project-rg`（バックエンドと同じ）
   - **名前**: `stock-frontend`（グローバルで一意の名前）
   - **プランの種類**: `Free`（または`Standard`）
   - **リージョン**: `East Asia` または `Japan East`
   - **ソース**: `その他` を選択（GitHub連携も可能）

6. **デプロイの詳細**タブで：
   - **ビルド プリセット**: `カスタム` を選択
   - **アプリの場所**: `/frontend`
   - **API の場所**: （空欄）
   - **出力場所**: `out`

7. 「**確認および作成**」→「**作成**」をクリック

8. デプロイ完了後、**環境変数の設定**：
   - Static Web Appのリソースを開く
   - 左メニューから「**構成**」をクリック
   - 「**アプリケーション設定**」タブで「**+ 追加**」をクリック
   - **名前**: `NEXT_PUBLIC_API_URL`
   - **値**: バックエンドのURL（例: `https://stock-backend-app.yellowocean-cd0d3c73.japaneast.azurecontainerapps.io`）
   - 「**OK**」→「**保存**」をクリック
   - **重要**: 環境変数は**ビルド時**に使用されるため、設定後は再デプロイが必要です

9. **再デプロイ**：
   - 環境変数を設定した後、必ず再デプロイが必要です
   - 「**概要**」ページから「**再デプロイ**」をクリック
   - または、GitHub Actionsを使用している場合は、コードをプッシュして再デプロイ

### 方法2: Azure CLIで作成

```bash
# リソースグループが存在することを確認
az group show --name stock-project-rg

# Static Web Appの作成
az staticwebapp create \
  --name stock-frontend \
  --resource-group stock-project-rg \
  --location "eastasia" \
  --sku Free

# 環境変数の設定（実際のバックエンドURLに置き換えてください）
az staticwebapp appsettings set \
  --name stock-frontend \
  --resource-group stock-project-rg \
  --setting-names NEXT_PUBLIC_API_URL=https://stock-backend-app.yellowocean-cd0d3c73.japaneast.azurecontainerapps.io

# 設定後、再デプロイが必要です
az staticwebapp redeploy \
  --name stock-frontend \
  --resource-group stock-project-rg
```

### 方法3: GitHub Actionsを使用（自動デプロイ）

1. **Static Web Appの作成**（方法1または方法2で作成）

2. **デプロイトークンの取得**：
   - Static Web Appのリソースを開く
   - 「**デプロイ トークン**」をクリック
   - トークンをコピー

3. **GitHub Secretsの設定**：
   - GitHubリポジトリの「**Settings**」→「**Secrets and variables**」→「**Actions**」
   - 「**New repository secret**」をクリック
   - **Name**: `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - **Value**: コピーしたデプロイトークン
   - 「**Add secret**」をクリック

4. **GitHub Actionsワークフローの作成**：
   `.github/workflows/azure-static-web-apps.yml` を作成：

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
    paths:
      - 'frontend/**'
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main
    paths:
      - 'frontend/**'

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event.name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/frontend"
          output_location: "out"
          api_location: ""
          env: |
            NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}
```

5. **GitHub SecretsにバックエンドURLを追加**：
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: バックエンドのURL

## バックエンドのCORS設定（重要）

**デプロイ後、必ずバックエンドのCORS設定を更新してください。**

Static Web AppのURLを取得：
1. Static Web Appのリソースを開く
2. 「**概要**」ページの「**URL**」を確認（例: `https://stock-frontend.azurestaticapps.net`）

バックエンドの環境変数 `CORS_ORIGINS` に、Static Web AppのURLを追加：

```
CORS_ORIGINS=https://stock-frontend.azurestaticapps.net,http://localhost:3000
```

**注意**: `stock-frontend.azurestaticapps.net` は実際のStatic Web AppのURLに置き換えてください。

**Container Appsの場合**：
1. Container Appのリソースを開く
2. 「**環境変数**」をクリック
3. `CORS_ORIGINS` を編集または追加
4. 「**保存**」をクリック

**App Serviceの場合**：
1. App Serviceのリソースを開く
2. 「**構成**」→「**アプリケーション設定**」をクリック
3. `CORS_ORIGINS` を編集または追加
4. 「**保存**」をクリック

## ローカルでのビルド確認

デプロイ前に、ローカルでビルドを確認できます：

```bash
cd frontend

# 環境変数を設定（オプション）
export NEXT_PUBLIC_API_URL=https://your-backend-url.azurecontainerapps.io

# ビルド
npm install
npm run build

# ビルド結果を確認
ls -la out/
```

`out/` ディレクトリに静的ファイルが生成されていれば成功です。

## トラブルシューティング

### ビルドエラー

- `npm install` が失敗する場合：`package-lock.json` を削除して再インストール
- TypeScriptエラー：`tsconfig.json` の設定を確認

### 環境変数が反映されない

- 環境変数は**ビルド時**に設定される必要があります
- GitHub Actionsを使用する場合、ワークフローの `env` セクションで設定
- Azure Portalで設定した環境変数は、**再デプロイ**が必要な場合があります

### CORSエラー

- バックエンドの `CORS_ORIGINS` に、Static Web AppのURLが含まれているか確認
- URLは完全一致する必要があります（末尾のスラッシュも含む）

### 404エラー（ページリロード時）

- `staticwebapp.config.json` の `navigationFallback` 設定を確認
- すべてのルートが `/index.html` にリダイレクトされるように設定済み

## 参考リンク

- [Azure Static Web Apps ドキュメント](https://docs.microsoft.com/ja-jp/azure/static-web-apps/)
- [Next.js 静的エクスポート](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

