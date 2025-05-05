require('dotenv').config();

const createBucket = (bucketName: string) => {
    try {
        // バケットの存在確認
        require('child_process').execSync(`aws s3 ls s3://${bucketName}`, { stdio: 'ignore' });
        console.log(`✅ S3 bucket already exists: s3://${bucketName}`);
    } catch (err: any) {
        // 存在しない場合は作成
        console.log(`ℹ️ S3 bucket does not exist. Creating: s3://${bucketName}`);
        try {
            require('child_process').execSync(`aws s3 mb s3://${bucketName}`, { stdio: 'inherit' });
            console.log(`✅ Bucket created: s3://${bucketName}`);
        } catch (createErr: any) {
            console.error("❌ Failed to create bucket:", createErr.message);
            process.exit(1);
        }
    }
}

const lambdaBucket = process.env.S3_BUCKET_FOR_LAMBDA;
if (!lambdaBucket) {
    console.error("S3_BUCKET_FOR_LAMBDA is not defined in .env");
    process.exit(1);
}

createBucket(lambdaBucket)