/**
 * Cloudflare R2 client for uploading Instagram images.
 * R2 is S3-compatible, so we use the AWS S3 SDK.
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

/**
 * Load R2 configuration from environment variables.
 * Throws if required variables are missing.
 */
export function loadR2Config(): R2Config {
  const required = [
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_URL',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing R2 environment variables: ${missing.join(', ')}`);
  }

  // Support both CF_ACCOUNT_ID and CLOUDFLARE_ACCOUNT_ID
  const accountId = process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) {
    throw new Error('Missing CF_ACCOUNT_ID or CLOUDFLARE_ACCOUNT_ID environment variable');
  }

  return {
    accountId,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucketName: process.env.R2_BUCKET_NAME!,
    publicUrl: process.env.R2_PUBLIC_URL!.replace(/\/$/, ''), // strip trailing slash
  };
}

/**
 * Create an S3 client configured for Cloudflare R2.
 */
export function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * Upload a local file to R2 and return its public URL.
 *
 * @param filePath - Local path to the file to upload
 * @param key - Optional custom key (defaults to filename with timestamp prefix)
 * @returns Public URL of the uploaded file
 */
export async function uploadToR2(
  filePath: string,
  key?: string
): Promise<string> {
  const config = loadR2Config();
  const client = createR2Client(config);

  const fileBuffer = await readFile(filePath);
  const filename = basename(filePath);
  const ext = extname(filename).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'application/octet-stream';

  // Generate key with timestamp prefix for uniqueness
  const finalKey = key || `insta/${Date.now()}-${filename}`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: finalKey,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  return `${config.publicUrl}/${finalKey}`;
}
