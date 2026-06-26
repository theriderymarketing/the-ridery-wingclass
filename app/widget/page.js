'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Users, MapPin, Info, ArrowLeft } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay, parseISO } from 'date-fns';
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

  const [monthSessions, setMonthSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
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

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    fetchMonthSessions();
  }, [currentMonth, courseIdParam]);

  const fetchMonthSessions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          instructors (first_name, last_name),
          course_types (name, capacity, color),
          session_participants (id, status)
        `)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (courseIdParam) {
        query = query.eq('course_type_id', courseIdParam);
      }

      const { data, error } = await query;
      if (error) throw error;
      setMonthSessions(data || []);
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

  const daySessions = useMemo(() => {
    return monthSessions.filter(s => isSameDay(parseISO(s.start_time), selectedDate));
  }, [monthSessions, selectedDate]);

  const hasAvailableSlots = (date) => {
    const sessions = monthSessions.filter(s => isSameDay(parseISO(s.start_time), date));
    return sessions.some(session => {
      const capacity = session.course_types?.capacity || 4;
      const enrolled = session.session_participants?.filter(p => p.status !== 'cancelled').length || 0;
      return (capacity - enrolled) > 0;
    });
  };

  // -- VUE DU FORMULAIRE DE PAIEMENT --
  if (selectedSession) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col p-4 md:p-8 font-sans items-center justify-center">
        <div className="max-w-3xl w-full bg-white rounded-3xl p-6 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <button 
            onClick={() => setSelectedSession(null)}
            className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 pb-8 md:pb-0 md:pr-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Récapitulatif</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CalendarIcon className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <span className="text-gray-700 font-medium">{format(parseISO(selectedSession.start_time), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex items-start">
                  <Clock className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <span className="text-gray-700 font-medium">
                    {format(parseISO(selectedSession.start_time), 'HH:mm')} - {format(parseISO(selectedSession.end_time), 'HH:mm')}
                  </span>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <span className="text-gray-700 font-medium">{selectedSession.spot_location || 'Marseille'}</span>
                </div>
                <div className="flex items-start">
                  <Info className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <span className="text-gray-700 font-medium">{selectedSession.course_types?.name}</span>
                </div>
              </div>
            </div>

            <div className="md:w-2/3">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Vos informations</h2>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Prénom *</label>
                    <input type="text" required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nom *</label>
                    <input type="text" required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                  <input type="email" required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Téléphone *</label>
                    <input type="tel" required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Date de naissance *</label>
                    <input type="date" required className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all font-medium" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                  </div>
                </div>

                <div className="pt-6">
                  <label className="flex items-center space-x-3 mb-4 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 bg-white" checked={formData.has_license} onChange={e => setFormData({...formData, has_license: e.target.checked})} />
                    <span className="text-sm font-bold text-gray-800">J'ai déjà une licence FFV</span>
                  </label>

                  {!formData.has_license && (
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4 mt-4">
                      <p className="text-sm font-bold text-gray-900">Type de licence souhaitée :</p>
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="radio" name="license_type" value="journee" checked={formData.license_type === 'journee'} onChange={e => setFormData({...formData, license_type: e.target.value})} className="w-4 h-4 text-gray-900 focus:ring-gray-900 border-gray-300" />
                          <span className="text-sm font-bold text-gray-700">Pass Journée</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input type="radio" name="license_type" value="annuelle" checked={formData.license_type === 'annuelle'} onChange={e => setFormData({...formData, license_type: e.target.value})} className="w-4 h-4 text-gray-900 focus:ring-gray-900 border-gray-300" />
                          <span className="text-sm font-bold text-gray-700">Licence Annuelle</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={checkoutLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 px-6 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-8 flex justify-center items-center text-lg">
                  {checkoutLoading ? <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div> : "Confirmer l'événement"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -- VUE CALENDRIER CALENDLY-STYLE --
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 font-sans flex items-center justify-center">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row overflow-hidden">
        
        {/* Colonne Gauche : Infos & Calendrier */}
        <div className="md:w-1/2 p-8 md:p-10 border-b md:border-b-0 md:border-r border-gray-100">
          <div className="flex flex-col items-center md:items-start text-center md:text-left mb-8">
            <div className="w-20 h-20 bg-orange-50 rounded-full border border-orange-100 flex items-center justify-center mb-6">
              <span className="text-xl font-black text-orange-600 tracking-tight">THE RIDERY</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
              Cours de Wingfoil à Marseille avec The Ridery
            </h1>
            <p className="text-gray-500 font-medium leading-relaxed">
              Les cours durent 2h, pense à bien arriver 20 minutes avant pour te préparer et pas perdre une seule seconde sur l'eau!
            </p>
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-medium text-gray-900 capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </h2>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-6 text-center mb-4">
              {['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI'].map(day => (
                <div key={day} className="text-xs font-bold text-gray-400 tracking-wider">
                  {day}
                </div>
              ))}
              
              {calendarDays.map((day, dayIdx) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPast = isBefore(day, startOfDay(new Date()));
                const isSelected = isSameDay(day, selectedDate);
                const hasSlots = hasAvailableSlots(day);
                const isClickable = isCurrentMonth && !isPast && hasSlots;

                return (
                  <div key={day.toString()} className="flex justify-center relative">
                    <button
                      onClick={() => isClickable && setSelectedDate(day)}
                      disabled={!isClickable}
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all relative
                        ${!isCurrentMonth ? 'text-white pointer-events-none' : ''}
                        ${isCurrentMonth && isPast ? 'text-gray-300 line-through' : ''}
                        ${isCurrentMonth && !isPast && !hasSlots ? 'text-gray-400' : ''}
                        ${isCurrentMonth && !isPast && hasSlots && !isSelected ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : ''}
                        ${isSelected ? 'bg-gray-900 text-white' : ''}
                      `}
                    >
                      {format(day, 'd')}
                      
                      {/* Petit point indicateur sous le jour (si cliquable et non sélectionné) */}
                      {isClickable && !isSelected && (
                        <div className="absolute bottom-2 w-1 h-1 bg-blue-600 rounded-full"></div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="text-sm font-medium text-gray-700">Vous ne trouvez pas votre date ? </span>
              <a href="mailto:contact@theridery.com" className="text-sm font-bold text-blue-600 hover:underline">
                Rejoindre la liste d'attente
              </a>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Horaires */}
        <div className="md:w-1/2 bg-gray-50/50 p-8 md:p-10 flex flex-col h-full min-h-[600px]">
          <h3 className="text-lg font-medium text-gray-900 mb-6 text-center md:text-left">
            {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : daySessions.length > 0 ? (
              daySessions.map(session => {
                const capacity = session.course_types?.capacity || 4;
                const enrolled = session.session_participants?.filter(p => p.status !== 'cancelled').length || 0;
                const remaining = capacity - enrolled;
                const isFull = remaining <= 0;

                return (
                  <button
                    key={session.id}
                    disabled={isFull}
                    onClick={() => setSelectedSession(session)}
                    className={`
                      w-full p-4 rounded-xl border flex items-center justify-between transition-all duration-200 group
                      ${isFull 
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed' 
                        : 'border-blue-200 bg-white text-blue-600 hover:border-blue-600 hover:shadow-md'
                      }
                    `}
                  >
                    <span className={`text-lg font-bold ${isFull ? 'text-gray-500' : 'group-hover:text-blue-700'}`}>
                      {format(parseISO(session.start_time), 'HH:mm')}
                    </span>
                    <div className="flex items-center">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                        isFull 
                          ? 'bg-gray-200 text-gray-500' 
                          : 'bg-blue-50 text-blue-700 group-hover:bg-blue-100'
                      }`}>
                        {isFull ? 'COMPLET' : `${remaining} PLACE${remaining > 1 ? 'S' : ''} RESTANTE${remaining > 1 ? 'S' : ''}`}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <CalendarIcon className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-medium text-sm">Aucun créneau disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
