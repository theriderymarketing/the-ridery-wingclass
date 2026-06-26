'use client';

import { FileText } from 'lucide-react';

export default function LicencesPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tableau des Licences</h1>
        <p className="text-gray-500">Gérez les licences des élèves.</p>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Fonctionnalité à venir</h2>
        <p className="text-gray-500">Le tableau des licences sera disponible prochainement.</p>
      </div>
    </div>
  );
}
