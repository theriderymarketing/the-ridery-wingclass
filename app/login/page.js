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
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-sans text-neutral-100">
      <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-600 text-white rounded-xl flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-lg shadow-orange-600/20">
            W
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Connexion The Ridery</h1>
          <p className="text-neutral-400 mt-2 text-sm">Accédez à votre espace Wingclass</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Adresse Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
