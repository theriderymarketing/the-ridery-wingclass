'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Users, MapPin, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function WidgetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">Chargement...</div>}>
      <WidgetContent />
    </Suspense>
  );
}

function WidgetContent() {
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('courseId');

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  
  // Checkout Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    birth_date: '',
    has_license: false,
    license_type: 'journee'
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, [selectedDate, courseIdParam]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      let query = supabase
        .from('sessions')
        .select(`
          *,
          instructors (first_name, last_name),
          course_types (name, capacity, color),
          session_participants (id, status)
        `)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time', { ascending: true });

      if (courseIdParam) {
        query = query.eq('course_type_id', courseIdParam);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/widget/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selectedSession.id,
          customer: formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la réservation.");
      }

      if (data.checkoutUrl) {
        window.top.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err.message);
      setCheckoutLoading(false);
    }
  };

  if (selectedSession) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col p-4 font-sans">
        <div className="max-w-2xl mx-auto w-full bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50">
          <button 
            onClick={() => setSelectedSession(null)}
            className="text-sm font-bold text-gray-500 hover:text-gray-900 flex items-center mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Retour au planning
          </button>
          
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6">Vos informations</h2>

          <div className="bg-gray-50 p-4 md:p-5 rounded-2xl mb-6 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center text-sm font-bold text-gray-900 mb-1">
                <CalendarIcon className="w-4 h-4 mr-2 text-orange-500" />
                {format(parseISO(selectedSession.start_time), 'EEEE d MMMM yyyy', { locale: fr })}
              </div>
              <div className="flex items-center text-sm font-bold text-gray-500">
                <Clock className="w-4 h-4 mr-2 text-orange-500" />
                {format(parseISO(selectedSession.start_time), 'HH:mm')} - {format(parseISO(selectedSession.end_time), 'HH:mm')} ({selectedSession.course_types?.name})
              </div>
            </div>
            <div className="text-left md:text-right">
               <span className="inline-block bg-white px-3 py-1.5 rounded-lg border border-gray-200 font-bold text-orange-600 text-sm shadow-sm">
                  {selectedSession.course_types?.capacity - (selectedSession.session_participants?.filter(p => p.status !== 'cancelled').length || 0)} places dispo
               </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-start">
              <Info className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleCheckout} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Prénom *</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom *</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
              <input type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone *</label>
                <input type="tel" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Date de naissance *</label>
                <input type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <label className="flex items-center space-x-3 mb-4 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 bg-white" checked={formData.has_license} onChange={e => setFormData({...formData, has_license: e.target.checked})} />
                <span className="text-sm font-bold text-gray-800">J'ai déjà une licence FFV</span>
              </label>

              {!formData.has_license && (
                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/50 space-y-3">
                  <p className="text-sm font-bold text-orange-900">Type de licence souhaitée :</p>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="license_type" value="journee" checked={formData.license_type === 'journee'} onChange={e => setFormData({...formData, license_type: e.target.value})} className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300" />
                      <span className="text-sm font-bold text-orange-800">Pass Journée</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="license_type" value="annuelle" checked={formData.license_type === 'annuelle'} onChange={e => setFormData({...formData, license_type: e.target.value})} className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300" />
                      <span className="text-sm font-bold text-orange-800">Licence Annuelle</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={checkoutLoading} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-extrabold py-4 px-6 rounded-xl transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mt-6 flex justify-center items-center text-base md:text-lg">
              {checkoutLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div> : "Aller au paiement"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-gray-900 font-sans p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-xl mx-auto">
        
        {/* Calendar Nav */}
        <div className="bg-white border border-gray-200 rounded-3xl p-2 flex items-center justify-between mb-6 shadow-xl shadow-gray-200/40">
          <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all text-gray-500 hover:text-gray-900">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-orange-500 mb-0.5">
              {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <span className="text-lg md:text-xl font-extrabold text-gray-900 flex items-center capitalize">
              {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' })}
            </span>
          </div>

          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all text-gray-500 hover:text-gray-900">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-orange-500 border-r-4 border-transparent"></div>
            </div>
          ) : sessions.length > 0 ? (
            sessions.map(session => {
              const capacity = session.course_types?.capacity || 4;
              const enrolled = session.session_participants?.filter(p => p.status !== 'cancelled').length || 0;
              const isFull = enrolled >= capacity;
              const remaining = capacity - enrolled;

              return (
                <div key={session.id} className="group bg-white border border-gray-200 hover:border-orange-200 rounded-3xl p-5 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-lg text-[10px] md:text-xs font-extrabold uppercase tracking-widest border" style={{ 
                          backgroundColor: `${session.course_types?.color}10` || '#f9731610',
                          borderColor: `${session.course_types?.color}30` || '#f9731630',
                          color: session.course_types?.color || '#f97316'
                        }}>
                          {session.course_types?.name}
                        </span>
                        {isFull ? (
                          <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[10px] md:text-xs font-extrabold">COMPLET</span>
                        ) : (
                          <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-lg text-[10px] md:text-xs font-extrabold">{remaining} places dispo</span>
                        )}
                      </div>
                      
                      <div className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight flex items-center">
                        {new Date(session.start_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})} 
                        <span className="text-gray-300 text-xl mx-2">→</span> 
                        {new Date(session.end_time).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-500">
                        <span className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          {session.spot_location || 'Lieu non défini'}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1 text-gray-400" />
                          {session.instructors?.first_name} {session.instructors?.last_name}
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedSession(session)}
                      disabled={isFull}
                      className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all transform active:scale-95 ${
                        isFull 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                          : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5'
                      }`}
                    >
                      {isFull ? 'COMPLET' : 'RÉSERVER'}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                <CalendarIcon className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun créneau</h3>
              <p className="text-sm font-medium text-gray-500">Pas de cours programmé pour cette date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
