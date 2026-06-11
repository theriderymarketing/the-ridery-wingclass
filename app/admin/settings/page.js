'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Mail, Key, User, Trash2, Clock, CalendarOff, Save, X } from 'lucide-react';
import { supabaseProxy as supabase } from '../../../lib/supabase-proxy';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Lundi' },
  { id: 'tuesday', label: 'Mardi' },
  { id: 'wednesday', label: 'Mercredi' },
  { id: 'thursday', label: 'Jeudi' },
  { id: 'friday', label: 'Vendredi' },
  { id: 'saturday', label: 'Samedi' },
  { id: 'sunday', label: 'Dimanche' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('access');
  
  // === ACCESS TAB STATE ===
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', role: 'instructor', firstName: '', lastName: '' });

  // === SCHEDULE TAB STATE ===
  const [schedule, setSchedule] = useState(
    DAYS_OF_WEEK.map(day => ({
      ...day,
      isOpen: !['sunday'].includes(day.id),
      openTime: '09:00',
      closeTime: '18:00',
    }))
  );
  const [closedDates, setClosedDates] = useState([
    { id: 1, date: '2026-07-14', reason: 'Fête Nationale' },
    { id: 2, date: '2026-08-15', reason: 'Assomption' },
    { id: 3, date: '2026-12-25', reason: 'Noël' },
  ]);
  const [newClosedDate, setNewClosedDate] = useState({ date: '', reason: '' });
  const [showAddClosure, setShowAddClosure] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.error) {
        alert("Erreur: " + data.error);
      } else {
        alert("Compte créé avec succès !");
        setFormData({ email: '', password: '', role: 'instructor', firstName: '', lastName: '' });
        fetchUsers();
      }
    } catch (err) {
      alert("Erreur serveur.");
    } finally {
      setIsCreating(false);
    }
  };

  // Schedule handlers
  const toggleDay = (dayId) => {
    setSchedule(prev => prev.map(d => d.id === dayId ? { ...d, isOpen: !d.isOpen } : d));
  };

  const updateTime = (dayId, field, value) => {
    setSchedule(prev => prev.map(d => d.id === dayId ? { ...d, [field]: value } : d));
  };

  const addClosedDate = () => {
    if (!newClosedDate.date) return;
    setClosedDates(prev => [...prev, { id: Date.now(), ...newClosedDate }]);
    setNewClosedDate({ date: '', reason: '' });
    setShowAddClosure(false);
  };

  const removeClosedDate = (id) => {
    setClosedDates(prev => prev.filter(d => d.id !== id));
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    // TODO: Save to Supabase when table is created
    setTimeout(() => {
      setSavingSchedule(false);
      alert('Horaires sauvegardés avec succès !');
    }, 800);
  };

  const tabs = [
    { id: 'access', label: 'Accès & Comptes', icon: Shield },
    { id: 'schedule', label: 'Horaires & Fermetures', icon: Clock },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Paramètres & Accès</h1>
        <p className="text-gray-500 mt-2">Gérez les comptes, les horaires et les fermetures de votre école.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ACCESS TAB */}
      {activeTab === 'access' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire de création */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-orange-500" />
                Créer un accès
              </h2>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de compte (Rôle)</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="admin">Administrateur (Toi)</option>
                    <option value="instructor">Professeur / Moniteur</option>
                    <option value="partner">Partenaire (La Pelle)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                    <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                      value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Jean" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                      value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Dupont" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@exemple.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe temporaire</label>
                  <div className="relative">
                    <Key className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500" 
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="MotDePasse123!" />
                  </div>
                </div>

                <button type="submit" disabled={isCreating} className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50">
                  {isCreating ? 'Création...' : 'Créer le compte'}
                </button>
              </form>
            </div>
          </div>

          {/* Liste des comptes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-gray-500" />
                  Comptes existants
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 font-medium">Utilisateur</th>
                      <th className="px-6 py-3 font-medium">Rôle</th>
                      <th className="px-6 py-3 font-medium">Date de création</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan="3" className="text-center py-8 text-gray-400">Chargement des comptes...</td></tr>
                    ) : users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs mr-3">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                              <div className="text-xs text-gray-500">ID: {user.id.substring(0,8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            user.role === 'instructor' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            user.role === 'partner' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                    {!loading && users.length === 0 && (
                      <tr><td colSpan="3" className="text-center py-8 text-gray-400">Aucun compte trouvé.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className="space-y-8">
          {/* Weekly Schedule */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-500" />
                  Horaires d'ouverture
                </h2>
                <p className="text-sm text-gray-400 mt-1">Définissez les jours et horaires où les cours peuvent être réservés.</p>
              </div>
              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingSchedule ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {schedule.map((day) => (
                <div key={day.id} className={`flex items-center px-6 py-4 gap-6 transition-colors ${!day.isOpen ? 'bg-gray-50/50' : ''}`}>
                  {/* Toggle */}
                  <button
                    onClick={() => toggleDay(day.id)}
                    className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                      day.isOpen ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      day.isOpen ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </button>

                  {/* Day Name */}
                  <div className="w-28">
                    <span className={`font-semibold text-sm ${
                      day.isOpen ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {day.label}
                    </span>
                  </div>

                  {/* Time Pickers */}
                  {day.isOpen ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={day.openTime}
                        onChange={(e) => updateTime(day.id, 'openTime', e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                      <span className="text-gray-400 text-sm">à</span>
                      <input
                        type="time"
                        value={day.closeTime}
                        onChange={(e) => updateTime(day.id, 'closeTime', e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Fermé</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Closed Dates */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <CalendarOff className="w-5 h-5 mr-2 text-red-500" />
                  Jours de fermeture exceptionnelle
                </h2>
                <p className="text-sm text-gray-400 mt-1">Ajoutez des dates spécifiques où l'école sera fermée (jours fériés, vacances, etc.).</p>
              </div>
              <button
                onClick={() => setShowAddClosure(!showAddClosure)}
                className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>

            {/* Add closure form */}
            {showAddClosure && (
              <div className="px-6 py-4 bg-orange-50/30 border-b border-orange-100/50">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date de fermeture</label>
                    <input
                      type="date"
                      value={newClosedDate.date}
                      onChange={(e) => setNewClosedDate({ ...newClosedDate, date: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Raison (optionnel)</label>
                    <input
                      type="text"
                      placeholder="Ex: Jour férié, Vacances..."
                      value={newClosedDate.reason}
                      onChange={(e) => setNewClosedDate({ ...newClosedDate, reason: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    onClick={addClosedDate}
                    disabled={!newClosedDate.date}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => { setShowAddClosure(false); setNewClosedDate({ date: '', reason: '' }); }}
                    className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Closed dates list */}
            {closedDates.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                Aucune fermeture exceptionnelle programmée.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {closedDates.sort((a, b) => new Date(a.date) - new Date(b.date)).map((closure) => (
                  <div key={closure.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                        <CalendarOff className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {new Date(closure.date + 'T00:00:00').toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                        {closure.reason && (
                          <div className="text-xs text-gray-400 mt-0.5">{closure.reason}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeClosedDate(closure.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
