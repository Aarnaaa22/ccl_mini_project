import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StudentDashboard from './components/StudentDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import { getUsers, checkBackendHealth } from './api';
import { Shield, Cloud, Server, Database, KeyRound } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentRole === 'student' ? (
          <StudentDashboard student={currentUser} />
        ) : (
          <FacultyDashboard faculty={currentUser} />
        )}
      </main>

      {/* Cloud Architecture Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Cloud Architecture:</span>
            <span>AWS EC2 • RDS MySQL • S3 Pre-signed URLs • SSM Parameter Store</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-slate-500" /> EC2 IAM Role
            </span>
            <span className="flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" /> SSM Decryption
            </span>
            <span className="flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-slate-500" /> S3 Client v3
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
