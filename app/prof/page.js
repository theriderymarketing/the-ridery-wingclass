'use client';

import { useState, useEffect } from 'react';
import { supabaseProxy as supabase } from '../../lib/supabase-proxy';
import { useRouter } from 'next/navigation';

export default function ProfPage() {
  const [sessions, setSessions] = useState([]);
  const [instructorData, setInstructorData] = useState(null);
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

    // Récupérer l'ID de l'instructeur lié à ce compte
    const { data: instructor, error: instError } = await supabase
      .from('instructors')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (instError || !instructor) {
      console.error("Erreur, aucun profil instructeur trouvé pour cet utilisateur.");
      // Optionnel: afficher une erreur
      setLoading(false);
      return;
    }

    setInstructorData(instructor);

    // Charger uniquement ses sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: sessionsData, error: sessionsError } = await supabase
      .from('sessions')
      .select(`
        *,
        course_types (name, color, duration_minutes),
        session_participants (
          id,
          status,
          customers (first_name, last_name, phone, has_license)
        )
      `)
      .eq('instructor_id', instructor.id)
      .gte('start_time', today.toISOString())
      .order('start_time', { ascending: true });

    if (!sessionsError && sessionsData) {
      setSessions(sessionsData);
    }
    setLoading(false);
  };

  const markAttendance = async (participantId, newStatus) => {
    // Mettre à jour la présence de l'élève
    await supabase
      .from('session_participants')
      .update({ status: newStatus })
      .eq('id', participantId);
    
    // Recharger silencieusement
    checkAuthAndLoadData();
  };

  if (loading) return <div className="min-h-screen bg-neutral-900 flex items-center justify-center text-white">Chargement...</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12 bg-neutral-800 p-6 rounded-2xl border border-neutral-700">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Espace Professeur</h1>
            <p className="text-neutral-400 mt-1">
              {instructorData ? `Bonjour, ${instructorData.first_name} ! Voici vos prochains cours.` : 'Profil non configuré.'}
            </p>
          </div>
          <button 
            onClick={() => { supabase.auth.signOut(); router.push('/login'); }}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm font-medium transition-colors"
          >
            Déconnexion
          </button>
        </header>

        <div className="space-y-6">
          {sessions.map(session => (
            <div key={session.id} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: session.course_types?.color || '#3B82F6' }}></div>
              
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 pl-4 border-b border-neutral-700/50 pb-6">
                <div>
                  <span className="inline-block px-3 py-1 bg-neutral-700 rounded-full text-xs font-medium text-white mb-2">
                    {session.course_types?.name}
                  </span>
                  <div className="text-2xl font-bold text-white">
                    {new Date(session.start_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <div className="text-lg text-neutral-400 mt-1">
                    {new Date(session.start_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})} - {new Date(session.end_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
                <div className="mt-4 md:mt-0 bg-neutral-900 px-4 py-3 rounded-xl border border-neutral-700">
                  <div className="text-sm text-neutral-500 mb-1">Élèves inscrits</div>
                  <div className="text-2xl font-bold text-white text-center">{session.session_participants?.length || 0} / {session.course_types?.capacity || 4}</div>
                </div>
              </div>

              <div className="pl-4">
                <h3 className="text-lg font-bold text-white mb-4">Liste des élèves</h3>
                
                {session.session_participants && session.session_participants.length > 0 ? (
                  <div className="space-y-3">
                    {session.session_participants.map(p => (
                      <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-4 hover:border-neutral-700 transition-colors">
                        <div className="mb-4 sm:mb-0">
                          <div className="font-bold text-white text-lg">
                            {p.customers?.first_name} {p.customers?.last_name}
                          </div>
                          <div className="text-sm text-neutral-400 flex items-center mt-1">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {p.customers?.phone || 'Pas de numéro'}
                            
                            {!p.customers?.has_license && (
                              <span className="ml-3 px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-xs">
                                Vérifier Licence
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => markAttendance(p.id, 'attended')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              p.status === 'attended' 
                                ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
                            }`}
                          >
                            Présent
                          </button>
                          <button 
                            onClick={() => markAttendance(p.id, 'no_show')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              p.status === 'no_show' 
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-neutral-500 italic py-2">Aucun élève inscrit pour le moment.</div>
                )}
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="bg-neutral-800 border border-neutral-700 rounded-2xl p-12 text-center shadow-xl">
              <svg className="w-16 h-16 text-neutral-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-white mb-2">Vous êtes tranquille !</h2>
              <p className="text-neutral-400">Vous n'avez aucun cours programmé prochainement.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
