import React, { useState } from 'react';
import { 
  Cloud, 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  Server,
  Database,
  Radio,
  Layers,
  Sparkles,
  Info
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
  const availableUsers = users.filter((u) => u.role === currentRole);
  const [showCloudDetails, setShowCloudDetails] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#080d1a]/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 rounded-2xl blur-sm opacity-70 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <Cloud className="w-6 h-6 animate-float" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  Assignment<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Hub</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm shadow-cyan-500/10">
                  <Sparkles className="w-2.5 h-2.5" /> AWS Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:flex items-center gap-2 mt-0.5">
                <span>EC2 Microservices</span>
                <span>•</span>
                <span>S3 Direct PUT</span>
                <span>•</span>
                <span>SSM Key Decryption</span>
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3 sm:gap-5">
            
            {/* Live Cloud Status Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCloudDetails(!showCloudDetails)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 transition-all cursor-pointer hover:border-slate-600"
                title="Click to view AWS Cloud Infrastructure metrics"
              >
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${healthStatus?.status === 'UP' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${healthStatus?.status === 'UP' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
                <span className="font-medium font-mono text-[11px] text-slate-200">
                  {healthStatus?.region || 'us-east-1'}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                  {healthStatus?.database === 'healthy' ? 'RDS Connected' : 'Seed Active'}
                </span>
              </button>

              {/* Cloud Details Flyout */}
              {showCloudDetails && (
                <div className="absolute right-0 mt-2 w-72 p-4 rounded-2xl glass-panel shadow-2xl z-50 text-xs space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" /> Infrastructure Live
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      ONLINE
                    </span>
                  </div>
                  <div className="space-y-2 text-slate-400 text-[11px]">
                    <div className="flex justify-between items-center">
                      <span>Host Compute:</span>
                      <span className="text-slate-200 font-mono">EC2 (35.170.78.127)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Object Storage:</span>
                      <span className="text-slate-200 font-mono">Amazon S3 (Encrypted)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Parameter Store:</span>
                      <span className="text-slate-200 font-mono">AWS SSM (KMS Decrypt)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Database Engine:</span>
                      <span className="text-slate-200 font-mono">MySQL 8.0 RDS Cluster</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher Pill with Ambient Glow */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => onRoleChange('student')}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  !isFaculty 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow-cyan shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <GraduationCap className={`w-4 h-4 ${!isFaculty ? 'text-white' : 'text-slate-400'}`} />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => onRoleChange('faculty')}
                className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${
                  isFaculty 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow-indigo shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${isFaculty ? 'text-white' : 'text-slate-400'}`} />
                <span>Faculty</span>
              </button>
            </div>

            {/* Active User Persona Avatar & Selector */}
            <div className="flex items-center gap-2.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 px-3 py-1.5 rounded-xl transition-all">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                isFaculty ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}>
                {currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
              </div>

              <select
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const selected = users.find((u) => u.id === parseInt(e.target.value, 10));
                  if (selected) onUserChange(selected);
                }}
                className="bg-transparent border-none outline-none font-medium text-xs sm:text-sm text-slate-200 cursor-pointer pr-1"
              >
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id} className="bg-slate-900 text-slate-100">
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
