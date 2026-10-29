import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles
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
    setUploadProgress(15);

    try {
      // Step 1: Request Pre-signed S3 URL from Backend API
      setUploadStep('Requesting cryptographic AWS S3 pre-signed upload URL...');
      const s3Data = await getS3UploadPresignedUrl({
        fileName: file.name,
        fileType: file.type || 'application/pdf',
        studentId: student.id,
        assignmentId: assignment.id,
      });

      setUploadProgress(35);

      // Step 2: Direct Client-to-S3 Upload
      setUploadStep('Streaming PDF payload directly to Amazon S3...');
      await uploadPdfToS3Direct(s3Data.uploadUrl, file, (progress) => {
        setUploadProgress(35 + Math.round(progress * 0.5));
      });

      setUploadProgress(85);

      // Step 3: Record Submission in MySQL Database
      setUploadStep('Registering submission metadata in MySQL cluster...');
      await createSubmissionRecord({
        assignment_id: assignment.id,
        student_id: student.id,
        file_url: s3Data.fileUrl,
        file_key: s3Data.fileKey,
      });

      setUploadProgress(100);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);

    } catch (err) {
      console.error('Submission failed:', err);
      setErrorMessage(err.message || 'An error occurred during submission.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow ambient spots */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 rounded-full bg-cyan-500/15 blur-2xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                Submit Coursework
              </h3>
              <p className="text-xs text-slate-400">
                {assignment.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {isSuccess ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-heading font-bold text-lg text-white">Uploaded Successfully!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Your report has been written directly to the Amazon S3 submissions bucket and queued for faculty review.
              </p>
            </div>
          ) : (
            <>
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-cyan-400 bg-cyan-500/10' 
                    : file 
                      ? 'border-emerald-500/50 bg-emerald-500/5' 
                      : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => validateAndSetFile(e.target.files[0])}
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-sm text-slate-200">{file.name}</p>
                    <p className="text-xs text-slate-400 font-mono">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for S3 upload
                    </p>
                    <span className="inline-block text-[11px] text-cyan-400 hover:underline pt-1">
                      Click to choose a different PDF
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        Drag & drop your PDF file here, or <span className="text-cyan-400 font-semibold">browse</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Strictly PDF format only • Maximum file size 25MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* AWS Security & Architecture Callout */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>
                  Direct client-side PUT using temporary AWS IAM pre-signed credentials. No server bottleneck.
                </span>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      {uploadStep}
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!file || isUploading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-glow-cyan shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to S3...</span>
                    </>
                  ) : (
                    <>
                      <span>Transmit to S3</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
