'use client';

import { useState } from 'react';
import { supabaseProxy as supabase } from '../../lib/supabase-proxy';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authentification Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Vérification du rôle dans la table profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const role = profileData?.role || 'admin'; // Par défaut admin si pas de profil

      // 3. Redirection selon le rôle
      if (role === 'admin') router.push('/admin');
      else if (role === 'instructor') router.push('/prof');
      else if (role === 'partner') router.push('/partenaire');
      else router.push('/'); // Fallback
      
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col items-center justify-center p-4 font-sans text-gray-900 relative overflow-hidden">
      
      <div className="bg-white p-10 rounded-[20px] border border-gray-200/60 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08)] w-full max-w-md relative z-10 transition-all">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <img src="/logo.png" alt="The Ridery Logo" className="h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Espace Wingclass</h1>
          <p className="text-gray-500 mt-2 font-medium">Connectez-vous à votre tableau de bord</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium text-center flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Adresse Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-medium"
              placeholder="votre@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-gray-200 rounded-xl px-5 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-500 hover:to-orange-500 text-white font-bold tracking-wide py-3.5 px-4 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(249,115,22,0.39)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.23)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed mt-2 border-none"
          >
            {loading ? 'Authentification...' : 'SE CONNECTER'}
          </button>
        </form>
      </div>
      
      <div className="mt-8 text-gray-400 text-xs font-bold tracking-widest uppercase">
        © 2026 THE RIDERY
      </div>
    </div>
  );
}
