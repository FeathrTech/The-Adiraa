import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

export async function uploadToR2(
  fileBuffer: Buffer,
  folder: string,
  mimeType: string
): Promise<string> {

  if (!process.env.R2_ACCESS_KEY || !process.env.R2_SECRET_KEY) {
    throw new Error("R2 credentials missing from environment variables");
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY,
      secretAccessKey: process.env.R2_SECRET_KEY,
    },
  });

  const fileName = `${folder}/${randomUUID()}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );

  return `${process.env.R2_PUBLIC_URL}/${fileName}`;
}