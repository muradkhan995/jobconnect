import "server-only";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

/**
 * Private object storage for CVs (ADR-007): Cloudflare R2 in production, s3mock locally.
 * Objects are never public; people only get short-lived signed links after an ownership check.
 */
let client: S3Client | undefined;

function s3(): S3Client {
  const e = env();
  client ??= new S3Client({
    endpoint: e.S3_ENDPOINT,
    region: e.S3_REGION,
    forcePathStyle: true, // R2 and s3mock both accept path-style URLs
    credentials: {
      accessKeyId: e.S3_ACCESS_KEY_ID,
      secretAccessKey: e.S3_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

export const SIGNED_URL_SECONDS = 5 * 60; // NFR-SEC-008: short-lived

export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  await s3().send(
    new PutObjectCommand({
      Bucket: env().S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

/** Server-side copy – used to snapshot a CV when applying (BR-APP-003). */
export async function copyObject(
  fromKey: string,
  toKey: string,
): Promise<void> {
  const bucket = env().S3_BUCKET;
  await s3().send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: toKey,
      CopySource: `${bucket}/${fromKey}`,
    }),
  );
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(
    new DeleteObjectCommand({ Bucket: env().S3_BUCKET, Key: key }),
  );
}

/** A download link valid for 5 minutes, saving the file under its original name. */
export async function signedDownloadUrl(
  key: string,
  filename: string,
): Promise<{ url: string; expiresAt: Date }> {
  const safeName = filename.replace(/["\\\r\n]/g, "_");
  const url = await getSignedUrl(
    s3(),
    new GetObjectCommand({
      Bucket: env().S3_BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${safeName}"`,
    }),
    { expiresIn: SIGNED_URL_SECONDS },
  );
  return { url, expiresAt: new Date(Date.now() + SIGNED_URL_SECONDS * 1000) };
}
