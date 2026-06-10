'use client';

import { useState, useEffect } from 'react';
import { supabaseProxy as supabase } from '../../lib/supabase-proxy';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function WidgetPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [customerId, setCustomerId] = useState(null);
  const [bookingStatus, setBookingStatus] = useState({ loading: false, success: false, error: null });

  useEffect(() => {
    // Récupérer le customerId depuis l'URL (passé par l'espace client)
    const params = new URLSearchParams(window.location.search);
    const id = params.get('customerId');
    if (id) setCustomerId(id);

    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        course_types (name, color, duration_minutes, capacity),
        instructors (first_name, last_name),
        session_participants (id)
      `)
      .gte('start_time', today.toISOString())
      .order('start_time', { ascending: true });

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  const handleBooking = async (session) => {
    if (!customerId) {
      setBookingStatus({ loading: false, success: false, error: "Vous devez être connecté à votre Espace Client pour réserver." });
      return;
    }

    setBookingStatus({ loading: true, success: false, error: null });

    try {
      const { error } = await supabase
        .from('session_participants')
        .insert([{
          session_id: session.id,
          customer_id: customerId,
          status: 'booked'
        }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error("Vous êtes déjà inscrit à ce cours !");
        }
        throw error;
      }

      setBookingStatus({ loading: false, success: true, error: null });
      fetchSessions(); // Refresh
      
      // Masquer le message de succès après 3s
      setTimeout(() => setBookingStatus({ loading: false, success: false, error: null }), 3000);
      
    } catch (err) {
      setBookingStatus({ loading: false, success: false, error: err.message || "Erreur lors de la réservation." });
    }
  };

  // Filtrer les sessions pour le jour sélectionné
  const selectedDateString = selectedDate.toDateString();
  const dailySessions = sessions.filter(s => new Date(s.start_time).toDateString() === selectedDateString);

  // Jours avec des cours (pour afficher des points sur le calendrier)
  const daysWithCourses = [...new Set(sessions.map(s => new Date(s.start_time).toDateString()))];

  const nextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const prevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-medium tracking-widest text-sm uppercase">Chargement du planning...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500/30">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
        
        {/* Header Widget */}
        <div className="text-center mb-8 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl -z-10"></div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-2">
            Réserver un Cours
          </h1>
          <p className="text-neutral-400">Wingclass • The Ridery</p>
          
          {!customerId && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              Mode Aperçu : Connectez-vous à l'espace client pour réserver.
            </div>
          )}
        </div>

        {/* Calendar Nav */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-2 flex items-center justify-between mb-8 shadow-2xl">
          <button onClick={prevDay} className="p-3 hover:bg-neutral-800 rounded-2xl transition-all text-neutral-400 hover:text-white">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">
              {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <span className="text-2xl font-bold text-white flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 opacity-50" />
              {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}
            </span>
          </div>

          <button onClick={nextDay} className="p-3 hover:bg-neutral-800 rounded-2xl transition-all text-neutral-400 hover:text-white">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Messages de Statut */}
        {bookingStatus.success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center text-green-400 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="font-medium">Réservation confirmée avec succès ! L'instructeur est prévenu.</p>
          </div>
        )}

        {bookingStatus.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center text-red-400 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <p className="font-medium">{bookingStatus.error}</p>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {dailySessions.length > 0 ? (
            dailySessions.map(session => {
              const capacity = session.course_types?.capacity || 4;
              const enrolled = session.session_participants?.length || 0;
              const isFull = enrolled >= capacity;
              const remaining = capacity - enrolled;

              return (
                <div key={session.id} className="group bg-neutral-900 border border-neutral-800 hover:border-orange-500/50 rounded-3xl p-5 md:p-6 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.15)] relative overflow-hidden">
                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-100%] group-hover:translate-x-[100%] duration-1000"></div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border" style={{ 
                          backgroundColor: `${session.course_types?.color}15` || '#f9731615',
                          borderColor: `${session.course_types?.color}30` || '#f9731630',
                          color: session.course_types?.color || '#f97316'
                        }}>
                          {session.course_types?.name}
                        </span>
                        {isFull ? (
                          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-xs font-bold">COMPLET</span>
                        ) : (
                          <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-bold">{remaining} places restantes</span>
                        )}
                      </div>
                      
                      <div className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                        {new Date(session.start_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})} 
                        <span className="text-neutral-500 text-2xl mx-2">→</span> 
                        {new Date(session.end_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-neutral-400">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1.5 text-neutral-500" />
                          {session.spot_location || 'Lieu non défini'}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1.5 text-neutral-500" />
                          {session.instructors?.first_name} {session.instructors?.last_name}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleBooking(session)}
                      disabled={isFull || bookingStatus.loading}
                      className={`w-full md:w-auto px-8 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all transform active:scale-95 ${
                        isFull 
                          ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5'
                      }`}
                    >
                      {bookingStatus.loading ? 'Patientez...' : isFull ? 'COMPLET' : 'RÉSERVER'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-12 text-center">
              <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="w-8 h-8 text-neutral-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Aucun cours ce jour-là</h3>
              <p className="text-neutral-400">Essayez de regarder les jours suivants ou précédents pour trouver une session disponible.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
