import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentDashboard from './components/StudentDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import { getUsers, checkBackendHealth } from './api';
import { Shield, Cloud, Server, Database, KeyRound, Cpu, CheckCircle2 } from 'lucide-react';

// Fallback seed personas if backend is starting up or in standalone test
const FALLBACK_USERS = [
  { id: 1, name: 'Dr. Aris Thorne', email: 'faculty.thorne@university.edu', role: 'faculty' },
  { id: 2, name: 'Prof. Evelyn Vance', email: 'faculty.vance@university.edu', role: 'faculty' },
  { id: 3, name: 'Alex Mercer', email: 'student.mercer@university.edu', role: 'student' },
  { id: 4, name: 'Maya Lin', email: 'student.lin@university.edu', role: 'student' },
  { id: 5, name: 'Jordan Lee', email: 'student.lee@university.edu', role: 'student' },
];

export default function App() {
  const [currentRole, setCurrentRole] = useState('student'); // 'student' | 'faculty'
  const [users, setUsers] = useState(FALLBACK_USERS);
  const [currentUser, setCurrentUser] = useState(FALLBACK_USERS[2]); // Default: Alex Mercer (student)
  const [healthStatus, setHealthStatus] = useState(null);

  // Load users and check cloud health
  useEffect(() => {
    async function init() {
      try {
        const [fetchedUsers, health] = await Promise.all([
          getUsers().catch(() => FALLBACK_USERS),
          checkBackendHealth(),
        ]);

        if (fetchedUsers && fetchedUsers.length > 0) {
          setUsers(fetchedUsers);
          const initialUser = fetchedUsers.find((u) => u.role === currentRole) || fetchedUsers[0];
          setCurrentUser(initialUser);
        }

        setHealthStatus(health);
      } catch (err) {
        console.warn('Backend connection notice:', err);
      }
    }

    init();
  }, []);

  // Update current user when role is toggled
  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    const matchedUser = users.find((u) => u.role === newRole);
    if (matchedUser) {
      setCurrentUser(matchedUser);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Sticky Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        users={users}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        healthStatus={healthStatus}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {currentRole === 'student' ? (
          <StudentDashboard student={currentUser} />
        ) : (
          <FacultyDashboard faculty={currentUser} />
        )}
      </main>

      {/* Futuristic Cloud Architecture Footer */}
      <footer className="bg-[#060911]/90 border-t border-slate-800/80 mt-16 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-heading font-bold text-slate-200 tracking-tight">AssignmentHub Core</span>
            </div>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="text-slate-400 font-mono text-[11px]">
              AWS EC2 Microservices • RDS MySQL 8.0 • Amazon S3 Pre-signed URLs • SSM Parameter Store
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <Server className="w-3.5 h-3.5 text-cyan-400" /> EC2 Instance Role
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> SSM KMS Decryption
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <Cloud className="w-3.5 h-3.5 text-purple-400" /> S3 Client SDK v3
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
