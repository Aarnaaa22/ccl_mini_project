/**
 * Centralized API Client for Assignment Portal
 * Supports both Vite (VITE_API_BASE_URL) and Create-React-App (REACT_APP_API_BASE_URL) conventions.
 */

const API_BASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL) ||
  'http://localhost:5000';

console.log(`[API Client] Initialized with Base URL: ${API_BASE_URL}`);

/**
 * Generic Fetch Wrapper with JSON decoding and error parsing
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

// -----------------------------------------------------------------------------
// Assignments API
// -----------------------------------------------------------------------------
export async function getAssignments() {
  const res = await apiRequest('/api/assignments');
  return res.data || [];
}

export async function createAssignment(payload) {
  const res = await apiRequest('/api/assignments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

// -----------------------------------------------------------------------------
// Submissions API
// -----------------------------------------------------------------------------
export async function getSubmissions(params = {}) {
  const query = new URLSearchParams(params).toString();
  const endpoint = `/api/submissions${query ? `?${query}` : ''}`;
  const res = await apiRequest(endpoint);
  return res.data || [];
}

export async function getStudentSubmissions(studentId) {
  const res = await apiRequest(`/api/submissions/student/${studentId}`);
  return res.data || [];
}

export async function createSubmissionRecord(payload) {
  const res = await apiRequest('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function evaluateSubmission(id, { marks, status, feedback }) {
  const res = await apiRequest(`/api/submissions/${id}/evaluate`, {
    method: 'PATCH',
    body: JSON.stringify({ marks, status, feedback }),
  });
  return res.data;
}

// -----------------------------------------------------------------------------
// AWS S3 Pre-signed URL & Direct Upload
// -----------------------------------------------------------------------------

/**
 * 1. Request pre-signed S3 PUT URL from backend
 */
export async function getS3UploadPresignedUrl({ fileName, fileType, studentId, assignmentId }) {
  const res = await apiRequest('/api/s3/upload-url', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileType, studentId, assignmentId }),
  });
  return res.data;
}

/**
 * 2. Upload file directly to S3 bucket using pre-signed PUT URL
 * Includes XMLHttpRequest progress tracking for rich UI feedback
 */
export function uploadPdfToS3Direct(uploadUrl, file, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    // If mock simulation URL is returned in test environment
    if (uploadUrl.includes('mock-s3-endpoint')) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;
        onProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          resolve(true);
        }
      }, 150);
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(true);
      } else {
        reject(new Error(`S3 direct upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during direct S3 upload. Check S3 CORS configuration.'));
    };

    xhr.send(file);
  });
}

/**
 * 3. Request pre-signed S3 GET URL for secure faculty download
 */
export async function getS3DownloadUrl(fileKey, fileName) {
  const query = new URLSearchParams({ fileKey, fileName: fileName || 'submission.pdf' }).toString();
  const res = await apiRequest(`/api/s3/download-url?${query}`);
  return res.data?.downloadUrl;
}

// -----------------------------------------------------------------------------
// Users & Health
// -----------------------------------------------------------------------------
export async function getUsers(role) {
  const query = role ? `?role=${role}` : '';
  const res = await apiRequest(`/api/users${query}`);
  return res.data || [];
}

export async function checkBackendHealth() {
  try {
    return await apiRequest('/health');
  } catch {
    return { status: 'OFFLINE' };
  }
}
