require('dotenv').config();

const uploadZipFile = (bucketName: string) => {
    try {
        // バケットの存在確認
        require('child_process').execSync(`aws s3 ls s3://${bucketName}`, { stdio: 'ignore' });
        console.log(`✅ S3 bucket exists: s3://${bucketName}`);
        require('child_process').execSync(`aws s3 cp lambda/codereview.zip s3://${bucketName}`, { stdio: 'inherit' });
        console.log(`✅ Zip file is uploaded: s3://${bucketName}/codereview.zip`);
    } catch (err: any) {
        console.error("❌ Failed to create bucket:", err.message);
        process.exit(1);
    }
}

const uploadBucket = process.env.S3_BUCKET_FOR_LAMBDA;
if (!uploadBucket) {
    console.error("S3_BUCKET_FOR_LAMBDA is not defined in .env");
    process.exit(1);
}

uploadZipFile(uploadBucket)