import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { getS3UploadPresignedUrl, uploadPdfToS3Direct, createSubmissionRecord } from '../api';

export default function SubmitModal({ assignment, student, isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !assignment) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    setErrorMessage('');
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setErrorMessage('Invalid file format. Only PDF documents (.pdf) are accepted.');
      return;
    }

    // 25MB maximum size limit
    if (selectedFile.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB limit.');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a PDF file to submit.');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setUploadProgress(10);

    try {
      // Step 1: Request Pre-signed S3 URL from Backend API
      setUploadStep('Requesting secure AWS S3 pre-signed upload URL...');
      const s3Data = await getS3UploadPresignedUrl({
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        studentId: student.id,
        assignmentId: assignment.id,
      });

      setUploadProgress(30);

      // Step 2: Direct Client-to-S3 Upload
      setUploadStep('Uploading PDF directly to Amazon S3 bucket...');
      await uploadPdfToS3Direct(s3Data.uploadUrl, file, (progress) => {
        // Scale progress from 30% to 90%
        setUploadProgress(30 + Math.round(progress * 0.6));
      });

      setUploadProgress(90);

      // Step 3: Record Submission in MySQL Database
      setUploadStep('Finalizing submission in student database...');
      await createSubmissionRecord({
        assignment_id: assignment.id,
        student_id: student.id,
        file_url: s3Data.fileUrl,
        file_key: s3Data.fileKey,
      });

      setUploadProgress(100);
      setIsSuccess(true);
      setUploadStep('Submission completed successfully!');

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMessage(err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Submit Assignment
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {assignment.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Assignment Quick Recap */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Student:</span>
              <span className="text-slate-900 font-semibold">{student?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-slate-700">Due Date:</span>
              <span className="text-slate-800">
                {new Date(assignment.due_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-1 pt-1 text-[11px] text-slate-500">
              <Lock className="w-3 h-3 text-sky-600" />
              <span>Uploaded directly to Amazon S3 via temporary pre-signed token</span>
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-sky-500 bg-sky-50/40' 
                : file 
                ? 'border-emerald-300 bg-emerald-50/20' 
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
              disabled={isUploading}
            />

            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)} • PDF Document
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Click to select or drag and drop your PDF
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Maximum allowed file size: 25MB (PDF only)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Progress / Step Feedback */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  {uploadStep}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success State Banner */}
          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Assignment submitted successfully! Updating your dashboard...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isUploading || isSuccess}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading to S3...</span>
                </>
              ) : (
                <>
                  <span>Upload & Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
