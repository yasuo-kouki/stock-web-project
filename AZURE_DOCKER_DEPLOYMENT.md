# Azure Docker デプロイガイド

Dockerを使用してAzureにデプロイする場合の構成と実装方法を説明します。

## アーキテクチャ概要

```
┌─────────────────────────┐
│  Azure Static Web Apps  │  ← フロントエンド（静的ファイル）
│  （Docker不要）         │    ビルド時に静的ファイル生成
└────────────┬────────────┘
             │ HTTPS
             ▼
┌─────────────────────────┐
│  Azure Container Apps   │  ← バックエンド（FastAPI）
│  または                 │    Dockerコンテナで実行
│  Azure App Service      │
│  (Linux + Docker)       │
└────────────┬────────────┘
             │
             ▼
      ┌──────────────┐
      │ Azure SQL DB │
      └──────────────┘
```

## 重要なポイント

### フロントエンド（Static Web Apps）
- **Dockerは不要** - 静的ファイルを配信するだけなので、ビルド時に静的ファイルを生成してデプロイ
- Next.jsを`output: 'export'`で静的エクスポート
- GitHub Actionsなどでビルド → 静的ファイルをデプロイ

### バックエンド（FastAPI）
- **Dockerコンテナ化** - Python環境と依存関係をコンテナに含める
- 2つの選択肢：
  1. **Azure Container Apps**（推奨）- コンテナ専用サービス
  2. **Azure App Service (Linux + Docker)** - 既存のApp ServiceでDockerコンテナを実行

---

## 実装手順

### 1. バックエンドのDocker化

#### 1.1 Dockerfile の作成

`backend/Dockerfile` を作成：

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# システム依存関係のインストール（必要に応じて）
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Python依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードのコピー
COPY . .

# ポートの公開
EXPOSE 8000

# 環境変数の設定（本番環境では環境変数から読み込む）
ENV PYTHONUNBUFFERED=1

# アプリケーションの起動
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 1.2 .dockerignore の作成

`backend/.dockerignore` を作成：

```
__pycache__
*.pyc
*.pyo
*.pyd
.Python
*.so
*.db
.env
.venv
venv/
ENV/
env/
*.log
.git
.gitignore
README.md
```

#### 1.3 ローカルでテスト

```bash
cd backend
# Dockerイメージの作成
docker build -t stock-backend .（これはmacではつかえない）
Azure Container Apps は linux/amd64 のイメージを要求しているが，あなたが push したイメージは別のアーキテクチャ（arm64 など）だった

docker buildx build --platform linux/amd64 -t stock-backend .


# Dockerコンテナの実行（環境変数API_KEYを設定）
docker run -p 8000:8000 -e キーの値 stock-backend


```

**注意**: 環境変数名は`API_KEY`を使用しています。本番環境では`OPENAI_API_KEY`などの適切な名前に変更してください。

---

### 2. Azure Container Apps でデプロイ（推奨）

#### 2.1 リソースグループの作成

