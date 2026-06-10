'use client';

import { useStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { Users, Mail, Phone } from 'lucide-react';

export default function InstructorsPage() {
  const { instructors, isLoaded, fetchData } = useStore();

  useEffect(() => {
    if (!isLoaded) fetchData();
  }, [isLoaded, fetchData]);

  if (!isLoaded) return <div className="p-8">Chargement...</div>;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInstructor, setNewInstructor] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    color: '#3B82F6'
  });

  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    await useStore.getState().addInstructor(newInstructor);
    setIsModalOpen(false);
    setNewInstructor({ first_name: '', last_name: '', email: '', phone: '', color: '#3B82F6' });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Équipe Pédagogique</h1>
          <p className="text-gray-500 mt-1">Gérez vos professeurs et moniteurs</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-medium">Ajouter un professeur</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructors.map(inst => (
          <div key={inst.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl text-white font-bold mb-4" style={{ backgroundColor: inst.color || '#3B82F6' }}>
              {inst.first_name[0]}{inst.last_name?.[0] || ''}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Nouveau professeur</h2>
            <form onSubmit={handleCreateInstructor} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prénom</label>
                  <input 
                    type="text" 
                    required
                    value={newInstructor.first_name}
                    onChange={(e) => setNewInstructor({...newInstructor, first_name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom</label>
                  <input 
                    type="text" 
                    required
                    value={newInstructor.last_name}
                    onChange={(e) => setNewInstructor({...newInstructor, last_name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={newInstructor.email}
                  onChange={(e) => setNewInstructor({...newInstructor, email: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                <input 
                  type="tel" 
                  value={newInstructor.phone}
                  onChange={(e) => setNewInstructor({...newInstructor, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Couleur</label>
                <input 
                  type="color" 
                  value={newInstructor.color}
                  onChange={(e) => setNewInstructor({...newInstructor, color: e.target.value})}
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
