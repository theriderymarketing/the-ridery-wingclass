'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Users } from 'lucide-react';
import { format, addDays, startOfWeek, subWeeks, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '@/lib/store';

export default function AdminCalendar() {
  const { fetchData, isLoaded, sessions, courseTypes, instructors, sessionParticipants } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      <header className="bg-white border-b border-gray-200 px-8 py-6 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Planning des Cours</h1>
          <p className="text-gray-500 mt-1">Gérez vos professeurs et vos créneaux en temps réel</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button className="px-4 py-2 text-sm font-medium rounded-lg bg-white shadow-sm text-gray-900">Semaine</button>
            <button className="px-4 py-2 text-sm font-medium rounded-lg text-gray-500 hover:text-gray-900">Jour</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-medium transition-colors">
              Aujourd'hui
            </button>
            <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md shadow-orange-500/20">
            <Plus className="w-5 h-5" />
            Nouveau Créneau
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50/50">
            <div className="p-4 flex items-center justify-center border-r border-gray-200">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
            </div>
            {days.map((day, i) => {
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div key={i} className={`p-4 text-center border-r border-gray-200 last:border-0 ${isToday ? 'bg-orange-50/50' : ''}`}>
                  <div className={`text-sm font-medium ${isToday ? 'text-orange-600' : 'text-gray-500'}`}>
                    {format(day, 'EEEE', { locale: fr })}
                  </div>
                  <div className={`text-2xl mt-1 font-bold ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative" style={{ height: '800px' }}>
            {hours.map((hour, i) => (
              <div key={i} className="grid grid-cols-8 border-b border-gray-100 absolute w-full" style={{ top: `${i * 80}px`, height: '80px' }}>
                <div className="border-r border-gray-200 flex items-start justify-center pt-2">
                  <span className="text-xs font-medium text-gray-400">{hour}:00</span>
                </div>
                <div className="border-r border-gray-100 col-span-7 flex">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="flex-1 border-r border-gray-100 last:border-0" />
                  ))}
                </div>
              </div>
            ))}

            {calendarSessions.map((session) => {
              // Filtrer si ce n'est pas cette semaine
              const dayDiff = Math.floor((session.start_time - weekStart) / (1000 * 60 * 60 * 24));
              if (dayDiff < 0 || dayDiff > 6) return null; // Seulement les cours de la semaine visible

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
                  className="absolute p-1 transition-transform hover:scale-[1.02] hover:z-20 cursor-pointer"
                  style={{ top: `${top}px`, height: `${height}px`, left, width }}
                >
                  <div 
                    className="w-full h-full rounded-xl p-3 flex flex-col shadow-sm border border-black/5"
                    style={{ backgroundColor: `${session.color}15`, borderLeft: `4px solid ${session.color}` }}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-sm text-gray-900 leading-tight">{session.course_name}</h3>
                      <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {session.enrolled}/{session.capacity}
                      </div>
                    </div>
                    
                    <div className="mt-auto space-y-1">
                      <div className="flex items-center text-xs text-gray-600 font-medium">
                        <Users className="w-3.5 h-3.5 mr-1" />
                        {session.instructor_name}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
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
    </div>
  );
}
