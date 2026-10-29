import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, FileQuestion } from 'lucide-react';

export default function StatusBadge({ status, className = '' }) {
  switch (status) {
    case 'evaluated':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <CheckCircle2 className="w-3.5 h-3.5" />
          Graded
        </span>
      );
    case 'needs_revision':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <AlertTriangle className="w-3.5 h-3.5" />
          Needs Revision
        </span>
      );
    case 'submitted':
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/10 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
          <Clock className="w-3.5 h-3.5" />
          Under Review
        </span>
      );
    case 'pending':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800/60 text-slate-400 border border-slate-700/60 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
          <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
          Not Submitted
        </span>
      );
  }
}
