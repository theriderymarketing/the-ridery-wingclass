'use client';

import { useStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function StudentsPage() {
  const { customers, studentCredits, courseTypes, isLoaded, fetchData } = useStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isLoaded) fetchData();
  }, [isLoaded, fetchData]);

  if (!isLoaded) return <div className="p-8">Chargement...</div>;

  const filteredCustomers = customers.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50); // Pagination simple

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Élèves & Crédits</h1>
          <p className="text-gray-500 mt-1">Gérez les crédits de cours achetés sur Shopify</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Rechercher un élève..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
              <th className="py-4 px-6">Élève</th>
              <th className="py-4 px-6">Email</th>
              <th className="py-4 px-6">Crédits Actifs</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => {
              const credits = studentCredits.filter(c => c.customer_id === customer.id && c.credits_total > c.credits_used);
              
              return (
                <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">{customer.first_name} {customer.last_name}</td>
                  <td className="py-4 px-6 text-gray-500">{customer.email}</td>
                  <td className="py-4 px-6">
                    {credits.length === 0 ? (
                      <span className="text-gray-400 italic text-sm">Aucun crédit</span>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {credits.map(c => {
                          const type = courseTypes.find(t => t.id === c.course_type_id);
                          return (
                            <span key={c.id} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">
                              {type?.name || 'Cours'}: {c.credits_total - c.credits_used}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
