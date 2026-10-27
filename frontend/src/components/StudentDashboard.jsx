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
  MessageSquare
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
      // If student has multiple submissions for an assignment, keep the latest
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

  // Filtered Assignments
  const filteredAssignments = assignments.filter((item) => {
    const submission = submissionsMap[item.id];
    const isCompleted = submission && (submission.status === 'evaluated' || submission.status === 'submitted');

    // Search query filter
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'to_submit') return !submission || submission.status === 'needs_revision';
    if (activeFilter === 'completed') return isCompleted;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Welcome & Profile Summary Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Student Workspace
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              {student?.name || 'Active Student'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review assignment requirements, upload submissions to AWS S3, and track faculty feedback.
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Assigned</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Submitted</p>
          <p className="text-2xl font-bold text-sky-600 mt-1">{totalSubmitted}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Graded</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalGraded}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Pending Action</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totalPending}</p>
        </div>
      </div>

      {/* Search & Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 w-full sm:w-auto bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({totalTasks})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('to_submit')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeFilter === 'to_submit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            To Submit ({totalPending})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              activeFilter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({totalSubmitted})
          </button>
        </div>
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Fetching assignments and submission statuses...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No assignments found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search terms.' : 'No assignments are currently categorized under this view.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredAssignments.map((assignment) => {
            const submission = submissionsMap[assignment.id];
            const isSubmitted = !!submission;
            const isGraded = submission?.status === 'evaluated';
            const isNeedsRevision = submission?.status === 'needs_revision';
            const dueDate = new Date(assignment.due_date);
            const isPastDue = dueDate < new Date() && !isSubmitted;

            return (
              <div 
                key={assignment.id} 
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header & Meta */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Task #{assignment.id}
                      </span>
                      <h2 className="text-base font-semibold text-slate-900">
                        {assignment.title}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500">
                      Instructor: <span className="font-medium text-slate-700">{assignment.faculty_name || 'Department Faculty'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={submission ? submission.status : 'pending'} />
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
                  {assignment.description}
                </p>

                {/* Due Date & Submission Banner */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Due: <strong className="text-slate-700">{dueDate.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}</strong>
                    </span>
                    {isPastDue && (
                      <span className="text-red-600 font-semibold text-[11px] ml-1 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        Overdue
                      </span>
                    )}
                  </div>

                  {submission && (
                    <div className="text-[11px] text-slate-500">
                      Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Evaluation Feedback Panel (If Graded or Needs Revision) */}
                {submission && (isGraded || isNeedsRevision) && (
                  <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                    isGraded 
                      ? 'bg-emerald-50/40 border-emerald-200/70' 
                      : 'bg-amber-50/40 border-amber-200/80'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Award className={`w-4 h-4 ${isGraded ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span className="font-semibold text-slate-800">
                          {isGraded ? 'Faculty Grade & Evaluation' : 'Revision Required'}
                        </span>
                      </div>
                      
                      {submission.marks !== null && (
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-slate-900">
                            {submission.marks}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">/ 100</span>
                        </div>
                      )}
                    </div>

                    {submission.feedback && (
                      <div className="pt-1.5 border-t border-slate-200/60">
                        <p className="text-slate-700 italic">
                          "{submission.feedback}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Row */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  {submission ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewPdf(submission)}
                        disabled={downloadingId === submission.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {downloadingId === submission.id ? 'Generating link...' : 'View Submitted PDF'}
                        </span>
                      </button>

                      {isNeedsRevision && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setIsSubmitModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                        >
                          <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                          <span>Resubmit Revision</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsSubmitModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Submit Assignment (.pdf)</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* S3 Direct Upload Modal */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        assignment={selectedAssignment}
        student={student}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSelectedAssignment(null);
        }}
        onSuccess={() => {
          loadData();
        }}
      />

    </div>
  );
}
