import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

// A single client is reused across requests/invocations. On Lambda/Vercel serverless
// functions this module stays warm between invocations of the same instance, so we
// avoid paying TCP/TLS handshake cost on every request.
const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
})

export const ddb = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
})

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'ledger-todo'
