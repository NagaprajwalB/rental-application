# Local Setup Instructions

## 1. Unzip and install

```bash
unzip ledger-todo-app.zip
cd todo-app
npm install
```

## 2. Create the DynamoDB table

```bash
aws cloudformation deploy \
  --template-file infra/dynamodb-table.yaml \
  --stack-name ledger-todo \
  --parameter-overrides TableName=ledger-todo \
  --region ap-south-1
```

This deployment usually takes about 30 seconds.

Verify the table status:

```bash
aws dynamodb describe-table \
  --table-name ledger-todo \
  --region ap-south-1 \
  --query "Table.TableStatus"
```

## 3. Create an IAM user scoped to the table

```bash
aws iam create-user --user-name ledger-todo-app
aws iam put-user-policy \
  --user-name ledger-todo-app \
  --policy-name ledger-todo-table-access \
  --policy-document file://infra/iam-policy.json
aws iam create-access-key --user-name ledger-todo-app
```

Keep the `AccessKeyId` and `SecretAccessKey` values from the final command.

## 4. Configure local environment variables

Copy the example env file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values:

```env
AWS_REGION=ap-south-1
DYNAMODB_TABLE_NAME=ledger-todo
AWS_ACCESS_KEY_ID=<AccessKeyId from step 3>
AWS_SECRET_ACCESS_KEY=<SecretAccessKey from step 3>
APP_PASSWORD=<pick a real passphrase>
SESSION_SECRET=<generate one>
```

> Tip: generate a secure `SESSION_SECRET` value with a strong random string.
