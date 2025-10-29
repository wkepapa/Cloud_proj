// Deployment script for Elections Lambda
// This will create a Lambda function and attach it to the existing API Gateway

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const lambda = new AWS.Lambda({ region: 'us-east-1' });
const apigateway = new AWS.APIGateway({ region: 'us-east-1' });

async function deployElectionsLambda() {
  try {
    console.log('📦 Creating Elections Lambda function...');
    
    // Read the Lambda function code
    const functionCode = fs.readFileSync(path.join(__dirname, 'src', 'elections-api-lambda.js'));
    
    // Create or update Lambda function
    const functionName = 'stotra-elections-api';
    
    const lambdaParams = {
      FunctionName: functionName,
      Runtime: 'nodejs18.x',
      Role: 'arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role', // You'll need to update this
      Handler: 'elections-api-lambda.handler',
      Code: {
        ZipFile: functionCode
      },
      Environment: {
        Variables: {
          VOTES_TABLE: 'stotra-elections-votes-dev',
          CANDIDATES_TABLE: 'stotra-elections-candidates-dev'
        }
      }
    };
    
    try {
      await lambda.createFunction(lambdaParams).promise();
      console.log('✅ Lambda function created successfully');
    } catch (error) {
      if (error.code === 'ResourceConflictException') {
        // Function exists, update it
        await lambda.updateFunctionCode({
          FunctionName: functionName,
          ZipFile: functionCode
        }).promise();
        console.log('✅ Lambda function updated successfully');
      } else {
        throw error;
      }
    }
    
    console.log('🔗 Connecting Lambda to API Gateway...');
    
    // Connect to existing API Gateway
    const apiId = '4c2tgrnmni';
    
    // This would require more complex API Gateway v2 setup
    console.log('⚠️  Manual step required: Connect Lambda to API Gateway in AWS Console');
    console.log(`   API Gateway ID: ${apiId}`);
    console.log(`   Lambda Function: ${functionName}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

deployElectionsLambda();