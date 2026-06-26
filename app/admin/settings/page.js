'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Mail, Key, User, Trash2, CalendarOff, Save, X, Edit2, List, Settings } from 'lucide-react';
import { supabaseProxy as supabase } from '../../../lib/supabase-proxy';
import { useStore } from '../../../lib/store';

export default function SettingsPage() {
  const { courseTypes, addCourseType, updateCourseType, deleteCourseType, settings, updateSettings, fetchData } = useStore();
  const [activeTab, setActiveTab] = useState('courses');
  
  // Auth state
  const [usersByRole, setUsersByRole] = useState({ admin: [], instructor: [], partenaire: [] });
  const [loading, setLoading] = useState(true);
  const [inviteEmails, setInviteEmails] = useState({ admin: '', instructor: '', partenaire: '' });
  const [inviting, setInviting] = useState({ admin: false, instructor: false, partenaire: false });

  // Course Types state
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({ name: '', duration_minutes: 120, capacity: 4, color: '#10B981' });

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

  const fetchAdmins = async () => {
    const { data } = await supabase.from('profiles').select('*');
    const all = Array.isArray(data) ? data : [];
    setUsersByRole({
      admin: all.filter(u => !u.role || u.role === 'admin'),
      instructor: all.filter(u => u.role === 'instructor'),
      partenaire: all.filter(u => u.role === 'partenaire'),
    });
    setLoading(false);
  };

  const handleInvite = async (role) => {
    const email = inviteEmails[role];
    if (!email) return;
    setInviting(prev => ({ ...prev, [role]: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ email, role })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setInviteEmails(prev => ({ ...prev, [role]: '' }));
      await fetchAdmins();
      alert(`Invitation envoyée à ${email}`);
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setInviting(prev => ({ ...prev, [role]: false }));
    }
  };

  const saveCourse = async () => {
    if (editingCourse) {
      await updateCourseType({ ...courseForm, id: editingCourse.id });
    } else {
      await addCourseType(courseForm);
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
    <div className="p-8 max-w-5xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres des Cours</h1>
        <p className="text-gray-500">Gérez le catalogue de cours, les fermetures exceptionnelles et les accès.</p>
      </div>

      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8 w-max">
        <button 
          onClick={() => setActiveTab('courses')}
          className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'courses' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
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
        <button 
          onClick={() => setActiveTab('integration')}
          className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'integration' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Settings className="w-4 h-4 mr-2" />
          Intégration Shopify
        </button>
      </div>

      {activeTab === 'courses' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Catalogue des cours</h2>
            <button onClick={() => { setEditingCourse(null); setCourseForm({ name: '', duration_minutes: 120, capacity: 4, color: '#10B981' }); setShowCourseModal(true); }} className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium hover:bg-black transition-colors">
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
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingCourse(course); setCourseForm(course); setShowCourseModal(true); }} className="p-2 text-gray-400 hover:text-orange-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
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
            { role: 'partenaire', label: 'Partenaires', badge: 'Partenaire', badgeColor: 'bg-green-100 text-green-700', description: 'Accès au Tableau des Licences uniquement.' },
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
                      <div key={u.id} className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-3">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{u.email || u.first_name}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                        </div>
                      </div>
                    ))}
                    {usersByRole[role].length === 0 && (
                      <p className="text-sm text-gray-400 py-2">Aucun compte.</p>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 h-max">
                  <h3 className="font-bold text-gray-900 mb-2 text-sm">Inviter un {label.slice(0, -1).toLowerCase()}</h3>
                  <input
                    type="email"
                    placeholder="adresse@email.com"
                    value={inviteEmails[role]}
                    onChange={e => setInviteEmails(prev => ({ ...prev, [role]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 text-sm"
                  />
                  <button
                    onClick={() => handleInvite(role)}
                    disabled={inviting[role] || !inviteEmails[role]}
                    className="w-full bg-gray-900 text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50"
                  >
                    {inviting[role] ? 'Envoi...' : 'Envoyer l\'invitation'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'integration' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <Settings className="w-6 h-6 text-orange-500 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Intégration Shopify</h2>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Comment intégrer le widget de réservation ?</h3>
            <p className="text-gray-600 mb-4">
              Pour permettre à vos clients de réserver leurs cours de wingfoil directement depuis votre boutique Shopify, vous devez copier le code ci-dessous et le coller dans une page de votre boutique.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6 font-medium">
              <li>Connectez-vous à votre interface d'administration Shopify.</li>
              <li>Allez dans <strong>Boutique en ligne {'>'} Pages</strong>.</li>
              <li>Créez une nouvelle page (ex: "Réserver un cours") ou modifiez-en une existante.</li>
              <li>Cliquez sur le bouton <strong>&lt;&gt; (Afficher le code HTML)</strong> dans l'éditeur de texte.</li>
              <li>Collez le code ci-dessous, puis enregistrez la page.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-3">Code HTML à copier :</h3>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono whitespace-pre-wrap">
{`<div style="width: 100%; height: 800px; max-width: 1200px; margin: 0 auto; overflow: hidden; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
  <iframe 
    src="https://the-ridery-wingclass.vercel.app/widget" 
    width="100%" 
    height="100%" 
    frameborder="0" 
    style="border: none;"
    title="Réservation Cours Wingfoil"
  ></iframe>
</div>`}
              </pre>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`<div style="width: 100%; height: 800px; max-width: 1200px; margin: 0 auto; overflow: hidden; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">\n  <iframe \n    src="https://the-ridery-wingclass.vercel.app/widget" \n    width="100%" \n    height="100%" \n    frameborder="0" \n    style="border: none;"\n    title="Réservation Cours Wingfoil"\n  ></iframe>\n</div>`);
                  alert('Code copié dans le presse-papier !');
                }}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                Copier le code
              </button>
            </div>
          </div>
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
    </div>
  );
}
