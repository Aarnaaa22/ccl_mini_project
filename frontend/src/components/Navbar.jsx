import React from 'react';
import { 
  Cloud, 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  ChevronDown,
  Layers
} from 'lucide-react';

export default function Navbar({ 
  currentRole, 
  onRoleChange, 
  users, 
  currentUser, 
  onUserChange,
  healthStatus 
}) {
  const isFaculty = currentRole === 'faculty';

  // Filter users based on current role
  const availableUsers = users.filter((u) => u.role === currentRole);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 tracking-tight text-lg">
                  AssignmentHub
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  AWS Cloud
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                S3 Pre-signed Uploads & SSM Parameter Store
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Cloud Health Indicator */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
              <span className={`w-2 h-2 rounded-full ${healthStatus?.status === 'UP' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-600 font-medium">
                {healthStatus?.region || 'AWS us-east-1'}
              </span>
            </div>

            {/* Role Switcher Pill */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              <button
                type="button"
                onClick={() => onRoleChange('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  !isFaculty 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-sky-600" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => onRoleChange('faculty')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  isFaculty 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Faculty</span>
              </button>
            </div>

            {/* Active User Persona Selector */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded-lg text-xs sm:text-sm">
                <UserCheck className="w-4 h-4 text-slate-500" />
                <select
                  value={currentUser?.id || ''}
                  onChange={(e) => {
                    const selected = users.find((u) => u.id === parseInt(e.target.value, 10));
                    if (selected) onUserChange(selected);
                  }}
                  className="bg-transparent border-none outline-none font-medium text-slate-800 cursor-pointer pr-1"
                >
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
