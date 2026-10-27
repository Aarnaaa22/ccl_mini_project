import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.S3_BUCKET_NAME;

// S3 Client configured using the AWS SDK default credential provider chain
// (EC2 IAM Role instance profile in production, or ~/.aws credentials in local)
export const s3Client = new S3Client({
  region,
});

/**
 * Generate a pre-signed S3 PUT URL for direct client-side file upload.
 * 
 * @param {Object} params
 * @param {string} params.fileName - Original file name (e.g., lab1_report.pdf)
 * @param {string} [params.fileType='application/pdf'] - MIME type of the file
 * @param {number|string} params.studentId - Student user ID
 * @param {number|string} params.assignmentId - Assignment ID
 * @param {number} [params.expiresIn=900] - Expiration time in seconds (default: 15 mins)
 * @returns {Promise<{ uploadUrl: string, fileKey: string, fileUrl: string }>}
 */
export async function generateUploadPresignedUrl({
  fileName,
  fileType = 'application/pdf',
  studentId,
  assignmentId,
  expiresIn = 900,
}) {
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME is not configured in environment variables.');
  }

  // Sanitize filename and create unique timestamped key
  const ext = path.extname(fileName) || '.pdf';
  const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const uniqueToken = crypto.randomBytes(6).toString('hex');
  const fileKey = `submissions/assignment-${assignmentId}/student-${studentId}/${Date.now()}-${uniqueToken}-${baseName}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: fileType,
    Metadata: {
      'student-id': String(studentId),
      'assignment-id': String(assignmentId),
      'original-filename': fileName,
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileKey}`;

  return {
    uploadUrl,
    fileKey,
    fileUrl,
    expiresIn,
  };
}

/**
 * Generate a pre-signed S3 GET URL for secure file download or preview.
 * 
 * @param {Object} params
 * @param {string} params.fileKey - The S3 object key (e.g., submissions/.../report.pdf)
 * @param {string} [params.downloadFileName] - Optional friendly download name
 * @param {number} [params.expiresIn=900] - Expiration time in seconds (default: 15 mins)
 * @returns {Promise<{ downloadUrl: string, expiresIn: number }>}
 */
export async function generateDownloadPresignedUrl({
  fileKey,
  downloadFileName,
  expiresIn = 900,
}) {
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME is not configured in environment variables.');
  }

  // Handle case where full S3 URL was passed instead of relative key
  let cleanKey = fileKey;
  if (fileKey.startsWith('http://') || fileKey.startsWith('https://')) {
    const urlObj = new URL(fileKey);
    // Pathname starts with '/', remove leading slash
    cleanKey = urlObj.pathname.replace(/^\/+/, '');
  }

  const commandInput = {
    Bucket: bucketName,
    Key: cleanKey,
  };

  if (downloadFileName) {
    commandInput.ResponseContentDisposition = `inline; filename="${downloadFileName}"`;
  }

  const command = new GetObjectCommand(commandInput);
  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    downloadUrl,
    expiresIn,
  };
}
