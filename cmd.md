1. Unzip and install
unzip ledger-todo-app.zip
cd todo-app
npm install

2. Create the DynamoDB table
aws cloudformation deploy \
  --template-file infra/dynamodb-table.yaml \
  --stack-name ledger-todo \
  --parameter-overrides TableName=ledger-todo \
  --region ap-south-1

This takes ~30 seconds. Verify it exists:
aws dynamodb describe-table --table-name ledger-todo --region ap-south-1 --query "Table.TableStatus"

3. Create an IAM user scoped to just this table
aws iam create-user --user-name ledger-todo-app
aws iam put-user-policy --user-name ledger-todo-app --policy-name ledger-todo-table-access --policy-document file://infra/iam-policy.json
aws iam create-access-key --user-name ledger-todo-app

4. Set up your local .env.local
cp .env.example .env.local

Open it and fill in:
AWS_REGION=ap-south-1
DYNAMODB_TABLE_NAME=ledger-todo
AWS_ACCESS_KEY_ID=<the AccessKeyId from step 3>
AWS_SECRET_ACCESS_KEY=<the SecretAccessKey from step 3>
APP_PASSWORD=<pick a real passphrase>
SESSION_SECRET=<generate one — command below>
