import React from 'react';
import { Clock, CheckCircle2, AlertTriangle, FileQuestion } from 'lucide-react';

export default function StatusBadge({ status, className = '' }) {
  switch (status) {
    case 'evaluated':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Graded
        </span>
      );
    case 'needs_revision':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/70 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Needs Revision
        </span>
      );
    case 'submitted':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/70 ${className}`}>
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          Submitted
        </span>
      );
    case 'pending':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>
          <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
          Not Submitted
        </span>
      );
  }
}
