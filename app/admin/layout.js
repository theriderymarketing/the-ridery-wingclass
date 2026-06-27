'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabaseProxy as supabase } from '../../lib/supabase-proxy';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState('admin');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const role = session.user?.user_metadata?.role || 'admin';
      setUserRole(role);
      if (role === 'instructor' && pathname !== '/admin') {
        router.replace('/admin');
      } else if (role === 'partner' && !pathname.startsWith('/admin/licences')) {
        router.replace('/admin/licences');
      }
    };
    checkAuth();
  }, [router]);

  const getLinkClass = (href) => {
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);
    // Exception pour la page d'accueil de l'admin pour ne pas tout matcher
    const isExactMatch = href === '/admin' ? pathname === '/admin' : isActive;

    return isExactMatch
      ? "flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-600 rounded-lg font-semibold transition-all"
      : "flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg font-medium transition-all group";
  };

  const getIconClass = (href) => {
    const isActive = pathname === href || pathname?.startsWith(`${href}/`);
    const isExactMatch = href === '/admin' ? pathname === '/admin' : isActive;
    return isExactMatch ? "w-5 h-5" : "w-5 h-5 group-hover:text-gray-900 transition-colors";
  };

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`w-64 bg-white text-gray-900 flex-col fixed h-full z-50 border-r border-gray-200 ${mobileOpen ? 'flex' : 'hidden'} md:flex`}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <img src="/logo.png" alt="The Ridery Logo" className="h-10 object-contain" />
          <button onClick={() => setMobileOpen(false)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Administration</p>
          <nav className="space-y-1.5" onClick={() => setMobileOpen(false)}>
            {(userRole === 'admin' || userRole === 'instructor') && (
              <Link href="/admin" className={getLinkClass("/admin")}>
                <svg className={getIconClass("/admin")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Planning Général
              </Link>
            )}
            {userRole === 'partner' && (
              <Link href="/admin/licences" className={getLinkClass("/admin/licences")}>
                <svg className={getIconClass("/admin/licences")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Tableau des Licences
              </Link>
            )}
            {userRole === 'admin' && (<>
              <Link href="/admin/instructors" className={getLinkClass("/admin/instructors")}>
                <svg className={getIconClass("/admin/instructors")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                Professeurs
              </Link>
              <Link href="/admin/students" className={getLinkClass("/admin/students")}>
                <svg className={getIconClass("/admin/students")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                Base Élèves
              </Link>
              <Link href="/admin/promocodes" className={getLinkClass("/admin/promocodes")}>
                <svg className={getIconClass("/admin/promocodes")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                Codes Promo
              </Link>
              <Link href="/admin/analytics" className={getLinkClass("/admin/analytics")}>
                <svg className={getIconClass("/admin/analytics")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                Analyses & Stats
              </Link>
            </>)}
          </nav>
        </div>

        {userRole === 'admin' && (
          <div className="px-6 py-4 mt-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Système</p>
            <nav>
              <Link href="/admin/settings" className={getLinkClass("/admin/settings")}>
                <svg className={getIconClass("/admin/settings")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Paramètres & Accès
              </Link>
            </nav>
          </div>
        )}
        
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative min-w-0 bg-[#F3F4F6]">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(v => !v)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <img src="/logo.png" alt="The Ridery" className="h-7 object-contain" />
        </div>
        {children}
      </main>
    </div>
  );
}
