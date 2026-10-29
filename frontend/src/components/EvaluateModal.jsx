import React, { useState } from 'react';
import { 
  X, 
  Award, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  MessageSquare,
  Sparkles,
  Download
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
  const quickComments = [
    'Outstanding architectural partitioning and clear diagramming.',
    'Good execution. Security group rules follow least-privilege principles.',
    'Lacks KMS SSE-S3 encryption requirements. Please update IAM role and resubmit.',
    'Please verify VPC route table associations and private subnet NAT routing.',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-slate-700/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-white">
                Grade Submission #{submission.id}
              </h3>
              <p className="text-xs text-slate-400">
                Candidate: <span className="text-slate-200 font-semibold">{submission.student_name}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveEvaluation} className="p-6 space-y-5 text-xs">
          
          {/* Submission Context Strip */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[11px] text-slate-400 font-medium">Assignment Target</p>
              <p className="text-xs font-semibold text-slate-200 truncate">{submission.assignment_title}</p>
            </div>

            <button
              type="button"
              onClick={handleOpenPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 font-medium transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Opening...' : 'View PDF'}</span>
            </button>
          </div>

          {/* Marks Input & Quick Select Chips */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold">Point Allocation (0 - 100)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                required
                placeholder="e.g. 95.0"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className="glass-input rounded-xl px-4 py-2.5 text-base font-mono font-bold text-cyan-400 w-36"
              />
              <span className="text-sm font-semibold text-slate-500">/ 100</span>

              <div className="flex items-center gap-1.5 ml-auto">
                {quickMarks.map((qm) => (
                  <button
                    key={qm}
                    type="button"
                    onClick={() => setMarks(qm)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
                      marks === qm 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {qm}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Decision Status Radio Pill */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold">Evaluation Status</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('evaluated')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'evaluated'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-sm shadow-emerald-500/10'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Approved & Graded</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Accept submission and publish final marks</p>
              </button>

              <button
                type="button"
                onClick={() => setStatus('needs_revision')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  status === 'needs_revision'
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-300 shadow-sm shadow-amber-500/10'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Needs Revision</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Prompt student to upload an amended report</p>
              </button>
            </div>
          </div>

          {/* Feedback Notes with Quick Chips */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-semibold">
              Faculty Feedback & Critique
            </label>
            <textarea
              rows={3}
              placeholder="Provide constructive feedback, VPC/IAM recommendations, or rubric notes..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full glass-input rounded-xl p-3 resize-none text-slate-200"
            />

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Quick Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickComments.map((comment, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFeedback(comment)}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors text-left"
                  >
                    "{comment.slice(0, 38)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-glow-indigo transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Evaluation</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
