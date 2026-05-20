import React from 'react';
import { useClerk } from '@clerk/clerk-react';
import { AlertTriangle, LogOut, Mail } from 'lucide-react';

export default function UserNotRegisteredError() {
  const { signOut } = useClerk();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1C1A18]">
      <div className="text-center p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 max-w-md mx-4 w-full">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <AlertTriangle size={28} className="text-amber-400" />
        </div>
        <h1 className="text-xl font-semibold text-[#F0EBE8] mb-2">Access Restricted</h1>
        <p className="text-[#F0EBE8]/60 text-sm leading-relaxed mb-6">
          Your account is not yet registered in the system. Please contact your administrator to request access.
        </p>
        <div className="bg-white/5 rounded-xl p-4 text-left mb-6 border border-white/5">
          <p className="text-xs text-[#F0EBE8]/40 uppercase tracking-wider mb-2 font-medium">What to do:</p>
          <ul className="space-y-1.5">
            {[
              'Make sure you signed in with the correct email',
              'Ask your admin to assign your role',
              'Contact support@kranely.com for help',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[#F0EBE8]/60">
                <span className="w-1 h-1 rounded-full bg-[#FFC703] mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3">
          <a
            href="mailto:support@kranely.com"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#FFC703]/30 text-[#FFC703] text-sm hover:bg-[#FFC703]/10 transition-colors"
          >
            <Mail size={14} />
            Contact Support
          </a>
          <button
            onClick={() => signOut()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F0EBE8]/70 text-sm hover:bg-white/10 transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
