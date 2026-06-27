'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, MapPin, Users, X } from 'lucide-react';
import { format, addDays, startOfWeek, subWeeks, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '@/lib/store';
import { fetchWithAuth } from '@/lib/auth-utils';
import { supabaseProxy as supabase } from '@/lib/supabase-proxy';

export default function AdminCalendar() {
  const { fetchData, isLoaded, sessions, courseTypes, instructors, sessionParticipants, customers } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [userRole, setUserRole] = useState('admin');
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [showEmptySessions, setShowEmptySessions] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [selectedStudentForPopup, setSelectedStudentForPopup] = useState(null);
  const [emailSearchResults, setEmailSearchResults] = useState([]);
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);
  const [emailSearchTerm, setEmailSearchTerm] = useState('');
  const [newSession, setNewSession] = useState({
    instructor_id: '',
    course_type_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '10:00',
    end_time: '12:00',
  });
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    address: '',
    email: '',
    phone: '',
    has_license: false,
    license_paid: false,
    license_type: 'journée'
  });

  useEffect(() => {
    if (!isLoaded) {
      fetchData();
    }
  }, [isLoaded, fetchData]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.user_metadata?.role) setUserRole(session.user.user_metadata.role);
    });
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (emailSearchTerm.length > 2) {
        setIsSearchingEmail(true);
        try {
          const res = await fetchWithAuth(`/api/admin/shopify-customers?q=${encodeURIComponent(emailSearchTerm)}`);
          const data = await res.json();
          if (data && data.nodes && data.nodes.length > 0) {
            setEmailSearchResults(data.nodes);
          } else {
            setEmailSearchResults([]);
          }
        } catch(err) {
          console.error(err);
        } finally {
          setIsSearchingEmail(false);
        }
      } else {
        setEmailSearchResults([]);
        setIsSearchingEmail(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [emailSearchTerm]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 11 }).map((_, i) => i + 8); // 8h to 18h

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-500">Chargement du calendrier...</div>;
  }

  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeInstructors = Array.isArray(instructors) ? instructors : [];
  const safeCourseTypes = Array.isArray(courseTypes) ? courseTypes : [];
  const safeParticipants = Array.isArray(sessionParticipants) ? sessionParticipants : [];
  const safeCustomers = Array.isArray(customers) ? customers : [];

  // Format the DB sessions for the UI
  const calendarSessions = safeSessions.map(s => {
    const instructor = safeInstructors.find(i => i.id === s.instructor_id) || {};
    const course = safeCourseTypes.find(c => c.id === s.course_type_id) || {};
    const enrolled = safeParticipants.filter(p => p.session_id === s.id).length;
    
    return {
      id: s.id,
      instructor_id: s.instructor_id,
      course_type_id: s.course_type_id,
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

      let sessionId = editingSessionId;

      if (editingSessionId) {
        await useStore.getState().updateSession({
          id: editingSessionId,
          instructor_id: newSession.instructor_id,
          course_type_id: newSession.course_type_id,
          start_time: start.toISOString(),
          end_time: end.toISOString()
        });
      } else {
        const created = await useStore.getState().addSession({
          instructor_id: newSession.instructor_id,
          course_type_id: newSession.course_type_id,
          start_time: start.toISOString(),
          end_time: end.toISOString()
        });
        if (created) sessionId = created.id;
      }

      // Add student if the form was filled out
      if (showStudentForm && newStudent.first_name && newStudent.last_name && sessionId) {
        const studentToCreate = { ...newStudent };
        if (!studentToCreate.has_license) {
          studentToCreate.license_type = null;
        } else {
          studentToCreate.license_paid = null;
        }

        let studentId = newStudent.id;
        if (!studentId) {
          const createdStudent = await useStore.getState().addCustomer(studentToCreate);
          if (createdStudent && createdStudent.id) {
            studentId = createdStudent.id;
          }
        }
        
        if (studentId) {
          await useStore.getState().enrollStudent(sessionId, studentId);
        }
      }

      closeSessionModal();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde");
    }
  };

  const openEditSessionModal = (session) => {
    setNewSession({
      instructor_id: session.instructor_id,
      course_type_id: session.course_type_id,
      date: new Date(session.start_time).toISOString().split('T')[0],
      start_time: new Date(session.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      end_time: new Date(session.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
    setEditingSessionId(session.id);
    setShowStudentForm(false);
    setNewStudent({
      first_name: '', last_name: '', birth_date: '', address: '', email: '', phone: '', has_license: false, license_paid: false, license_type: 'journée'
    });
    setIsSessionModalOpen(true);
  };

  const handleDeleteSession = async () => {
    if (confirm('Voulez-vous vraiment supprimer ce créneau ?')) {
      await useStore.getState().deleteSession(editingSessionId);
      closeSessionModal();
    }
  };

  const closeSessionModal = () => {
    setIsSessionModalOpen(false);
    setEditingSessionId(null);
    setShowStudentForm(false);
    setNewStudent({
      first_name: '', last_name: '', birth_date: '', address: '', email: '', phone: '', has_license: false, license_paid: false, license_type: 'journée'
    });
    setNewSession({
      instructor_id: '',
      course_type_id: '',
      date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      end_time: '11:00'
    });
  };
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col relative">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 md:px-8 py-4 md:py-6 sticky top-0 z-30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Planning des Cours</h1>
          <p className="text-gray-500 mt-0.5 font-medium text-sm hidden md:block">Gérez vos professeurs et vos créneaux en temps réel</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 md:gap-3 bg-white px-2 md:px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
              <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 md:p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <div className="flex flex-col items-center min-w-[100px] md:min-w-[140px]">
                <span className="text-xs md:text-sm font-bold text-gray-900 capitalize">
                  {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </span>
                <input
                  type="date"
                  value={format(currentDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    if(e.target.value) setCurrentDate(new Date(e.target.value));
                  }}
                  className="text-xs text-gray-500 bg-transparent border-none focus:ring-0 p-0 cursor-pointer outline-none w-auto text-center"
                />
              </div>
              <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 md:p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 md:px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 text-gray-700 font-semibold text-xs md:text-sm transition-all shadow-sm whitespace-nowrap">
              Aujourd'hui
            </button>
          </div>
          {userRole === 'admin' && (
            <button onClick={() => setIsSessionModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 whitespace-nowrap text-sm md:text-base">
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Nouveau </span>Créneau
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-200/60 overflow-hidden relative">
          <div className="grid grid-cols-8 border-b border-gray-100 bg-white sticky top-0 z-20">
            <div className="p-1 md:p-4 flex items-center justify-center border-r border-gray-50">
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              </div>
            </div>
            {days.map((day, i) => {
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              return (
                <div key={i} className={`p-1 md:p-4 text-center border-r border-gray-50 last:border-0 relative ${isToday ? 'bg-orange-50/10' : ''}`}>
                  {isToday && <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>}
                  <div className={`text-xs font-bold uppercase tracking-widest ${isToday ? 'text-orange-500' : 'text-gray-400'}`}>
                    <span className="hidden md:inline">{format(day, 'EEEE', { locale: fr })}</span>
                    <span className="md:hidden">{format(day, 'EEEEE', { locale: fr })}</span>
                  </div>
                  <div className={`text-base md:text-2xl mt-1 md:mt-1.5 font-extrabold flex items-center justify-center mx-auto w-7 h-7 md:w-10 md:h-10 rounded-full ${isToday ? 'bg-orange-500 text-white shadow-md shadow-orange-500/40' : 'text-gray-900'}`}>
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

            {calendarSessions.filter(session => session.enrolled > 0).map((session) => {
              const dayDiff = Math.floor((session.start_time - weekStart) / (1000 * 60 * 60 * 24));
              if (dayDiff < 0 || dayDiff > 6) return null; 

              const dayIndex = session.start_time.getDay() === 0 ? 6 : session.start_time.getDay() - 1;
              const startHour = session.start_time.getHours() + session.start_time.getMinutes() / 60;
              const endHour = session.end_time.getHours() + session.end_time.getMinutes() / 60;
              
              const top = (startHour - 8) * 80;
              const height = (endHour - startHour) * 80;
              const isFull = session.enrolled >= session.capacity;

              // Gestion des chevauchements (en ne comptant que les visibles)
              const visibleSessions = calendarSessions.filter(s => s.enrolled > 0);
              const sameDaySessions = visibleSessions.filter(s => 
                s.start_time.getDay() === session.start_time.getDay() &&
                s.start_time.getFullYear() === session.start_time.getFullYear() &&
                s.start_time.getMonth() === session.start_time.getMonth()
              );
              const overlapping = sameDaySessions.filter(s => 
                (s.start_time < session.end_time && s.end_time > session.start_time)
              ).sort((a, b) => a.start_time - b.start_time);
              
              const colIndex = overlapping.findIndex(s => s.id === session.id);
              const numCols = Math.max(1, overlapping.length);

              const left = `calc((100% / 8) + ((100% * 7 / 8) / 7) * ${dayIndex} + (((100% * 7 / 8) / 7) / ${numCols}) * ${colIndex})`;
              const width = `calc(((100% * 7 / 8) / 7) / ${numCols})`;

              return (
                <div 
                  key={session.id} 
                  onClick={() => openEditSessionModal(session)}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingSessionId ? 'Modifier le créneau' : 'Nouveau créneau'}</h2>
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
                  {safeCourseTypes.map(c => (
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
                  {safeInstructors.map(i => (
                    <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Début</label>
                  <input 
                    type="time" 
                    required
                    value={newSession.start_time}
                    onChange={(e) => setNewSession({...newSession, start_time: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Fin</label>
                  <input 
                    type="time" 
                    required
                    value={newSession.end_time}
                    onChange={(e) => setNewSession({...newSession, end_time: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">Infos Client (Optionnel)</h3>
                  <button 
                    type="button" 
                    onClick={() => setShowStudentForm(!showStudentForm)}
                    className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full hover:bg-orange-100 transition-colors"
                  >
                    {showStudentForm ? 'Masquer' : '+ Ajouter un élève'}
                  </button>
                </div>

                {showStudentForm && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200 overflow-y-auto max-h-[40vh]">
                    <div className="mb-4 relative">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                      <input 
                        type="email" 
                        required={showStudentForm}
                        value={newStudent.email} 
                        onChange={(e) => {
                          const email = e.target.value;
                          setNewStudent(prev => ({ ...prev, email }));
                          setEmailSearchTerm(email);
                          
                          // Chercher d'abord dans la base locale
                          const localCustomer = safeCustomers.find(c => c.email?.toLowerCase() === email.toLowerCase());
                          if (localCustomer) {
                            setNewStudent(prev => ({
                              ...prev,
                              email,
                              id: localCustomer.id,
                              first_name: localCustomer.first_name || prev.first_name,
                              last_name: localCustomer.last_name || prev.last_name,
                              phone: localCustomer.phone || prev.phone,
                              address: localCustomer.address || prev.address,
                              birth_date: localCustomer.birth_date || prev.birth_date,
                              has_license: localCustomer.has_license || false,
                              license_paid: localCustomer.license_paid || false,
                              license_type: localCustomer.license_type || 'journée'
                            }));
                            setEmailSearchResults([]);
                            setEmailSearchTerm(''); // Clear search term so it doesn't fetch
                          }
                        }} 
                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" 
                      />
                      
                      {isSearchingEmail && <div className="absolute right-3 top-8 text-xs text-gray-400">Recherche...</div>}

                      {emailSearchResults.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto mt-1">
                          {emailSearchResults.map(c => (
                            <li 
                              key={c.id} 
                              className="px-4 py-2 hover:bg-orange-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                              onClick={() => {
                                setNewStudent(prev => ({
                                  ...prev,
                                  email: c.email,
                                  first_name: prev.first_name || c.firstName || '',
                                  last_name: prev.last_name || c.lastName || '',
                                  phone: prev.phone || c.phone || '',
                                  address: prev.address || (c.defaultAddress ? `${c.defaultAddress.address1 || ''} ${c.defaultAddress.city || ''}`.trim() : '')
                                }));
                                setEmailSearchResults([]);
                              }}
                            >
                              <div className="font-bold text-gray-900">{c.email}</div>
                              <div className="text-gray-500 text-xs">{c.firstName} {c.lastName}</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Prénom *</label>
                        <input type="text" required={showStudentForm} value={newStudent.first_name} onChange={(e) => setNewStudent({...newStudent, first_name: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Nom *</label>
                        <input type="text" required={showStudentForm} value={newStudent.last_name} onChange={(e) => setNewStudent({...newStudent, last_name: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Date de naissance</label>
                        <input type="date" value={newStudent.birth_date} onChange={(e) => setNewStudent({...newStudent, birth_date: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone</label>
                        <input type="tel" value={newStudent.phone} onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse postale</label>
                      <input type="text" value={newStudent.address} onChange={(e) => setNewStudent({...newStudent, address: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                    </div>

                    <div className="pt-2 border-t border-gray-200">
                      <label className="flex items-center space-x-2 cursor-pointer mb-3">
                        <input type="checkbox" checked={newStudent.has_license} onChange={(e) => setNewStudent({...newStudent, has_license: e.target.checked})} className="rounded text-orange-500 focus:ring-orange-500" />
                        <span className="text-sm font-semibold text-gray-700">A déjà une licence FFV</span>
                      </label>

                      {!newStudent.has_license && (
                        <div className="pl-6 space-y-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={newStudent.license_paid} onChange={(e) => setNewStudent({...newStudent, license_paid: e.target.checked})} className="rounded text-orange-500 focus:ring-orange-500" />
                            <span className="text-xs text-gray-600 font-medium">Licence payée ?</span>
                          </label>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Type de licence</label>
                            <select value={newStudent.license_type} onChange={(e) => setNewStudent({...newStudent, license_type: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                              <option value="journée">Journée</option>
                              <option value="annuel">Annuel</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-gray-100">
                {editingSessionId && (
                  <button 
                    type="button" 
                    onClick={handleDeleteSession}
                    className="bg-red-50 text-red-600 font-bold py-3 px-4 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Supprimer
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={closeSessionModal}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  {editingSessionId ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>

            {editingSessionId && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Élèves inscrits</h3>
                {(!safeParticipants || safeParticipants.filter(p => p.session_id === editingSessionId).length === 0) ? (
                  <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl text-center">
                    Aucun élève inscrit pour le moment.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {safeParticipants.filter(p => p.session_id === editingSessionId).map(p => {
                      const customer = safeCustomers.find(c => c.id === p.customer_id);
                      if (!customer) return null;
                      return (
                        <div 
                          key={p.id} 
                          className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center group cursor-pointer hover:bg-orange-50 transition-colors"
                          onClick={() => setSelectedStudentForPopup(customer)}
                        >
                          <div>
                            <div className="font-bold text-gray-900 text-sm">{customer.first_name} {customer.last_name}</div>
                            <div className="text-xs text-gray-500">{customer.email} • {customer.phone || 'Pas de tel'}</div>
                          </div>
                          <button 
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (confirm(`Retirer ${customer.first_name} de ce créneau ?`)) {
                                await useStore.getState().removeStudent(p.id);
                              }
                            }}
                            className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Retirer
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POPUP ELEVE */}
      {selectedStudentForPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">
                Fiche Élève
              </h3>
              <button onClick={() => setSelectedStudentForPopup(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Nom Complet</div>
                <div className="font-medium text-gray-900 text-lg">{selectedStudentForPopup.first_name} {selectedStudentForPopup.last_name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Email</div>
                <div className="font-medium text-gray-900">{selectedStudentForPopup.email}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Téléphone</div>
                <div className="font-medium text-gray-900">{selectedStudentForPopup.phone || 'Non renseigné'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Adresse</div>
                <div className="font-medium text-gray-900">{selectedStudentForPopup.address || 'Non renseignée'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Date de Naissance</div>
                <div className="font-medium text-gray-900">{selectedStudentForPopup.birth_date ? format(new Date(selectedStudentForPopup.birth_date), 'dd/MM/yyyy') : 'Non renseignée'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Licence FFV</div>
                <div className="font-medium text-gray-900 mt-1">
                  {selectedStudentForPopup.has_license ? (
                    <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">
                      A déjà une licence
                    </span>
                  ) : (
                    <span className="text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">
                      Prise au club : {selectedStudentForPopup.license_type || 'journée'} ({selectedStudentForPopup.license_paid ? 'Payée' : 'À payer'})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
