require('dotenv').config();

const cfnDeploy = () => {
    try {
        // バケットの存在確認
        require('child_process').execSync(`aws cloudformation deploy --template-file cfn/template.yml --stack-name ${prjName}Stack --parameter-overrides Identifier=${prjName} CodeBucket=${lambdaSourceBucket} ModelId=${modelId} MaxTokens=${maxTokens} DiffMaxResults=${diffMaxResults} --capabilities CAPABILITY_NAMED_IAM`, { stdio: 'inherit' });
        console.log(`✅ Stack created: ${prjName}Stack `);
    } catch (err: any) {
        console.error("❌ Failed to create bucket:", err.message);
        process.exit(1);
    }
}

const prjName = process.env.PROJECT_NAME;
if (!prjName) {
    console.error("PROJECT_NAME is not defined in .env");
    process.exit(1);
}

const lambdaSourceBucket = process.env.S3_BUCKET_FOR_LAMBDA;
if (!lambdaSourceBucket) {
    console.error("S3_BUCKET_FOR_LAMBDA is not defined in .env");
    process.exit(1);
}

const modelId = process.env.MODEL_ID;
if (!modelId) {
    console.error("MODEL_ID is not defined in .env");
    process.exit(1);
}

const maxTokens = process.env.MAX_TOKENS;
if (!maxTokens) {
    console.error("MAX_TOKENS is not defined in .env");
    process.exit(1);
}

const diffMaxResults = process.env.DIFF_MAX_RESULT;
if (!diffMaxResults) {
    console.error("DIFF_MAX_RESULT is not defined in .env");
    process.exit(1);
}

cfnDeploy()