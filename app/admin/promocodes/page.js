'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Tag, Trash2, Send, X } from 'lucide-react';
import { fetchWithAuth } from '../../../lib/auth-utils';

export default function PromoCodesPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingPromoId, setSendingPromoId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, confirmText: 'Confirmer', confirmStyle: 'primary' });

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/admin/promos');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPromos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur chargement codes promo:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    const promoData = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      target_email: targetEmail.trim() || null,
      max_uses: maxUses ? parseInt(maxUses, 10) : null,
      is_active: true
    };

    try {
      const res = await fetchWithAuth('/api/admin/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoData)
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Erreur création: ${err.error}`);
      } else {
        setCode('');
        setDiscountType('percentage');
        setDiscountValue('');
        setTargetEmail('');
        setMaxUses('');
        fetchPromos();
      }
    } catch (err) {
      alert(`Erreur serveur: ${err.message}`);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetchWithAuth('/api/admin/promos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      if (res.ok) fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const openDeleteConfirm = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le code promo',
      message: 'Êtes-vous sûr de vouloir supprimer définitivement ce code promo ? Cette action est irréversible.',
      action: () => executeDelete(id),
      confirmText: 'Supprimer',
      confirmStyle: 'danger'
    });
  };

  const executeDelete = async (id) => {
    try {
      const res = await fetchWithAuth(`/api/admin/promos?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const openSendConfirm = (promo) => {
    if (!promo.target_email) return;
    setConfirmModal({
      isOpen: true,
      title: 'Envoyer le code promo',
      message: `Voulez-vous déclencher l'envoi du code promo ${promo.code} à ${promo.target_email} par email ?`,
      action: () => executeSend(promo),
      confirmText: 'Envoyer',
      confirmStyle: 'primary'
    });
  };

  const executeSend = async (promo) => {
    setSendingPromoId(promo.id);
    try {
      const res = await fetchWithAuth('/api/admin/promos/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promo)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Erreur d'envoi: ${data.error}`);
      } else {
        alert('Email envoyé avec succès !');
      }
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSendingPromoId(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Codes Promo</h1>
        <p className="text-gray-500 mt-2">Gérez vos codes de réduction pour le site de réservation.</p>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{confirmModal.title}</h3>
              <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 py-2.5 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  confirmModal.action();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className={`flex-1 py-2.5 px-4 text-white font-medium rounded-xl transition-colors ${
                  confirmModal.confirmStyle === 'danger'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6 items-start">
        {/* Promo List */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-orange-500" />
              Liste des codes
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher (code, email)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm w-64 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">Chargement...</div>
          ) : promos.length === 0 ? (
            <div className="p-12 text-center text-gray-400">Aucun code promo créé.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Code</th>
                    <th className="px-6 py-3 font-medium">Valeur</th>
                    <th className="px-6 py-3 font-medium">Email ciblé</th>
                    <th className="px-6 py-3 font-medium">Utilisations</th>
                    <th className="px-6 py-3 font-medium">Statut</th>
                    <th className="px-6 py-3 font-medium w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {promos.filter(p => {
                    const q = searchQuery.toLowerCase();
                    return p.code.toLowerCase().includes(q) || (p.target_email && p.target_email.toLowerCase().includes(q));
                  }).map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-orange-600">{p.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{p.discount_type === 'percentage' ? `${p.discount_value}%` : `${p.discount_value} €`}</td>
                      <td className="px-6 py-4 text-sm">{p.target_email || <span className="text-gray-400">Tous</span>}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{p.used_count} / {p.max_uses ? p.max_uses : '∞'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(p.id, p.is_active)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer border-none ${
                            p.is_active
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {p.is_active ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3 items-center">
                          {p.target_email && (
                            <button
                              onClick={() => openSendConfirm(p)}
                              disabled={sendingPromoId === p.id}
                              className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Envoyer par email"
                            >
                              <Send className="w-4 h-4 text-orange-500" />
                            </button>
                          )}
                          <button
                            onClick={() => openDeleteConfirm(p.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Form */}
        <div className="w-96 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
          <div className="mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-orange-500" />
              Créer un code
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Code Promo</label>
              <input
                type="text"
                placeholder="Ex: WELCOME10"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de réduction</label>
              <select
                value={discountType}
                onChange={e => setDiscountType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              >
                <option value="percentage">Pourcentage (%)</option>
                <option value="amount">Montant fixe (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Valeur de la réduction</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder={discountType === 'percentage' ? 'Ex: 10' : 'Ex: 15.50'}
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email ciblé <span className="text-gray-400 font-normal">(Optionnel)</span>
              </label>
              <input
                type="email"
                placeholder="Si vide, valable pour tous"
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              <span className="text-xs text-gray-400 mt-1 block">Ce code ne fonctionnera que pour cet email.</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombre d'utilisations <span className="text-gray-400 font-normal">(Optionnel)</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ex: 50"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              <span className="text-xs text-gray-400 mt-1 block">Laissez vide pour un usage illimité.</span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Créer le code
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
