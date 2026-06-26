'use client';

import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analyses & Statistiques</h1>
        <p className="text-gray-500 mt-1">
          Visualisez les données de vos réservations et vos performances.
        </p>
      </div>

      {/* Placeholder Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center">
          <div className="bg-orange-50 p-4 rounded-xl mr-4">
            <TrendingUp className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Chiffre d'Affaires</div>
            <div className="text-2xl font-bold text-gray-900">À venir</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center">
          <div className="bg-blue-50 p-4 rounded-xl mr-4">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Nouveaux Élèves</div>
            <div className="text-2xl font-bold text-gray-900">À venir</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center">
          <div className="bg-green-50 p-4 rounded-xl mr-4">
            <Calendar className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Cours Donnés</div>
            <div className="text-2xl font-bold text-gray-900">À venir</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center">
          <div className="bg-purple-50 p-4 rounded-xl mr-4">
            <BarChart3 className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Taux Remplissage</div>
            <div className="text-2xl font-bold text-gray-900">À venir</div>
          </div>
        </div>
      </div>

      {/* Placeholder Charts Area */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center py-24">
        <BarChart3 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Graphiques en construction</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Les tableaux de bord d'analyse seront bientôt disponibles ici pour vous aider à piloter votre activité de Wingfoil.
        </p>
      </div>
    </div>
  );
}
