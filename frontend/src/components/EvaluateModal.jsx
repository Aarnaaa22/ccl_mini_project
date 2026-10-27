import React, { useState } from 'react';
import { 
  X, 
  Award, 
  ExternalLink, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  MessageSquare
} from 'lucide-react';
import { evaluateSubmission, getS3DownloadUrl } from '../api';

export default function EvaluateModal({ submission, isOpen, onClose, onSuccess }) {
  const [marks, setMarks] = useState(submission?.marks !== null ? submission.marks : '');
  const [status, setStatus] = useState(submission?.status || 'evaluated');
  const [feedback, setFeedback] = useState(submission?.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !submission) return null;

  const handleOpenPdf = async () => {
    setIsDownloading(true);
    try {
      const url = await getS3DownloadUrl(
        submission.file_key || submission.file_url,
        `${submission.student_name}_assignment_${submission.assignment_id}.pdf`
      );
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert('Failed to generate pre-signed view link: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Validation
    const numericMarks = parseFloat(marks);
    if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > 100) {
      setErrorMessage('Please enter a valid marks score between 0 and 100.');
      return;
    }

    setIsSubmitting(true);
    try {
      await evaluateSubmission(submission.id, {
        marks: numericMarks,
        status,
        feedback: feedback.trim(),
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving evaluation:', err);
      setErrorMessage(err.message || 'Failed to update evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickMarks = [100, 95, 90, 85, 75];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Evaluate Submission #{submission.id}
              </h3>
              <p className="text-xs text-slate-500">
                Grade and provide feedback to the student
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveEvaluation} className="p-6 space-y-4">
          
          {/* Student & Assignment Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Student:</span>
              <span className="font-semibold text-slate-800">{submission.student_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Assignment:</span>
              <span className="font-medium text-slate-800 truncate max-w-[240px]">
                {submission.assignment_title}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">Submitted:</span>
              <span className="text-slate-700">
                {new Date(submission.submitted_at).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenPdf}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200/80 transition-colors"
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5" />
                )}
                <span>Preview Student's Submitted PDF</span>
              </button>
            </div>
          </div>

          {/* Marks Input & Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Marks (Score out of 100) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="e.g. 92.5"
                required
                className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-xs text-slate-400 font-medium">/ 100</span>
              
              {/* Quick Presets */}
              <div className="flex items-center gap-1 ml-auto">
                {quickMarks.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMarks(preset)}
                    className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Evaluation Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Submission Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="evaluated">Graded (Complete)</option>
              <option value="needs_revision">Needs Revision (Send back to student)</option>
              <option value="submitted">Under Review (Pending further evaluation)</option>
            </select>
          </div>

          {/* Feedback & Comments */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Feedback & Evaluation Notes
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Excellent architecture diagrams. Well structured explanations for the NAT Gateway..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Save Evaluation</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
