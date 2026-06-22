import { S3Client } from "@aws-sdk/client-s3";

export const isS3Enabled = !!(
  process.env.AWS_S3_BUCKET &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
);

export const s3Client = isS3Enabled
  ? new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      },
    })
  : new S3Client({ region: process.env.AWS_REGION || "ap-south-1" });

export const getBucketName = () => {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) throw new Error("Missing AWS_S3_BUCKET env var");
  return bucket;
};

