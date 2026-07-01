'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Mail, Key, User, Trash2, CalendarOff, Save, X, Edit2, List, Settings, Calendar, ExternalLink } from 'lucide-react';
import { format, addDays, eachDayOfInterval, getDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabaseProxy as supabase } from '../../../lib/supabase-proxy';
import { useStore } from '../../../lib/store';

export default function SettingsPage() {
  const { courseTypes, addCourseType, updateCourseType, deleteCourseType, settings, updateSettings, fetchData } = useStore();
  const [activeTab, setActiveTab] = useState('courses');
  
  // Auth state
  const [usersByRole, setUsersByRole] = useState({ admin: [], instructor: [], partner: [] });
  const [loading, setLoading] = useState(true);
  const [inviteEmails, setInviteEmails] = useState({ admin: '', instructor: '', partner: '' });
  const [invitePasswords, setInvitePasswords] = useState({ admin: '', instructor: '', partner: '' });
  const [inviting, setInviting] = useState({ admin: false, instructor: false, partner: false });

  // Course Types state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({ name: '', duration_minutes: 120, capacity: 4, color: '#10B981', days_of_week: [] });

  const parseDays = (course) => {
    try { return JSON.parse(course.description || '{}').days || []; } catch { return []; }
  };

  const [genModal, setGenModal] = useState(null);
  const [genForm, setGenForm] = useState({ start_date: '', end_date: '', avail_start: '09:00', avail_end: '19:00', duration_min: 120, days: [] });
  const [genPreview, setGenPreview] = useState([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState('');

  const jsToInternal = (jsDay) => jsDay === 0 ? 6 : jsDay - 1;

  const computeSlots = (availStart, availEnd, durationMin) => {
    const [sh, sm] = availStart.split(':').map(Number);
    const [eh, em] = availEnd.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const slots = [];
    for (let t = startMins; t + durationMin <= endMins; t += durationMin) {
      const hh = String(Math.floor(t / 60)).padStart(2, '0');
      const mm = String(t % 60).padStart(2, '0');
      const eh2 = Math.floor((t + durationMin) / 60);
      const em2 = (t + durationMin) % 60;
      slots.push({ start: `${hh}:${mm}`, end: `${String(eh2).padStart(2,'0')}:${String(em2).padStart(2,'0')}` });
    }
    return slots;
  };

  const computeGenPreview = (form) => {
    if (!form.start_date || !form.end_date || form.days.length === 0) return [];
    const days = eachDayOfInterval({ start: parseISO(form.start_date), end: parseISO(form.end_date) })
      .filter(d => form.days.includes(jsToInternal(getDay(d))));
    const slots = computeSlots(form.avail_start, form.avail_end, form.duration_min);
    return days.flatMap(day => slots.map(slot => ({ day, ...slot })));
  };

  const updateGenForm = (patch) => {
    setGenForm(prev => {
      const next = { ...prev, ...patch };
      setGenPreview(computeGenPreview(next));
      return next;
    });
  };

  const openGenModal = (course) => {
    const days = parseDays(course);
    const form = {
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(addDays(new Date(), 60), 'yyyy-MM-dd'),
      avail_start: '09:00',
      avail_end: '19:00',
      duration_min: 120,
      days,
    };
    setGenForm(form);
    setGenPreview(computeGenPreview(form));
    setGenError('');
    setGenModal({ course });
  };

  const handleGenerate = async () => {
    if (!genModal || genPreview.length === 0) return;
    setGenLoading(true);
    setGenError('');
    try {
      const sessions = genPreview.map(({ day, start, end }) => ({
        course_type_id: genModal.course.id,
        instructor_id: null,
        start_time: new Date(`${format(day, 'yyyy-MM-dd')}T${start}:00`).toISOString(),
        end_time: new Date(`${format(day, 'yyyy-MM-dd')}T${end}:00`).toISOString(),
      }));
      const { error: insertErr } = await supabase.from('sessions').insert(sessions);
      if (insertErr) throw new Error(insertErr.message);
      setGenModal(null);
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenLoading(false);
    }
  };

  // Exceptions state
  const [exceptions, setExceptions] = useState([]);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({ date: '', course_type_id: 'all', reason: '', time_type: 'full_day', start_time: '08:00', end_time: '12:00' });

  useEffect(() => {
    fetchAdmins();
    if (!courseTypes.length) fetchData();
  }, []);

  useEffect(() => {
    if (settings && settings.closedDates) {
      setExceptions(settings.closedDates);
    }
  }, [settings]);

  const getAuthToken = async () => {
    // Force refresh to handle expired tokens in iframe contexts
    const { data: { session: fresh } } = await supabase.auth.refreshSession();
    if (fresh?.access_token) return fresh.access_token;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const fetchAdmins = async () => {
    try {
      const token = await getAuthToken();
      if (!token) { setLoading(false); return; }
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const all = await res.json();
      const list = Array.isArray(all) ? all : [];
      setUsersByRole({
        admin: list.filter(u => !u.role || u.role === 'admin'),
        instructor: list.filter(u => u.role === 'instructor'),
        partner: list.filter(u => u.role === 'partner'),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Supprimer ce compte ?')) return;
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Session expirée, reconnectez-vous');
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await fetchAdmins();
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleInvite = async (role) => {
    const email = inviteEmails[role];
    const password = invitePasswords[role];
    if (!email || !password) return;
    setInviting(prev => ({ ...prev, [role]: true }));
    try {
      const token = await getAuthToken();
      if (!token) throw new Error('Session expirée, reconnectez-vous sur the-ridery-wingclass.vercel.app/login');
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email, password, role })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setInviteEmails(prev => ({ ...prev, [role]: '' }));
      setInvitePasswords(prev => ({ ...prev, [role]: '' }));
      await fetchAdmins();
      alert(`Compte créé pour ${email}`);
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setInviting(prev => ({ ...prev, [role]: false }));
    }
  };

  const saveCourse = async () => {
    const { days_of_week, ...rest } = courseForm;
    const description = days_of_week && days_of_week.length > 0 ? JSON.stringify({ days: days_of_week }) : null;
    const courseData = { ...rest, description };
    if (editingCourse) {
      await updateCourseType({ ...courseData, id: editingCourse.id });
    } else {
      await addCourseType(courseData);
    }
    setShowCourseModal(false);
  };

  const saveException = async () => {
    const newExceptions = [...exceptions, exceptionForm];
    await updateSettings({ ...settings, closedDates: newExceptions });
    setShowExceptionModal(false);
  };

  const deleteException = async (index) => {
    const newExceptions = exceptions.filter((_, i) => i !== index);
    await updateSettings({ ...settings, closedDates: newExceptions });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres des Cours</h1>
        <p className="text-gray-500">Gérez le catalogue de cours, les fermetures exceptionnelles et les accès.</p>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8 w-full overflow-x-auto">
        <button 
          onClick={() => setActiveTab('courses')}
          className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0 ${activeTab === 'courses' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <List className="w-4 h-4 mr-2" />
          Catalogue des Cours
        </button>
        <button 
          onClick={() => setActiveTab('exceptions')}
          className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'exceptions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <CalendarOff className="w-4 h-4 mr-2" />
          Fermetures Exceptionnelles
        </button>
        <button 
          onClick={() => setActiveTab('access')}
          className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'access' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Shield className="w-4 h-4 mr-2" />
          Accès & Comptes
        </button>
      </div>

      {activeTab === 'courses' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Catalogue des cours</h2>
            <button onClick={() => { setEditingCourse(null); setCourseForm({ name: '', duration_minutes: 120, capacity: 4, color: '#10B981', days_of_week: [] }); setShowCourseModal(true); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-black transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau type de cours
            </button>
          </div>
          
          <div className="space-y-3">
            {courseTypes.filter(c => c.name !== '__SETTINGS__').map(course => (
              <div key={course.id} className="flex items-center justify-between p-4 border rounded-xl bg-gray-50 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: course.color }}></div>
                  <div>
                    <p className="font-bold text-gray-900">{course.name}</p>
                    <p className="text-sm text-gray-500">{course.duration_minutes} min • Jusqu'à {course.capacity} élèves</p>
                    {parseDays(course).length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {['L','M','Me','J','V','S','D'].map((d, i) => parseDays(course).includes(i) ? (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-900 text-white font-bold">{d}</span>
                        ) : null)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.open(`https://the-ridery-wingclass.vercel.app/widget/${course.id}`, '_blank')} className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-200 rounded-lg transition-colors flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Vue client
                  </button>
                  <button title="Générer des sessions" onClick={() => openGenModal(course)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"><Calendar className="w-4 h-4" /></button>
                  <button onClick={() => { setEditingCourse(course); setCourseForm({ ...course, days_of_week: parseDays(course) }); setShowCourseModal(true); }} className="p-2 text-gray-400 hover:text-orange-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => deleteCourseType(course.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {courseTypes.filter(c => c.name !== '__SETTINGS__').length === 0 && (
              <p className="text-gray-500 text-center py-6">Aucun cours dans le catalogue.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'exceptions' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Fermetures côté client</h2>
              <p className="text-sm text-gray-500">Ajoutez des dates pour bloquer les réservations sur le widget.</p>
            </div>
            <button onClick={() => { setExceptionForm({ date: '', course_type_id: 'all', reason: '', time_type: 'full_day', start_time: '08:00', end_time: '12:00' }); setShowExceptionModal(true); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-black transition-colors">
              <CalendarOff className="w-4 h-4 mr-2" />
              Bloquer une date
            </button>
          </div>
          
          <div className="space-y-3">
            {exceptions.map((exc, index) => {
              const targetCourse = exc.course_type_id === 'all' ? 'Tous les cours' : courseTypes.find(c => c.id === exc.course_type_id)?.name || 'Cours inconnu';
              return (
                <div key={index} className="flex items-center justify-between p-4 border border-red-100 rounded-xl bg-red-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><CalendarOff className="w-5 h-5" /></div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {exc.date.split('-').reverse().join('/')} 
                        {exc.time_type === 'specific' ? ` (${exc.start_time} - ${exc.end_time})` : ' (Toute la journée)'} 
                        {' - '} {targetCourse}
                      </p>
                      <p className="text-sm text-red-600">{exc.reason || 'Fermeture exceptionnelle'}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteException(index)} className="p-2 text-red-400 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            {exceptions.length === 0 && (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500">Aucune fermeture programmée. Le widget est ouvert.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="space-y-6">
          {[
            { role: 'admin', label: 'Administrateurs', badge: 'Admin', badgeColor: 'bg-orange-100 text-orange-700', description: 'Accès complet au dashboard.' },
            { role: 'instructor', label: 'Professeurs', badge: 'Prof', badgeColor: 'bg-blue-100 text-blue-700', description: 'Accès au Planning Général uniquement.' },
            { role: 'partner', label: 'Partenaires', badge: 'Partenaire', badgeColor: 'bg-green-100 text-green-700', description: 'Accès au Tableau des Licences uniquement.' },
          ].map(({ role, label, badge, badgeColor, description }) => (
            <div key={role} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center mb-4">
                <Shield className="w-5 h-5 text-orange-500 mr-2" />
                <h2 className="text-lg font-bold text-gray-900">{label}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-3">{description}</p>
                  <div className="space-y-2">
                    {usersByRole[role].map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-3">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{u.email || u.first_name}</p>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {usersByRole[role].length === 0 && (
                      <p className="text-sm text-gray-400 py-2">Aucun compte.</p>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-max">
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">Créer un compte {label.slice(0, -1).toLowerCase()}</h3>
                  <input
                    type="email"
                    placeholder="adresse@email.com"
                    value={inviteEmails[role]}
                    onChange={e => setInviteEmails(prev => ({ ...prev, [role]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                  />
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={invitePasswords[role]}
                    onChange={e => setInvitePasswords(prev => ({ ...prev, [role]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                  />
                  <button
                    onClick={() => handleInvite(role)}
                    disabled={inviting[role] || !inviteEmails[role] || !invitePasswords[role]}
                    className="w-full bg-gray-900 text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {inviting[role] ? 'Création...' : 'Créer le compte'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">{editingCourse ? 'Modifier le cours' : 'Nouveau type de cours'}</h3>
              <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Nom du cours</label><input type="text" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} className="w-full p-2 border rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Durée (min)</label><input type="number" value={courseForm.duration_minutes} onChange={e => setCourseForm({...courseForm, duration_minutes: Number(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Places max</label><input type="number" value={courseForm.capacity} onChange={e => setCourseForm({...courseForm, capacity: Number(e.target.value)})} className="w-full p-2 border rounded-lg" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Couleur</label><input type="color" value={courseForm.color} onChange={e => setCourseForm({...courseForm, color: e.target.value})} className="w-full h-10 p-1 border rounded-lg cursor-pointer" /></div>
              <div>
                <label className="block text-sm font-medium mb-2">Jours du cours</label>
                <div className="flex gap-1">
                  {['L','M','Me','J','V','S','D'].map((label, i) => {
                    const active = (courseForm.days_of_week || []).includes(i);
                    return (
                      <button
                        key={i} type="button"
                        onClick={() => {
                          const days = courseForm.days_of_week || [];
                          setCourseForm({ ...courseForm, days_of_week: active ? days.filter(d => d !== i) : [...days, i] });
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-500'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setShowCourseModal(false)} className="px-4 py-2 text-gray-600 font-medium">Annuler</button>
              <button onClick={saveCourse} className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Exception Modal */}
      {showExceptionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Bloquer une date</h3>
              <button onClick={() => setShowExceptionModal(false)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date à bloquer</label>
                <input type="date" value={exceptionForm.date} onChange={e => setExceptionForm({...exceptionForm, date: e.target.value})} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quel cours fermer ?</label>
                <select value={exceptionForm.course_type_id} onChange={e => setExceptionForm({...exceptionForm, course_type_id: e.target.value})} className="w-full p-2 border rounded-lg mb-4">
                  <option value="all">Tous les cours</option>
                  {courseTypes.filter(c => c.name !== '__SETTINGS__').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Période</label>
                <select value={exceptionForm.time_type} onChange={e => setExceptionForm({...exceptionForm, time_type: e.target.value})} className="w-full p-2 border rounded-lg mb-4">
                  <option value="full_day">Journée complète</option>
                  <option value="specific">Créneau horaire spécifique</option>
                </select>
              </div>

              {exceptionForm.time_type === 'specific' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">De</label>
                    <input type="time" value={exceptionForm.start_time} onChange={e => setExceptionForm({...exceptionForm, start_time: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">À</label>
                    <input type="time" value={exceptionForm.end_time} onChange={e => setExceptionForm({...exceptionForm, end_time: e.target.value})} className="w-full p-2 border rounded-lg" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Raison (optionnel)</label>
                <input type="text" placeholder="Ex: Congés annuels, Tempête..." value={exceptionForm.reason} onChange={e => setExceptionForm({...exceptionForm, reason: e.target.value})} className="w-full p-2 border rounded-lg" />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setShowExceptionModal(false)} className="px-4 py-2 text-gray-600 font-medium">Annuler</button>
              <button onClick={saveException} disabled={!exceptionForm.date} className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50">Bloquer la date</button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL GÉNÉRATION SESSIONS */}
      {genModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Générer des sessions</h2>
                <p className="text-sm text-gray-500 mt-0.5">{genModal.course.name}</p>
              </div>
              <button onClick={() => setGenModal(null)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Plage de dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
                  <input type="date" value={genForm.start_date}
                    onChange={e => updateGenForm({ start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin *</label>
                  <input type="date" value={genForm.end_date}
                    onChange={e => updateGenForm({ end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Disponibilité + durée */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dispo début</label>
                  <input type="time" value={genForm.avail_start}
                    onChange={e => updateGenForm({ avail_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dispo fin</label>
                  <input type="time" value={genForm.avail_end}
                    onChange={e => updateGenForm({ avail_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durée (min)</label>
                  <input type="number" value={genForm.duration_min} min="30" step="30"
                    onChange={e => updateGenForm({ duration_min: parseInt(e.target.value) || 120 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Jours de la semaine */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jours *</label>
                <div className="flex gap-1">
                  {['L','M','Me','J','V','S','D'].map((label, i) => {
                    const active = genForm.days.includes(i);
                    return (
                      <button key={i} type="button"
                        onClick={() => updateGenForm({ days: active ? genForm.days.filter(d => d !== i) : [...genForm.days, i] })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-400 border-gray-200 hover:border-gray-500'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prévisualisation */}
              {genPreview.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-green-800 mb-2">{genPreview.length} session{genPreview.length > 1 ? 's' : ''} à créer :</p>
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {genPreview.slice(0, 20).map((s, idx) => (
                      <p key={idx} className="text-xs text-green-700 capitalize">
                        {format(s.day, 'EEEE d MMM', { locale: fr })} — {s.start} → {s.end}
                      </p>
                    ))}
                    {genPreview.length > 20 && <p className="text-xs text-green-600 font-medium">+ {genPreview.length - 20} autres...</p>}
                  </div>
                </div>
              )}
              {genError && <p className="text-sm text-red-600 font-medium">{genError}</p>}
              {genForm.days.length > 0 && genPreview.length === 0 && (
                <p className="text-sm text-gray-400 text-center">Aucun jour correspondant dans cette plage.</p>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setGenModal(null)} className="px-4 py-2 text-gray-600 font-medium">Annuler</button>
              <button
                onClick={handleGenerate}
                disabled={genLoading || genPreview.length === 0}
                className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {genLoading ? 'Création en cours...' : `Créer ${genPreview.length} créneau${genPreview.length > 1 ? 'x' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
