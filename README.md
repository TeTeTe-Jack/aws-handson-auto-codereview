# AWS-HANDSON-AUTO-CODEREVIEW

## 概要
AWS CodeCommitでdevelopブランチにプルリクエストを作成した際に、コーディング規約に沿ってレビュー、プルリクエストにレビュー結果をコメント追加します。
以下のリソースを配備します。
|サービス|説明|
|---|---
|CodeCommit|コード管理サ－ビス|
|EventBridge|CodeCommitのプルリクエストイベントを検知してLambda関数をトリガーする|
|Lambda|EventBridgeを起動トリガーとしたLambda関数<br>CodeCommitから変更差分を取得、Bedrockの基盤モデルを実行し、結果をCodeCommitのプルリクエストのコメントを追加する|
|IAMロール|Lambda関数の実行ロール<br>以下の権限を付与<br>・CodeCommitの変更差分の取得<br>・Bedrockの基盤モデルの実行<br>・その他基本的なロール|

## 利用方法
### 事前準備
以下の準備・設定を実施の上、利用してください。
- AWSアカウント
- AWS CLI実行環境（各種設定が可能なIAMユーザの設定を含む）
- Amazon Bedrockの有効化

### 構築方法
- 1. このリポジトリのソースをclone
- 1. .envのパラメタを修正
- 1. このリポジトリのソースをclone
- 1. このリポジトリのソースをclone

## 参考
- [](https://tetete-home.com/article/1198)