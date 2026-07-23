// Convenience script for local/dev setup: creates the DynamoDB table directly via the SDK
// so you don't have to touch the AWS Console or CloudFormation just to try the app out.
// For real deployments prefer `aws cloudformation deploy --template-file infra/dynamodb-table.yaml`
// so the table is tracked as infrastructure-as-code.
//
// Usage: npm run table:create

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb'

const tableName = process.env.DYNAMODB_TABLE_NAME || 'ledger-todo'
const region = process.env.AWS_REGION || 'ap-south-1'

const client = new DynamoDBClient({ region })

async function tableExists() {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }))
    return true
  } catch (err) {
    if (err instanceof ResourceNotFoundException) return false
    throw err
  }
}

async function main() {
  if (await tableExists()) {
    console.log(`Table "${tableName}" already exists in ${region}. Nothing to do.`)
    return
  }

  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'pk', AttributeType: 'S' },
        { AttributeName: 'sk', AttributeType: 'S' },
        { AttributeName: 'gsi1pk', AttributeType: 'S' },
        { AttributeName: 'gsi1sk', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'pk', KeyType: 'HASH' },
        { AttributeName: 'sk', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'gsi1',
          KeySchema: [
            { AttributeName: 'gsi1pk', KeyType: 'HASH' },
            { AttributeName: 'gsi1sk', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      SSESpecification: { Enabled: true },
    })
  )

  console.log(`Created table "${tableName}" in ${region}.`)
}

main().catch((err) => {
  console.error('Failed to create table:', err)
  process.exit(1)
})
