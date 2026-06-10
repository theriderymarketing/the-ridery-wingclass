'use client';

import { useState, useEffect } from 'react';
import { supabaseProxy as supabase } from '../../lib/supabase-proxy';
import { useRouter } from 'next/navigation';

export default function PartenairePage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    // Load sessions for today and future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        *,
        instructors (first_name, last_name),
        course_types (name, color, duration_minutes)
      `)
      .gte('start_time', today.toISOString())
      .order('start_time', { ascending: true });

    if (!sessionsError && sessionsData) {
      setSessions(sessionsData);
    }
    setLoading(false);
  };

  const loadParticipants = async (sessionId) => {
    setSelectedSession(sessionId);
    const { data, error } = await supabase
      .from('session_participants')
      .select(`
        id,
        status,
        customers (
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          address,
          has_license,
          license_number,
          purchased_license_type
        )
      `)
      .eq('session_id', sessionId);

    if (!error && data) {
      setParticipants(data);
    }
  };

  if (loading) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">Chargement...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12 bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Espace Partenaire - La Pelle</h1>
            <p className="text-neutral-400 mt-1">Gérez les arrivées sur le spot</p>
          </div>
          <button 
            onClick={() => { supabase.auth.signOut(); router.push('/login'); }}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm font-medium transition-colors"
          >
            Déconnexion
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des cours à venir */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Planning des cours</h2>
            {sessions.map(session => (
              <div 
                key={session.id} 
                onClick={() => loadParticipants(session.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  selectedSession === session.id 
                    ? 'bg-neutral-800 border-orange-500 shadow-lg shadow-orange-500/10' 
                    : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="px-3 py-1 bg-neutral-700 rounded-full text-xs font-medium text-white flex items-center">
                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: session.course_types?.color || '#10B981' }}></span>
                    {session.course_types?.name}
                  </span>
                  <span className="text-sm font-medium text-neutral-400">
                    {new Date(session.start_time).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="text-lg font-bold text-white">
                  {new Date(session.start_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})} - {new Date(session.end_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="text-sm text-neutral-400 mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Moniteur: {session.instructors?.first_name} {session.instructors?.last_name}
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-neutral-500 text-center py-8">Aucun cours programmé.</div>
            )}
          </div>

          {/* Détails du cours et participants */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-6">Élèves inscrits ({participants.length})</h2>
                
                {participants.length > 0 ? (
                  <div className="space-y-4">
                    {participants.map(p => (
                      <div key={p.id} className="bg-neutral-900 border border-neutral-700/50 rounded-xl p-5">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-bold text-white">
                            {p.customers.first_name} {p.customers.last_name}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            p.status === 'booked' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            p.status === 'attended' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-neutral-700 text-neutral-300'
                          }`}>
                            {p.status === 'booked' ? 'Confirmé' : p.status === 'attended' ? 'Présent' : p.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="block text-neutral-500 mb-1">Contact</span>
                            <div className="text-neutral-300">{p.customers.phone || 'Non renseigné'}</div>
                            <div className="text-neutral-300">{p.customers.email || 'Non renseigné'}</div>
                          </div>
                          <div>
                            <span className="block text-neutral-500 mb-1">Détails personnels</span>
                            <div className="text-neutral-300">Né(e) le : {p.customers.date_of_birth ? new Date(p.customers.date_of_birth).toLocaleDateString('fr-FR') : 'Non renseigné'}</div>
                            <div className="text-neutral-300 truncate">Adresse : {p.customers.address || 'Non renseigné'}</div>
                          </div>
                          <div className="md:col-span-2 mt-2 pt-4 border-t border-neutral-800">
                            <span className="block text-neutral-500 mb-2">Licence FFVoile</span>
                            {p.customers.has_license ? (
                              <div className="flex items-center text-green-400 bg-green-400/10 px-3 py-2 rounded-lg inline-flex">
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                N° {p.customers.license_number}
                              </div>
                            ) : (
                              <div className="flex items-center text-orange-400 bg-orange-400/10 px-3 py-2 rounded-lg inline-flex border border-orange-400/20">
                                <span className="font-medium mr-2">Achat sur place :</span> 
                                {p.customers.purchased_license_type === 'daily' ? 'Licence Journée' : 
                                 p.customers.purchased_license_type === 'annual' ? 'Licence Annuelle' : 'À régler sur place'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-neutral-900 rounded-xl border border-neutral-800">
                    <p className="text-neutral-500">Aucun élève inscrit pour le moment.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
                <svg className="w-16 h-16 text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-neutral-400 text-lg">Sélectionnez un cours à gauche pour voir la liste des élèves</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