1. [Azure Portal](https://portal.azure.com) にログイン
2. 左上の「**リソースの作成**」をクリック
3. 検索バーで「**リソースグループ**」を検索して選択
4. 「**作成**」をクリック
5. 以下の情報を入力：
   - **サブスクリプション**: 使用するサブスクリプションを選択
   - **リソースグループ**: `stock-project-rg`（任意の名前）
   - **リージョン**: `Japan East`（または最寄りのリージョン）
6. 「**確認および作成**」→「**作成**」をクリック

#### 2.2 Azure Container Registry (ACR) の作成

1. Azure Portalで「**リソースの作成**」をクリック
2. 検索バーで「**Container Registry**」を検索して選択
3. 「**作成**」をクリック
4. 以下の情報を入力：
   - **サブスクリプション**: 使用するサブスクリプションを選択
   - **リソースグループ**: `stock-project-rg`（上で作成したもの）
   - **レジストリ名**: `stockbackendregistry`（グローバルで一意の名前）
   - **場所**: `Japan East`
   - **SKU**: `Basic`（コストを抑える場合）
5. 「**確認および作成**」→「**作成**」をクリック
6. デプロイ完了まで待機（数分かかります）
7. **管理者ユーザー**: アクセスキー`有効` にチェック

#### 2.3 コンテナイメージのビルドとプッシュ（ローカルから手動アップロード）

ローカルのソースコードからDockerイメージをビルドし、Azure Container Registryにプッシュします。

**手順1: ローカルでDockerイメージをビルド**

1. プロジェクトの`backend`ディレクトリに移動：
   ```bash
   cd backend
   ```

2. Dockerイメージをビルド：
   ```bash
   docker build -t stock-backend .
   docker buildx build --platform linux/amd64 -t stock-backend .
   ```

3. ビルドが成功したことを確認：
   ```bash
   docker images | grep stock-backend
   ```

**手順2: Azure Container Registryにログイン**

1. Azure Portalで作成したContainer Registry（`stockbackendregistry`）を開く
2. 左メニューから「**アクセス キー**」をクリック
3. 「**管理者ユーザー**」が「無効」の場合は「有効」に切り替えて「**保存**」をクリック
4. 以下の情報をコピー：
   - **ログイン サーバー**: 例: `stockbackendregistry.azurecr.io`
   - **ユーザー名**: レジストリ名（例: `stockbackendregistry`）
   - **パスワード**: 「パスワード」の横の「**表示**」をクリックしてコピー

5. ローカルターミナルでACRにログイン：
   ```bash
   docker login stockbackendregistry.azurecr.io
   # ユーザー名: stockbackendregistry（あなたのレジストリ名）
   stockbackendregistry
   # パスワード: コピーしたパスワードを貼り付け
   
   ```

**手順3: イメージにタグを付ける**

ACRの形式に合わせてイメージにタグを付けます：

```bash
docker tag stock-backend stockbackendregistry.azurecr.io/stock-backend:latest
```

**手順4: イメージをACR（Azure Container Registry）にプッシュ**

```bash
docker push stockbackendregistry.azurecr.io/stock-backend:latest
```

プッシュが完了すると、Azure PortalのContainer Registryの「**リポジトリ**」セクションに`stock-backend`というリポジトリが表示されます。

**トラブルシューティング**:
- ログインに失敗する場合: 管理者ユーザーが有効になっているか確認
- プッシュに失敗する場合: イメージのタグが正しいか確認（`レジストリ名.azurecr.io/イメージ名:タグ`の形式）

## 2.4と2.5は現在統合されている
#### 2.4 Container Apps 環境の作成

1. Azure Portalで「**リソースの作成**」をクリック
2. 検索バーで「**Container Apps 環境**」を検索して選択
3. 「**作成**」をクリック
4. 以下の情報を入力：
   - **サブスクリプション**: 使用するサブスクリプションを選択
   - **リソースグループ**: `stock-project-rg`
   - **環境名**: `stock-env`
   - **リージョン**: `Japan East`
   - **ゾーン冗長性**: `無効`（コスト削減のため）
5. 「**確認および作成**」→「**作成**」をクリック
6. デプロイ完了まで待機

#### 2.5 Container App の作成

1. Azure Portalで「**リソースの作成**」をクリック
2. 検索バーで「**Container App**」を検索して選択
3. 「**作成**」をクリック
4. **基本**タブで以下を入力：
   - **サブスクリプション**: 使用するサブスクリプションを選択
   - **リソースグループ**: `stock-project-rg`
   - **Container App 名**: `stock-backend`
   - **Container Apps 環境**: `stock-env`（上で作成したもの）
   - **リージョン**: `Japan East`
5. 「**次へ: アプリとサービス**」をクリック
6. **アプリとサービス**タブで：
   - 「**コンテナーの追加**」をクリック
   - **イメージ ソース**: `Azure Container Registry` を選択
   - **レジストリ**: `stockbackendregistry`（あなたが作成したレジストリ名）を選択
   - **イメージ**: `stock-backend` を選択
   - **タグ**: `latest` を選択
   - **レジストリ認証**: `有効` に設定（重要！）
   - **認証タイプ**: `管理者ユーザー` を選択
   - **ユーザー名**: `stockbackendregistry`（レジストリ名）
   - **パスワード**: Azure PortalのContainer Registryの「アクセス キー」からコピーしたパスワードを入力
   - **CPU**: `0.25`、**メモリ**: `0.5Gi`（最小構成）
   - **ターゲット ポート**: `8000` を入力
   
   **重要**: レジストリ認証を有効にしないと、イメージのプルに失敗します。必ず設定してください。
7. 「**次へ: イングレス**」をクリック
8. **イングレス**タブで：
   - **イングレスを有効にする**: `有効` にチェック
   - **外部**: `有効` にチェック
   - **ターゲット ポート**: `8000` を確認
9. 「**次へ: 環境変数**」をクリック
10. **環境変数**タブで「**+ 環境変数の追加**」をクリック：
    - **名前**: `OPENAI_API_KEY`
    - **値**: あなたのOpenAI APIキー
    - 再度「**+ 環境変数の追加**」をクリック：
    - **名前**: `CORS_ORIGINS`
    - **値**: `https://your-frontend.azurestaticapps.net`（後でフロントエンドのURLに更新）
11. 「**確認および作成**」→「**作成**」をクリック
12. デプロイ完了まで待機（数分かかります）

#### 2.6 環境変数の更新

1. 作成したContainer App（`stock-backend`）を開く
2. 左メニューから「**環境変数**」をクリック
3. 「**+ 追加**」をクリックして新しい環境変数を追加、または既存の変数を編集
4. 変更後、「**保存**」をクリック

#### 2.7 トラブルシューティング: ACR認証エラーの場合

Container Appの作成時に`Conflict`エラーや`AcrPullRoleAssignmentDeployment`エラーが発生した場合：

1. 既存のContainer App（`stockbackendapplication`など）を開く
2. 左メニューから「**修正**」または「**編集とデプロイ**」をクリック
3. **コンテナ**セクションで、コンテナを選択または編集
4. **レジストリ認証**セクションで：
   - **レジストリ認証**: `有効` に設定
   - **認証タイプ**: `管理者ユーザー` を選択
   - **ユーザー名**: `stockbackendregistry`（レジストリ名）
   - **パスワード**: Container Registryの「アクセス キー」からコピーしたパスワードを入力
5. 「**保存**」をクリック
6. デプロイが完了するまで待機

**注意**: Container Registryの「管理者ユーザー」が有効になっていることを確認してください。

---

### 3. Azure App Service (Linux + Docker) でデプロイ

#### 3.1 App Service プランの作成

1. Azure Portalで「**リソースの作成**」をクリック
2. 検索バーで「**App Service プラン**」を検索して選択
3. 「**作成**」をクリック
4. 以下の情報を入力：
   - **サブスクリプション**: 使用するサブスクリプションを選択
   - **リソースグループ**: `stock-project-rg`
   - **App Service プラン名**: `stock-plan`
   - **オペレーティング システム**: `Linux`
   - **リージョン**: `Japan East`
   - **価格レベル**: `Basic B1`（または`Free F1`で試す場合）
5. 「**確認および作成**」→「**作成**」をクリック

#### 3.2 Web App の作成（Dockerコンテナを使用）

1. Azure Portalで「**リソースの作成**」をクリック
2. 検索バーで「**Web App**」を検索して選択
3. 「**作成**」をクリック
4. **基本**タブで以下を入力：
   - **サブスクリプション**: 使用するサブスクリプションを選択
   - **リソースグループ**: `stock-project-rg`
   - **名前**: `stock-backend-app`（グローバルで一意の名前）
   - **公開**: `コンテナー` を選択
   - **オペレーティング システム**: `Linux`
   - **リージョン**: `Japan East`
   - **App Service プラン**: `stock-plan`（上で作成したもの）
5. 「**次へ: Docker**」をクリック
6. **Docker**タブで：
   - **オプション**: `単一コンテナー` を選択
   - **イメージ ソース**: `Azure Container Registry` を選択
   - **レジストリ**: `stockbackendregistry`（あなたが作成したレジストリ名）を選択
   - **イメージ**: `stock-backend` を選択
   - **タグ**: `latest` を選択
   - **スタートアップ コマンド**: 空欄（DockerfileのCMDを使用）
7. 「**確認および作成**」→「**作成**」をクリック
8. デプロイ完了まで待機

#### 3.3 ACR認証の設定

1. 作成したWeb App（`stock-backend-app`）を開く
2. 左メニューから「**デプロイ センター**」をクリック
3. 「**設定**」タブで：
   - **レジストリ認証**: `有効` に設定
   - 認証情報は自動的に設定されます（ACRの管理者ユーザーが有効な場合）
4. または、左メニューから「**構成**」→「**全般設定**」をクリック：
   - **Docker コンテナー**セクションで認証情報を確認・更新

#### 3.4 環境変数の設定

1. 作成したWeb App（`stock-backend-app`）を開く
2. 左メニューから「**構成**」をクリック
3. 「**アプリケーション設定**」タブで「**+ 新しいアプリケーション設定**」をクリック
4. 以下の環境変数を追加：
   - **名前**: `OPENAI_API_KEY`
   - **値**: あなたのOpenAI APIキー
   - 「**OK**」をクリック
   - 再度「**+ 新しいアプリケーション設定**」をクリック：
   - **名前**: `CORS_ORIGINS`
   - **値**: `https://your-frontend.azurestaticapps.net`（後でフロントエンドのURLに更新）
   - 「**OK**」をクリック
5. 上部の「**保存**」をクリック
6. 「**続行**」をクリックして変更を適用

---







### 4. フロントエンドのデプロイ（Static Web Apps）

フロントエンドはDocker不要。静的ファイルを生成してデプロイします。

#### 4.1 Next.js設定の更新

`frontend/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // 静的エクスポート
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
};

export default nextConfig;
```

#### 4.2 ビルドとデプロイ

```bash
cd frontend
npm install
npm run build  # out/ ディレクトリに静的ファイルが生成される
```

#### 4.3 Static Web Apps の作成とデプロイ

**Azure Portalでの作成手順：**

1. Azure Portalで「**リソースの作成**」をクリック
2. 検索バーで「**Static Web App**」を検索して選択
3. 「**作成**」をクリック
4. **基本**タブで以下を入力：
   - **サブスクリプション**: 使用するサブスクリプションを選択
   - **リソースグループ**: `stock-project-rg`
   - **名前**: `stock-frontend`（グローバルで一意の名前）
   - **プランの種類**: `Free`（または`Standard`）
   - **リージョン**: `East Asia` または `Japan East`
   - **ソース**: `GitHub` または `その他` を選択
5. **GitHub**を選択した場合：
   - 「**GitHub でサインイン**」をクリックして認証
   - **組織**: あなたのGitHub組織またはユーザー名
   - **リポジトリ**: このプロジェクトのリポジトリ
   - **ブランチ**: `main`
   - **ビルドの詳細**:
     - **ビルド プリセット**: `Next.js` を選択
     - **アプリの場所**: `/frontend`
     - **API の場所**: （空欄）
     - **出力場所**: `out`
6. 「**確認および作成**」→「**作成**」をクリック
7. デプロイ完了後、GitHub Actionsが自動的に実行されます

**GitHub Actionsを使用する場合、`.github/workflows/azure-static-web-apps.yml`:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

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
            NEXT_PUBLIC_API_URL=https://your-backend-url.azurecontainerapps.io
```

---

## 比較: Container Apps vs App Service

### Azure Container Apps（推奨）

**メリット**:
- ✅ コンテナ専用で最適化されている
- ✅ 自動スケーリング（0スケールも可能）
- ✅ サーバーレス的な料金体系（使用量ベース）
- ✅ 複数のコンテナを簡単に管理可能
- ✅ トラフィック分割、リビジョン管理が簡単

**デメリット**:
- ❌ 新しめのサービス（2021年リリース）
- ❌ 一部の高度な機能が制限される場合がある

**料金**: 従量課金（Consumption プラン）で、使用しない場合は料金がかからない

### Azure App Service (Linux + Docker)

**メリット**:
- ✅ 成熟したサービス（多くの機能と統合）
- ✅ 固定プランで予測可能な料金
- ✅ スロット（ステージング環境）機能
- ✅ Application Insightsとの統合が簡単

**デメリット**:
- ❌ 常時起動（Free/Sharedプラン以外）
- ❌ スケーリング設定がやや複雑

**料金**: プランベース（Basic B1: 約$13/月）

---

## CI/CD パイプライン（GitHub Actions）

### バックエンドのデプロイ（オプション）

GitHub Actionsを使用して自動デプロイを設定する場合：

1. **Azure サービス プリンシパルの作成**（初回のみ）:
   - Azure Portalで「**Azure Active Directory**」→「**アプリの登録**」→「**新規登録**」
   - 名前を入力して「**登録**」
   - 「**証明書とシークレット**」→「**新しいクライアント シークレット**」でシークレットを作成
   - 「**API のアクセス許可**」で必要な権限を付与

2. **GitHub Secrets の設定**:
   - GitHubリポジトリの「**Settings**」→「**Secrets and variables**」→「**Actions**」
   - 以下のシークレットを追加：
     - `AZURE_CREDENTIALS`: サービスプリンシパルの認証情報（JSON形式）

3. **ワークフローファイルの作成**:

`.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Azure

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      
      - name: Build and push image
        run: |
          az acr build \
            --registry stockbackendregistry \
            --image stock-backend:latest \
            --file backend/Dockerfile \
            backend/
      
      - name: Update Container App
        run: |
          az containerapp update \
            --name stock-backend \
            --resource-group stock-project-rg \
            --image stockbackendregistry.azurecr.io/stock-backend:latest
```

**注意**: CI/CDはオプションです。手動でAzure Portalからイメージを再デプロイすることも可能です。

---

## まとめ

### Dockerを使う場合の構成

1. **フロントエンド**: 
   - Docker不要
   - Next.jsを静的エクスポート → Azure Static Web Apps

2. **バックエンド**: 
   - Dockerコンテナ化
   - **推奨**: Azure Container Apps
   - **代替**: Azure App Service (Linux + Docker)

### 推奨構成

```
フロントエンド: Azure Static Web Apps（静的ファイル、Docker不要）
バックエンド:   Azure Container Apps（Dockerコンテナ）
データベース:   Azure SQL Database
```

この構成により、バックエンドはコンテナ化され、環境の一貫性とデプロイの簡素化が実現できます。

