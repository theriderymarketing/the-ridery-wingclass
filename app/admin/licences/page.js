'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchWithAuth } from '@/lib/auth-utils';
import { Search, Check, X, Clock, Edit2 } from 'lucide-react';

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatTime(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function LicenceNumCell({ customer, onSave }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(customer.id, input.trim() || null);
    setSaving(false);
    setEditing(false);
  };

  if (customer.has_license) return <span className="text-xs text-gray-400">—</span>;

  const assignedNum = customer.assigned_license_number;

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input autoFocus value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          placeholder="N° licence..." className="border border-orange-300 rounded-lg px-2 py-1 text-xs w-28 focus:outline-none focus:border-orange-500" />
        <button onClick={save} disabled={saving} className="p-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"><Check className="w-3 h-3"/></button>
        <button onClick={() => setEditing(false)} className="p-1 bg-gray-100 text-gray-500 rounded-lg"><X className="w-3 h-3"/></button>
      </div>
    );
  }

  return (
    <button onClick={() => { setEditing(true); setInput(assignedNum || ''); }}
      className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
      <Edit2 className="w-3 h-3"/>
      {assignedNum ? <span>N° {assignedNum}</span> : <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500"/>En attente</span>}
    </button>
  );
}

export default function LicencesPage() {
  const [data, setData] = useState({ instructors: [], sessions: [], sessionParticipants: [], customers: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    fetchWithAuth('/api/admin/data')
      .then(r => r.json())
      .then(d => { setData(d); setIsLoaded(true); })
      .catch(() => setIsLoaded(true));
  }, []);

  const rows = useMemo(() => {
    return data.sessionParticipants.map(p => {
      const session = data.sessions.find(s => s.id === p.session_id);
      const customer = data.customers.find(c => c.id === p.customer_id);
      const instructor = session ? data.instructors.find(i => i.id === session.instructor_id) : null;
      return { p, session, customer, instructor };
    }).filter(r => r.customer);
  }, [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(({ customer, instructor }) =>
      [customer?.first_name, customer?.last_name, customer?.email, customer?.phone,
       instructor?.first_name, instructor?.last_name, customer?.license_type, customer?.assigned_license_number]
        .some(v => v?.toLowerCase().includes(q))
    );
  }, [rows, search]);

  const saveLicenceNumber = async (customerId, value) => {
    await fetchWithAuth('/api/admin/customers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: customerId, assigned_license_number: value })
    });
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === customerId ? { ...c, assigned_license_number: value } : c)
    }));
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    setSavingCustomer(true);
    const formData = new FormData(e.target);
    const updates = Object.fromEntries(formData.entries());
    
    await fetchWithAuth('/api/admin/customers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingCustomer.id, ...updates })
    });
    
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === editingCustomer.id ? { ...c, ...updates } : c)
    }));
    setSavingCustomer(false);
    setEditingCustomer(null);
  };

  if (!isLoaded) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau des Licences</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} inscription{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 w-56" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="px-3 py-3 text-left">Date</th>
                <th className="px-3 py-3 text-left">Heure</th>
                <th className="px-3 py-3 text-left">Professeur</th>
                <th className="px-3 py-3 text-left">Prénom / Nom</th>
                <th className="px-3 py-3 text-left">Naissance</th>
                <th className="px-3 py-3 text-left">Adresse</th>
                <th className="px-3 py-3 text-left">Email</th>
                <th className="px-3 py-3 text-left">Téléphone</th>
                <th className="px-3 py-3 text-left">Type Licence</th>
                <th className="px-3 py-3 text-left">Statut</th>
                <th className="px-3 py-3 text-left">N° Attribué</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-gray-400">Aucune inscription trouvée</td>
                </tr>
              ) : filtered.map(({ p, session, customer, instructor }, idx) => (
                <tr key={p.id || idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap font-medium text-gray-900 text-xs">{formatDate(session?.start_time)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-600 text-xs">{formatTime(session?.start_time)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-700 text-xs">
                    {instructor ? `${instructor.first_name} ${instructor.last_name}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-semibold text-gray-900 text-xs">
                    {customer.first_name} {customer.last_name}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-gray-600 text-xs">{customer.birth_date ? formatDate(customer.birth_date) : '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs max-w-[130px]">
                    <span className="truncate block" title={customer.address}>{customer.address || '—'}</span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{customer.email || '—'}</td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap">{customer.phone || '—'}</td>

                  {/* Type Licence */}
                  <td className="px-3 py-2.5 text-xs text-gray-700">
                    {customer.has_license
                      ? <span className="font-semibold text-blue-700">Propre FFV</span>
                      : <span className="font-semibold">{customer.license_type || '—'}</span>}
                  </td>

                  {/* Statut */}
                  <td className="px-3 py-2.5 text-xs">
                    {customer.has_license ? <span className="text-gray-400">—</span> : (
                      customer.license_paid
                        ? <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold text-xs"><Check className="w-3 h-3"/>Payée</span>
                        : <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold text-xs"><X className="w-3 h-3"/>Non payée</span>
                    )}
                  </td>

                  {/* N° Attribué */}
                  <td className="px-3 py-2.5 text-xs">
                    <LicenceNumCell customer={customer} onSave={saveLicenceNumber} />
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5 text-right text-xs">
                    <button onClick={() => setEditingCustomer(customer)} className="p-1.5 text-gray-400 hover:text-orange-600 rounded-lg transition-colors bg-white hover:bg-orange-50 border border-gray-200" title="Modifier les infos de l'élève">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDIT CUSTOMER */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900">Modifier l'élève</h3>
              <button onClick={() => setEditingCustomer(null)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveCustomer}>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Prénom</label>
                    <input name="first_name" defaultValue={editingCustomer.first_name} className="w-full p-2 border border-gray-300 rounded-lg text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nom</label>
                    <input name="last_name" defaultValue={editingCustomer.last_name} className="w-full p-2 border border-gray-300 rounded-lg text-sm" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date de naissance</label>
                    <input name="birth_date" type="date" defaultValue={editingCustomer.birth_date ? editingCustomer.birth_date.split('T')[0] : ''} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Téléphone</label>
                    <input name="phone" defaultValue={editingCustomer.phone} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input name="email" type="email" defaultValue={editingCustomer.email} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Adresse postale</label>
                  <input name="address" defaultValue={editingCustomer.address} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingCustomer(null)} className="px-4 py-2 text-gray-600 font-medium text-sm">Annuler</button>
                <button type="submit" disabled={savingCustomer} className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 text-sm disabled:opacity-50">
                  {savingCustomer ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
