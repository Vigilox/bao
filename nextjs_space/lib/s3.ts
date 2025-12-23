/**
 * S3 File Upload/Download Utilities
 */

import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketConfig } from './aws-config';

const s3Client = createS3Client();
const { bucketName, folderPrefix } = getBucketConfig();
const region = process.env.AWS_REGION ?? 'us-west-2';

/**
 * Generate presigned URL for file upload
 */
export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false
): Promise<{ uploadUrl: string; cloud_storage_path: string }> {
  const timestamp = Date.now();
  const sanitizedFileName = fileName?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'file';
  
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${timestamp}-${sanitizedFileName}`
    : `${folderPrefix}uploads/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return { uploadUrl, cloud_storage_path };
}

/**
 * Get file URL (public or signed)
 */
export async function getFileUrl(
  cloud_storage_path: string,
  isPublic = false
): Promise<string> {
  if (isPublic) {
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Delete file from S3
 */
export async function deleteFile(cloud_storage_path: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: cloud_storage_path,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
}

/**
 * Upload file buffer to S3
 */
export async function uploadFileBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  isPublic = false
): Promise<string> {
  const timestamp = Date.now();
  const sanitizedFileName = fileName?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'file';
  
  const cloud_storage_path = isPublic
    ? `${folderPrefix}public/uploads/${timestamp}-${sanitizedFileName}`
    : `${folderPrefix}uploads/${timestamp}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cloud_storage_path,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return cloud_storage_path;
}

/**
 * Download file from S3 as buffer
 */
export async function downloadFileBuffer(cloud_storage_path: string): Promise<Buffer | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: cloud_storage_path,
    });

    const response = await s3Client.send(command);
    
    if (!response?.Body) {
      return null;
    }

    // Convert stream to buffer
    const chunks: any[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error downloading file from S3:', error);
    return null;
  }
}
