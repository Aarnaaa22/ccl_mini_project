import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Download, 
  ExternalLink,
  Edit3, 
  Search, 
  Filter, 
  RefreshCw,
  Award,
  ChevronRight
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import EvaluateModal from './EvaluateModal';
import { getSubmissions, getAssignments, getS3DownloadUrl } from '../api';

export default function FacultyDashboard({ faculty }) {
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  // Evaluation Modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isEvaluateModalOpen, setIsEvaluateModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [submissionsData, assignmentsData] = await Promise.all([
        getSubmissions(),
        getAssignments(),
      ]);
      setSubmissions(submissionsData);
      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Failed to load faculty dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Secure S3 Download Handler
  const handleDownload = async (submission) => {
    setDownloadingId(submission.id);
    try {
      const fileName = `${submission.student_name}_assignment_${submission.assignment_id}.pdf`;
      const downloadUrl = await getS3DownloadUrl(
        submission.file_key || submission.file_url,
        fileName
      );
      if (downloadUrl) {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert('Error fetching secure download URL: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // Metrics calculation
  const totalSubmissions = submissions.length;
  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;
  const gradedCount = submissions.filter((s) => s.status === 'evaluated').length;
  const revisionCount = submissions.filter((s) => s.status === 'needs_revision').length;

  const gradedSubmissions = submissions.filter((s) => s.marks !== null && s.marks !== undefined);
  const averageScore = gradedSubmissions.length > 0
    ? (gradedSubmissions.reduce((sum, s) => sum + parseFloat(s.marks), 0) / gradedSubmissions.length).toFixed(1)
    : '—';

  // Filter logic
  const filteredSubmissions = submissions.filter((sub) => {
    // Search filter
    const matchesSearch = 
      sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.assignment_title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;

    // Assignment filter
    if (assignmentFilter !== 'all' && String(sub.assignment_id) !== String(assignmentFilter)) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Faculty Grading Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {faculty?.name || 'Faculty Evaluator'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming student submissions, inspect S3 artifacts, and submit grades.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Submissions</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalSubmissions}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Pending Review</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Evaluated / Graded</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{gradedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Class Average Score</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {averageScore} {averageScore !== '—' && <span className="text-xs text-slate-400 font-normal">/ 100</span>}
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, email, or task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          
          {/* Assignment Filter */}
          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Assignments</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                Task #{a.id}: {a.title.slice(0, 28)}...
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Pending Review</option>
            <option value="evaluated">Graded</option>
            <option value="needs_revision">Needs Revision</option>
          </select>

        </div>

      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Fetching student submissions from database...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No submissions found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || assignmentFilter !== 'all'
                ? 'No submissions match your active filter criteria.'
                : 'There are currently no student submissions in the portal.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Student</th>
                  <th className="py-3.5 px-4">Assignment</th>
                  <th className="py-3.5 px-4">Submitted At</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredSubmissions.map((sub) => {
                  const submittedDate = new Date(sub.submitted_at);

                  return (
                    <tr 
                      key={sub.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Student info */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {sub.student_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{sub.student_name}</p>
                            <p className="text-[11px] text-slate-500">{sub.student_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Assignment */}
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-800 max-w-xs truncate" title={sub.assignment_title}>
                          {sub.assignment_title}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Due: {new Date(sub.assignment_due_date).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Submitted At */}
                      <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                        <p>
                          {submittedDate.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {submittedDate.toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {sub.marks !== null ? (
                          <div className="inline-flex items-baseline gap-1 font-bold text-slate-900">
                            <span>{sub.marks}</span>
                            <span className="text-[10px] text-slate-400 font-normal">/ 100</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <StatusBadge status={sub.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          
                          {/* Secure Download Button */}
                          <button
                            type="button"
                            onClick={() => handleDownload(sub)}
                            disabled={downloadingId === sub.id}
                            title="Download student PDF from AWS S3"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-600" />
                            <span className="hidden sm:inline">
                              {downloadingId === sub.id ? 'Fetching...' : 'Download'}
                            </span>
                          </button>

                          {/* Evaluate / Grade Form Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setIsEvaluateModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{sub.status === 'evaluated' ? 'Edit Grade' : 'Grade'}</span>
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Faculty Evaluation Form Modal */}
      <EvaluateModal
        isOpen={isEvaluateModalOpen}
        submission={selectedSubmission}
        onClose={() => {
          setIsEvaluateModalOpen(false);
          setSelectedSubmission(null);
        }}
        onSuccess={() => {
          loadData();
        }}
      />

    </div>
  );
}
