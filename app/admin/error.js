'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-red-100">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur d'affichage du calendrier</h2>
        <p className="text-gray-700 mb-4">Voici le détail de l'erreur pour la transmettre à l'assistant :</p>
        
        <div className="bg-red-50 p-4 rounded-lg overflow-x-auto text-sm font-mono text-red-800 mb-6">
          <p className="font-bold mb-2">{error.name}: {error.message}</p>
          <pre>{error.stack}</pre>
        </div>

        <button
          onClick={() => reset()}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
