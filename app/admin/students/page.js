'use client';

import { useStore } from '../../../lib/store';
import { useEffect, useState } from 'react';
import { Search, User, ShoppingBag, X, Plus, Tag, Trash2, Send } from 'lucide-react';
import { fetchWithAuth } from '../../../lib/auth-utils';

export default function StudentsPage() {
  const { isLoaded, fetchData, customers, sessionParticipants, sessions, courseTypes } = useStore();
  const [search, setSearch] = useState('');
  const [shopifyCustomers, setShopifyCustomers] = useState([]);
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Promos / Packs state
  const [promos, setPromos] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [packUses, setPackUses] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isLoaded) fetchData();
    fetchCustomers();
    fetchPromos();
  }, [isLoaded, fetchData]);

  const fetchCustomers = async (q = '', cursor = null) => {
    if (cursor) setLoadingMore(true);
    else setLoading(true);

    try {
      const url = cursor ? `/api/admin/shopify-customers?q=${q}&cursor=${cursor}` : `/api/admin/shopify-customers?q=${q}`;
      const res = await fetchWithAuth(url);
      const data = await res.json();
      
      if (data && data.nodes) {
        if (cursor) {
          setShopifyCustomers(prev => [...prev, ...data.nodes]);
        } else {
          setShopifyCustomers(data.nodes);
        }
        setPageInfo(data.pageInfo || { hasNextPage: false, endCursor: null });
      } else {
        if (!cursor) setShopifyCustomers([]);
      }
    } catch (err) {
      console.error(err);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  const fetchPromos = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/promos');
      const data = await res.json();
      setPromos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement codes promo:', err);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchCustomers(search);
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const generatePack = async (e) => {
    e.preventDefault();
    if (!packUses || !selectedCustomer?.email) return;
    setIsGenerating(true);

    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const promoData = {
      code: `PACK-${randomSuffix}`,
      discount_type: 'percentage',
      discount_value: 100, // Pack = 100% gratuit
      target_email: selectedCustomer.email,
      max_uses: parseInt(packUses, 10),
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
        setPackUses('');
        fetchPromos(); // Refresh list
      }
    } catch (err) {
      alert(`Erreur serveur: ${err.message}`);
    }
    setIsGenerating(false);
  };

  const deletePack = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer ce pack ?')) return;
    try {
      const res = await fetchWithAuth(`/api/admin/promos?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const sendPackEmail = async (promo) => {
    if (!confirm(`Envoyer le code ${promo.code} par email à ${promo.target_email} ?`)) return;
    try {
      const res = await fetchWithAuth('/api/admin/promos/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promo)
      });
      if (res.ok) alert('Email envoyé !');
      else alert("Erreur lors de l'envoi");
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const customerPacks = promos.filter(p => p.target_email && selectedCustomer && selectedCustomer.email && p.target_email.toLowerCase() === selectedCustomer.email.toLowerCase());

  if (!isLoaded) return <div className="p-8 flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Base Élèves</h1>
          <p className="text-gray-500 mt-1">Gérez vos élèves et leurs cours restants (Packs de cours)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Rechercher sur Shopify (Nom, Email)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            />
          </div>
          <div className="text-sm text-gray-500 flex items-center bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            Synchronisation Shopify active
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">Client Shopify</th>
                <th className="py-4 px-6">Historique des cours</th>
                <th className="py-4 px-6">Cours restants (Packs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-gray-400">
                    Recherche en cours sur Shopify...
                  </td>
                </tr>
              ) : shopifyCustomers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-12 text-center text-gray-400">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                <>
                  {shopifyCustomers.map(customer => {
                    const customerEmail = customer.email ? customer.email.toLowerCase() : '';
                    const customerPromos = promos.filter(p => p.target_email && p.target_email.toLowerCase() === customerEmail);
                    const localCustomer = customers.find(c => c.email?.toLowerCase() === customerEmail);
                    const localParticipations = localCustomer 
                      ? sessionParticipants.filter(p => p.customer_id === localCustomer.id)
                      : [];
                    
                    const totalRemaining = customerPromos.reduce((acc, p) => acc + (p.max_uses ? p.max_uses - p.used_count : 0), 0);

                    return (
                      <tr key={customer.id} className="hover:bg-orange-50/30 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-4 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{customer.firstName} {customer.lastName}</div>
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center text-sm text-gray-700">
                            <ShoppingBag className="w-4 h-4 mr-2 text-gray-400" />
                            {localParticipations.length > 0 ? (
                              <span className="font-medium text-gray-900">{localParticipations.length} cours effectué{localParticipations.length > 1 ? 's' : ''}</span>
                            ) : (
                              <span className="text-gray-400">Aucun cours</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 flex items-center justify-between">
                          <div className="font-medium text-gray-800">
                            {customerPromos.length > 0 ? (
                              <span className="text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-full">
                                {totalRemaining} cours restants
                              </span>
                            ) : (
                              <span className="text-gray-400">Aucun pack cours</span>
                            )}
                          </div>
                          <button 
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-sm px-4 py-2 bg-white hover:bg-orange-50 text-orange-600 font-bold rounded-lg transition-colors border border-orange-200 shadow-sm"
                          >
                            Gérer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pageInfo.hasNextPage && (
                    <tr>
                      <td colSpan="3" className="p-4">
                        <button 
                          onClick={() => fetchCustomers(search, pageInfo.endCursor)}
                          disabled={loadingMore}
                          className="w-full py-3 text-sm font-semibold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex justify-center items-center gap-2"
                        >
                          {loadingMore ? 'Chargement...' : 'Charger plus d\'élèves'}
                        </button>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GESTION DES PACKS */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  Packs de cours
                </h3>
                <p className="text-sm text-gray-500 mt-1">{selectedCustomer.firstName} {selectedCustomer.lastName} ({selectedCustomer.email})</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              
              {/* Formulaire Création Pack */}
              <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 mb-8">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                  <Plus className="w-4 h-4 mr-2 text-orange-500" /> Ajouter un pack
                </h4>
                <form onSubmit={generatePack} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de cours</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Ex: 10"
                      value={packUses}
                      onChange={e => setPackUses(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isGenerating}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 h-[46px]"
                  >
                    {isGenerating ? 'Création...' : 'Générer le Pack'}
                  </button>
                </form>
              </div>

              {/* Liste des Packs Existant */}
              <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                <Tag className="w-4 h-4 mr-2 text-gray-500" /> Packs actifs pour ce client
              </h4>
              
              {customerPacks.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  Ce client n'a aucun pack de cours.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerPacks.map(promo => (
                    <div key={promo.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-orange-200 transition-colors">
                      <div>
                        <div className="font-mono font-bold text-orange-600 text-lg">{promo.code}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                          <span className="bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">
                            Reste {promo.max_uses ? promo.max_uses - promo.used_count : '∞'} cours
                          </span>
                          <span>(Sur {promo.max_uses} initialement)</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => sendPackEmail(promo)}
                          className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Envoyer le code par email"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deletePack(promo.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer ce pack"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

