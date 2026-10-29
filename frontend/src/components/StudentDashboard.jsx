import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  FileCheck2, 
  UploadCloud, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Award,
  Search,
  BookOpen,
  RefreshCw,
  MessageSquare,
  FileText,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Cloud
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import SubmitModal from './SubmitModal';
import { getAssignments, getStudentSubmissions, getS3DownloadUrl } from '../api';

export default function StudentDashboard({ student }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all | to_submit | completed
  const [searchQuery, setSearchQuery] = useState('');
  
  // Submit modal state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadData = async () => {
    if (!student?.id) return;
    setIsLoading(true);
    try {
      const [assignmentsData, submissionsData] = await Promise.all([
        getAssignments(),
        getStudentSubmissions(student.id),
      ]);
      setAssignments(assignmentsData);
      setSubmissions(submissionsData);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [student?.id]);

  // Map submissions by assignment_id
  const submissionsMap = React.useMemo(() => {
    const map = {};
    submissions.forEach((sub) => {
      if (!map[sub.assignment_id] || new Date(sub.submitted_at) > new Date(map[sub.assignment_id].submitted_at)) {
        map[sub.assignment_id] = sub;
      }
    });
    return map;
  }, [submissions]);

  // View / Download S3 PDF handler
  const handleViewPdf = async (submission) => {
    setDownloadingId(submission.id);
    try {
      const url = await getS3DownloadUrl(
        submission.file_key || submission.file_url,
        `submission_assignment_${submission.assignment_id}.pdf`
      );
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert('Could not generate secure view URL: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // Metrics
  const totalTasks = assignments.length;
  const totalSubmitted = Object.keys(submissionsMap).length;
  const totalGraded = Object.values(submissionsMap).filter((s) => s.status === 'evaluated').length;
  const totalPending = totalTasks - totalSubmitted;
  const progressPercent = totalTasks > 0 ? Math.round((totalSubmitted / totalTasks) * 100) : 0;

  // Filtered Assignments
  const filteredAssignments = assignments.filter((item) => {
    const submission = submissionsMap[item.id];
    const isCompleted = submission && (submission.status === 'evaluated' || submission.status === 'submitted');

    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'to_submit') return !submission || submission.status === 'needs_revision';
    if (activeFilter === 'completed') return isCompleted;
    return true;
  });

  return (
    <div className="space-y-8">
      
      {/* Hero Banner with Modern Gradient Glow */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Learning Terminal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-gradient-cyan">{student?.name || 'Alex Mercer'}</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Submit your cloud architecture reports directly to <span className="text-slate-200 font-medium">Amazon S3</span> via pre-signed URLs, track instant validation, and inspect comprehensive faculty grading feedback.
            </p>
          </div>

          {/* Quick Progress Indicator & Refresh */}
          <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="text-slate-400 font-medium">Semester Progress</span>
                <span className="text-cyan-400 font-bold font-mono">{progressPercent}%</span>
              </div>
              <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">{totalSubmitted} of {totalTasks} labs completed</p>
            </div>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Refresh assignments & submissions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row with Luminous Icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Coursework</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-white tracking-tight">{totalTasks}</p>
          <p className="text-[11px] text-slate-500">Scheduled for this term</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Uploaded to S3</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-cyan-400 tracking-tight">{totalSubmitted}</p>
          <p className="text-[11px] text-slate-500">Cryptographically signed</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Evaluated & Graded</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-emerald-400 tracking-tight">{totalGraded}</p>
          <p className="text-[11px] text-slate-500">Feedback available</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pending Action</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-heading font-extrabold text-amber-400 tracking-tight">{totalPending}</p>
          <p className="text-[11px] text-slate-500">Awaiting your submission</p>
        </div>

      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-2.5 rounded-2xl border border-slate-800">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'all' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Coursework ({totalTasks})
          </button>
          <button
            onClick={() => setActiveFilter('to_submit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'to_submit' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            To Submit ({totalPending})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === 'completed' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Submitted ({totalSubmitted})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-input text-xs rounded-xl pl-9 pr-4 py-2 placeholder-slate-500"
          />
        </div>

      </div>

      {/* Assignment Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-16 text-center space-y-3 glass-panel rounded-3xl border border-slate-800">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading assignments & submissions from AWS backend...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-16 text-center space-y-3 glass-panel rounded-3xl border border-slate-800">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">No assignments found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search terms or filter selection.</p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => {
            const submission = submissionsMap[assignment.id];
            const isEvaluated = submission?.status === 'evaluated';
            const isNeedsRevision = submission?.status === 'needs_revision';
            const isSubmitted = !!submission;

            return (
              <div 
                key={assignment.id}
                className="group glass-panel rounded-2xl p-6 border border-slate-800/80 hover:border-slate-700 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-300 space-y-5"
              >
                {/* Header with Title and Due Date */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        LAB-0{assignment.id}
                      </span>
                      <StatusBadge status={submission?.status || 'pending'} />
                      {isEvaluated && submission.marks !== null && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                          <Award className="w-3.5 h-3.5 text-emerald-400" />
                          {submission.marks} / 100
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-heading font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {assignment.title}
                    </h2>
                  </div>

                  {/* Due Date Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Due: {new Date(assignment.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Description Body */}
                <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed font-light">
                  {assignment.description}
                </p>

                {/* Submission & Feedback Status Drawer */}
                {submission && (
                  <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span className="font-mono text-slate-300">
                          {submission.file_key?.split('/').pop() || 'submission.pdf'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleViewPdf(submission)}
                        disabled={downloadingId === submission.id}
                        className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{downloadingId === submission.id ? 'Requesting S3 Presign...' : 'Inspect Uploaded PDF'}</span>
                      </button>
                    </div>

                    {/* Feedback if available */}
                    {submission.feedback && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-800/40">
                        <MessageSquare className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                        <div className="space-y-0.5">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400">
                            Faculty Evaluation Notes:
                          </span>
                          <p className="italic text-slate-300/90">{submission.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span>Instructor:</span>
                    <span className="text-slate-300 font-medium">{assignment.faculty_name || 'Dr. Aris Thorne'}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {(!isSubmitted || isNeedsRevision) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsSubmitModalOpen(true);
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-glow-cyan shadow-sm transition-all duration-300 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>{isNeedsRevision ? 'Upload Resubmission' : 'Submit Assignment (PDF)'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsSubmitModalOpen(true);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 transition-colors"
                      >
                        Upload newer revision
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* S3 Upload Modal */}
      {isSubmitModalOpen && (
        <SubmitModal
          assignment={selectedAssignment}
          student={student}
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={() => {
            loadData();
            setIsSubmitModalOpen(false);
          }}
        />
      )}

    </div>
  );
}
