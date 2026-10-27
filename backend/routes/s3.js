import express from 'express';
import { generateUploadPresignedUrl, generateDownloadPresignedUrl } from '../services/s3Service.js';

const router = express.Router();

/**
 * POST /api/s3/upload-url
 * Generate a pre-signed S3 PUT URL for direct client-side upload of student assignment PDF
 */
router.post('/upload-url', async (req, res) => {
  const { fileName, fileType, studentId, assignmentId } = req.body;

  if (!fileName || !studentId || !assignmentId) {
    return res.status(400).json({
      success: false,
      message: 'Missing required parameters: fileName, studentId, assignmentId.',
    });
  }

  // Enforce PDF file type check
  const isPdf = fileName.toLowerCase().endsWith('.pdf') || fileType === 'application/pdf';
  if (!isPdf) {
    return res.status(400).json({
      success: false,
      message: 'Only PDF documents (.pdf) are permitted for assignment submission.',
    });
  }

  try {
    const result = await generateUploadPresignedUrl({
      fileName,
      fileType: fileType || 'application/pdf',
      studentId,
      assignmentId,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[S3 Service] Error generating upload URL:', error);
    
    // Fallback simulation mode if S3 is not yet provisioned in local environment
    if (!process.env.S3_BUCKET_NAME) {
      const mockKey = `submissions/assignment-${assignmentId}/student-${studentId}/${Date.now()}-${fileName}`;
      return res.json({
        success: true,
        simulation: true,
        warning: 'S3_BUCKET_NAME not set. Returned simulated upload URL for local test.',
        data: {
          uploadUrl: `https://mock-s3-endpoint.local/${mockKey}`,
          fileKey: mockKey,
          fileUrl: `https://assignment-portal-bucket.s3.amazonaws.com/${mockKey}`,
        },
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate secure upload URL.',
      error: error.message,
    });
  }
});

/**
 * GET /api/s3/download-url
 * Generate a pre-signed S3 GET URL for faculty to download or preview the submitted PDF
 */
router.get('/download-url', async (req, res) => {
  const { fileKey, fileName } = req.query;

  if (!fileKey) {
    return res.status(400).json({
      success: false,
      message: 'Missing required query parameter: fileKey.',
    });
  }

  try {
    const result = await generateDownloadPresignedUrl({
      fileKey,
      downloadFileName: fileName,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[S3 Service] Error generating download URL:', error);

    // Fallback simulation mode if S3 is not configured
    if (!process.env.S3_BUCKET_NAME) {
      return res.json({
        success: true,
        simulation: true,
        data: {
          downloadUrl: fileKey.startsWith('http') ? fileKey : `https://mock-s3-endpoint.local/${fileKey}`,
        },
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate secure download URL.',
      error: error.message,
    });
  }
});

export default router;
