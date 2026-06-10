'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Users } from 'lucide-react';
import { format, addDays, startOfWeek, subWeeks, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '@/lib/store';

export default function AdminCalendar() {
  const { fetchData, isLoaded, sessions, courseTypes, instructors, sessionParticipants } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    instructor_id: '',
    course_type_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '10:00',
    end_time: '12:00',
    spot_location: 'Spot principal'
  });

  useEffect(() => {
    if (!isLoaded) {
      fetchData();
    }
  }, [isLoaded, fetchData]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 11 }).map((_, i) => i + 8); // 8h to 18h

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Chargement du calendrier...</div>;
  }

  // Format the DB sessions for the UI
  const calendarSessions = sessions.map(s => {
    const instructor = instructors.find(i => i.id === s.instructor_id) || {};
    const course = courseTypes.find(c => c.id === s.course_type_id) || {};
    const enrolled = sessionParticipants.filter(p => p.session_id === s.id).length;
    
    return {
      id: s.id,
      instructor_name: `${instructor.first_name || 'Prof'} ${instructor.last_name || ''}`,
      course_name: course.name || 'Cours',
      start_time: new Date(s.start_time),
      end_time: new Date(s.end_time),
      spot_location: s.spot_location || 'Lieu non défini',
      color: course.color || instructor.color || '#3B82F6',
      enrolled: enrolled,
      capacity: course.capacity || 4
    };
  });

  // Calculate current time line position
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const showCurrentTimeLine = currentHour >= 8 && currentHour <= 18;
  const currentTop = (currentHour - 8) * 80;

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const start = new Date(`${newSession.date}T${newSession.start_time}`);
      const end = new Date(`${newSession.date}T${newSession.end_time}`);
      
      await useStore.getState().addSession({
        instructor_id: newSession.instructor_id,
        course_type_id: newSession.course_type_id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        spot_location: newSession.spot_location
      });
      setIsSessionModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-8 py-6 sticky top-0 z-30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Planning des Cours</h1>
          <p className="text-gray-500 mt-1 font-medium">Gérez vos professeurs et vos créneaux en temps réel</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50 shadow-inner">
            <button className="px-5 py-2 text-sm font-bold rounded-lg bg-white shadow-sm text-gray-900 transition-all">Semaine</button>
            <button onClick={() => alert("Vue jour en cours de développement")} className="px-5 py-2 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900 transition-all">Jour</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 text-gray-600 transition-all shadow-sm">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-bold transition-all shadow-sm">
              Aujourd'hui
            </button>
            <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 text-gray-600 transition-all shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button onClick={() => setIsSessionModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5">
            <Plus className="w-5 h-5" />
            Nouveau Créneau
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-200/60 overflow-hidden relative">
          <div className="grid grid-cols-8 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="p-4 flex items-center justify-center border-r border-gray-50">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            {days.map((day, i) => {
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div key={i} className={`p-4 text-center border-r border-gray-50 last:border-0 relative ${isToday ? 'bg-orange-50/10' : ''}`}>
                  {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>}
                  <div className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>
                    {format(day, 'EEEE', { locale: fr })}
                  </div>
                  <div className={`text-2xl mt-1.5 font-extrabold flex items-center justify-center mx-auto w-10 h-10 rounded-full ${isToday ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative" style={{ height: '880px' }}>
            {/* Current Time Indicator */}
            {showCurrentTimeLine && (
              <div className="absolute w-full z-10 flex items-center pointer-events-none" style={{ top: `${currentTop}px` }}>
                <div className="w-[12.5%] flex justify-end pr-2 relative top-[2px]">
                  <span className="text-xs font-bold text-red-500 bg-white px-1">
                    {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 z-10"></div>
                <div className="flex-1 border-t-2 border-red-500/50 border-dashed"></div>
              </div>
            )}

            {hours.map((hour, i) => (
              <div key={i} className="grid grid-cols-8 border-b border-gray-50 absolute w-full" style={{ top: `${i * 80}px`, height: '80px' }}>
                <div className="border-r border-gray-50 flex items-start justify-center pt-2 relative">
                  <span className="text-xs font-bold text-gray-400 bg-white px-2 relative -top-3">{hour}:00</span>
                </div>
                <div className="border-r border-gray-50 col-span-7 flex">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="flex-1 border-r border-gray-50 border-dashed last:border-0 hover:bg-gray-50/30 transition-colors" />
                  ))}
                </div>
              </div>
            ))}

            {calendarSessions.map((session) => {
              const dayDiff = Math.floor((session.start_time - weekStart) / (1000 * 60 * 60 * 24));
              if (dayDiff < 0 || dayDiff > 6) return null; 

              const dayIndex = session.start_time.getDay() === 0 ? 6 : session.start_time.getDay() - 1;
              const startHour = session.start_time.getHours() + session.start_time.getMinutes() / 60;
              const endHour = session.end_time.getHours() + session.end_time.getMinutes() / 60;
              
              const top = (startHour - 8) * 80;
              const height = (endHour - startHour) * 80;
              const left = `calc((100% / 8) + ((100% * 7 / 8) / 7) * ${dayIndex})`;
              const width = `calc((100% * 7 / 8) / 7)`;

              const isFull = session.enrolled >= session.capacity;

              return (
                <div 
                  key={session.id} 
                  className="absolute p-1 transition-all duration-300 hover:scale-[1.03] hover:z-20 cursor-pointer group"
                  style={{ top: `${top}px`, height: `${height}px`, left, width }}
                >
                  <div 
                    className="w-full h-full rounded-2xl p-3 flex flex-col shadow-sm group-hover:shadow-xl transition-shadow overflow-hidden relative border"
                    style={{ 
                      backgroundColor: `${session.color}10`, 
                      borderColor: `${session.color}30`,
                    }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80" style={{ backgroundColor: session.color }}></div>
                    
                    <div className="flex items-start justify-between relative pl-2">
                      <h3 className="font-extrabold text-sm text-gray-900 leading-tight">{session.course_name}</h3>
                      <div className={`text-[10px] font-black px-2 py-1 rounded-lg tracking-wider ${isFull ? 'bg-red-500 text-white shadow-sm shadow-red-500/20' : 'bg-white text-gray-600 shadow-sm border border-gray-100'}`}>
                        {session.enrolled}/{session.capacity}
                      </div>
                    </div>
                    
                    <div className="mt-auto space-y-1 relative pl-2">
                      <div className="flex items-center text-xs text-gray-700 font-bold">
                        <Users className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                        {session.instructor_name}
                      </div>
                      <div className="flex items-center text-[11px] text-gray-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 opacity-40" />
                        {session.spot_location}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isSessionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nouveau créneau</h2>
            <form onSubmit={handleCreateSession} className="space-y-4">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Type de cours</label>
                <select 
                  required
                  value={newSession.course_type_id}
                  onChange={(e) => setNewSession({...newSession, course_type_id: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Sélectionner un type</option>
                  {courseTypes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Professeur</label>
                <select 
                  required
                  value={newSession.instructor_id}
                  onChange={(e) => setNewSession({...newSession, instructor_id: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Sélectionner un professeur</option>
                  {instructors.map(i => (
                    <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required
                    value={newSession.date}
                    onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Spot</label>
                  <input 
                    type="text" 
                    required
                    value={newSession.spot_location}
                    onChange={(e) => setNewSession({...newSession, spot_location: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Heure de début</label>
                  <input 
                    type="time" 
                    required
                    value={newSession.start_time}
                    onChange={(e) => setNewSession({...newSession, start_time: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Heure de fin</label>
                  <input 
                    type="time" 
                    required
                    value={newSession.end_time}
                    onChange={(e) => setNewSession({...newSession, end_time: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsSessionModalOpen(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-orange-500 text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
