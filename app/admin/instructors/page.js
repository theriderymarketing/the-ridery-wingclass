'use client';

import { useStore } from '@/lib/store';
import { useEffect } from 'react';
import { Users, Mail, Phone } from 'lucide-react';

export default function InstructorsPage() {
  const { instructors, isLoaded, fetchData } = useStore();

  useEffect(() => {
    if (!isLoaded) fetchData();
  }, [isLoaded, fetchData]);

  if (!isLoaded) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Équipe Pédagogique</h1>
          <p className="text-gray-500 mt-1">Gérez vos professeurs et moniteurs</p>
        </div>
        <button onClick={() => alert("Formulaire d'ajout de professeur en cours de développement")} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-medium">Ajouter un professeur</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructors.map(inst => (
          <div key={inst.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl text-white font-bold mb-4" style={{ backgroundColor: inst.color || '#3B82F6' }}>
              {inst.first_name[0]}{inst.last_name[0]}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{inst.first_name} {inst.last_name}</h3>
            
            <div className="w-full mt-6 space-y-3">
              <div className="flex items-center text-gray-600 text-sm bg-gray-50 p-2 rounded-lg">
                <Mail className="w-4 h-4 mr-3 text-gray-400" />
                {inst.email}
              </div>
              <div className="flex items-center text-gray-600 text-sm bg-gray-50 p-2 rounded-lg">
                <Phone className="w-4 h-4 mr-3 text-gray-400" />
                {inst.phone || 'Non renseigné'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
