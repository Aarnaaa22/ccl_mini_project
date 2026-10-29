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
  ChevronRight,
  PlusCircle,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import EvaluateModal from './EvaluateModal';
import { getSubmissions, getAssignments, getS3DownloadUrl, createAssignment } from '../api';

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

  // New Assignment Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

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

  // Create Assignment Handler
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim() || !newDueDate) return;

    setIsCreatingAssignment(true);
    try {
      await createAssignment({
        title: newTitle.trim(),
        description: newDesc.trim(),
        due_date: newDueDate,
        created_by: faculty?.id || 1,
      });
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      setIsCreateModalOpen(false);
      loadData();
    } catch (err) {
      alert('Failed to create assignment: ' + err.message);
    } finally {
      setIsCreatingAssignment(false);
    }
  };

  // Metrics calculation
  const totalSubmissions = submissions.length;
  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;
  const gradedCount = submissions.filter((s) => s.status === 'evaluated').length;
  const gradedSubmissions = submissions.filter((s) => s.marks !== null && s.marks !== undefined);
  const averageScore = gradedSubmissions.length > 0
    ? (gradedSubmissions.reduce((sum, s) => sum + parseFloat(s.marks), 0) / gradedSubmissions.length).toFixed(1)
    : '—';

  // Filter logic
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch = 
      sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.student_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.assignment_title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (assignmentFilter !== 'all' && String(sub.assignment_id) !== String(assignmentFilter)) return false;

    return true;
  });

  return (
    <div className="space-y-8">
      
      {/* Faculty Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Faculty Evaluation Terminal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
              Welcome, <span className="text-gradient-aurora">{faculty?.name || 'Dr. Aris Thorne'}</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Review and audit student submissions stored securely on <span className="text-slate-200 font-medium">Amazon S3</span>, issue point allocations, and communicate revision notes directly to student workspaces.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-glow-indigo transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post New Lab</span>
            </button>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Submissions</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-white tracking-tight">{totalSubmissions}</p>
          <p className="text-[11px] text-slate-500">Across all active course labs</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Needs Evaluation</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-amber-400 tracking-tight">{pendingCount}</p>
          <p className="text-[11px] text-slate-500">Awaiting your review</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Evaluated / Graded</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-emerald-400 tracking-tight">{gradedCount}</p>
          <p className="text-[11px] text-slate-500">Marks published to database</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Cohort Average</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-cyan-400 tracking-tight">
            {averageScore} {averageScore !== '—' && <span className="text-sm font-normal text-slate-500 font-sans">/ 100</span>}
          </p>
          <p className="text-[11px] text-slate-500">Calculated across evaluations</p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-3 rounded-2xl border border-slate-800">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student or lab name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input text-xs rounded-xl pl-9 pr-4 py-2 placeholder-slate-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input text-xs rounded-xl px-3 py-2 text-slate-300 outline-none cursor-pointer"
          >
            <option value="all" className="bg-slate-900">All Statuses</option>
            <option value="submitted" className="bg-slate-900">Needs Review</option>
            <option value="evaluated" className="bg-slate-900">Evaluated</option>
            <option value="needs_revision" className="bg-slate-900">Needs Revision</option>
          </select>

          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="glass-input text-xs rounded-xl px-3 py-2 text-slate-300 outline-none cursor-pointer max-w-[200px] truncate"
          >
            <option value="all" className="bg-slate-900">All Labs</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900">
                {a.title}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Submissions Table / Cards */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Student Candidate</th>
                <th className="py-4 px-6">Assignment Lab</th>
                <th className="py-4 px-6">Submitted Date</th>
                <th className="py-4 px-6">S3 Artifact</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Score</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto mb-2" />
                    Fetching submissions from database...
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    No student submissions match your query.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isGraded = sub.status === 'evaluated';

                  return (
                    <tr 
                      key={sub.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Student Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/30 text-xs">
                            {sub.student_name?.split(' ').map(n => n[0]).join('') || 'S'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100">{sub.student_name}</p>
                            <p className="text-[11px] text-slate-500 font-mono">{sub.student_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Lab Title */}
                      <td className="py-4 px-6 max-w-xs">
                        <p className="font-medium text-slate-200 truncate">{sub.assignment_title}</p>
                        <span className="text-[10px] text-cyan-400 font-mono">LAB-0{sub.assignment_id}</span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(sub.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>

                      {/* S3 Artifact Download */}
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => handleDownload(sub)}
                          disabled={downloadingId === sub.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-400 hover:text-cyan-300 text-xs transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingId === sub.id ? 'Presigning...' : 'Download PDF'}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <StatusBadge status={sub.status} />
                      </td>

                      {/* Marks */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {sub.marks !== null ? (
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {sub.marks} <span className="text-slate-500 text-xs font-normal">/ 100</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs italic">Not graded</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setIsEvaluateModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isGraded ? 'Update Grade' : 'Evaluate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evaluate Modal */}
      {isEvaluateModalOpen && (
        <EvaluateModal
          submission={selectedSubmission}
          isOpen={isEvaluateModalOpen}
          onClose={() => setIsEvaluateModalOpen(false)}
          onSuccess={() => {
            loadData();
            setIsEvaluateModalOpen(false);
          }}
        />
      )}

      {/* Create New Assignment Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 border border-slate-700 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-heading font-bold text-lg text-white">Create New Course Lab</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Lab Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab 4: Microservices Observability with CloudWatch"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description & Requirements</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the cloud architecture goals, requirements, and PDF submission guidelines..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Submission Deadline</label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAssignment}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium text-xs shadow-glow-indigo"
                >
                  {isCreatingAssignment ? 'Publishing...' : 'Publish Lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
