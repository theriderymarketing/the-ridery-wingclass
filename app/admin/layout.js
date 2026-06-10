'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseProxy as supabase } from '../../lib/supabase-proxy';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'admin' || !profile) {
        // We let it pass if no profile but logged in (fallback for development)
        setAuthorized(true);
      } else {
        router.push('/login');
      }
    };

    checkAdmin();
  }, [router]);

  if (!authorized) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Vérification des accès...</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      {/* Sidebar */}
      <aside className="w-64 bg-white text-gray-900 flex flex-col hidden md:flex fixed h-full z-20 border-r border-gray-200">
        <div className="p-8 border-b border-gray-100 flex items-center justify-center">
          <img src="/logo.png" alt="The Ridery Logo" className="h-10 object-contain" />
        </div>
        
        <div className="px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Administration</p>
          <nav className="space-y-1.5">
            <a href="/admin" className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-600 rounded-lg font-semibold transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Planning Général
            </a>
            <a href="/admin/instructors" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-all group">
              <svg className="w-5 h-5 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Professeurs
            </a>
            <a href="/admin/students" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-all group">
              <svg className="w-5 h-5 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              Élèves & Crédits
            </a>
          </nav>
        </div>

        <div className="px-6 py-4 mt-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Système</p>
          <nav>
            <a href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-all group">
              <svg className="w-5 h-5 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Paramètres & Accès
            </a>
          </nav>
        </div>
        
        <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <span className="text-xs text-gray-500 font-medium">WINGCLASS v2.0</span>
          <button onClick={() => { supabase.auth.signOut(); router.push('/login'); }} className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors uppercase tracking-wider px-3 py-1.5 rounded-md hover:bg-red-50">Déconnexion</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative min-w-0 bg-[#F3F4F6]">
        {children}
      </main>
    </div>
  );
}
