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
    <div className="min-h-screen bg-[#070b15] flex flex-col items-center justify-center p-4 font-sans text-neutral-100 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[32px] border border-white/10 shadow-[0_0_60px_-15px_rgba(234,88,12,0.3)] w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <img src="/logo.png" alt="The Ridery Logo" className="h-12 object-contain brightness-0 invert" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 tracking-tight">WINGCLASS</h1>
          <p className="text-neutral-400 mt-2 font-medium">Connectez-vous à votre espace</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-medium text-center flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-neutral-300 ml-1">Adresse Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-inner font-medium"
              placeholder="votre@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-neutral-300 ml-1">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all shadow-inner font-medium"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold tracking-wide py-4 px-4 rounded-2xl transition-all shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Authentification...' : 'SE CONNECTER'}
          </button>
        </form>
      </div>
      
      <div className="mt-8 text-neutral-600 text-xs font-bold tracking-widest uppercase">
        © 2026 THE RIDERY
      </div>
    </div>
  );
}
