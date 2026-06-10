'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users, ArrowLeft } from 'lucide-react';

export default function WidgetPage({ params }) {
  // En Next.js 15, params est une promesse, mais pour l'instant on simule si nécessaire
  // const courseId = params?.courseId;
  
  const { sessions, courseTypes, fetchData, isLoaded, sessionParticipants } = useStore();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [step, setStep] = useState(1); // 1: Choisir date/heure, 2: Formulaire d'info
  
  // Form state
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    niveau: ''
  });

  useEffect(() => {
    if (!isLoaded) fetchData();
  }, [isLoaded, fetchData]);

  if (!isLoaded) {
    return <div className="flex h-full items-center justify-center">Chargement des disponibilités...</div>;
  }

  // Filtrer les sessions futures
  const availableSessions = sessions.filter(s => new Date(s.start_time) >= new Date());
  
  // Jours de la semaine affichée
  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeek, i));

  // Sessions du jour sélectionné
  const sessionsOfTheDay = availableSessions.filter(s => isSameDay(new Date(s.start_time), selectedDate));

  const handleNextWeek = () => setCurrentWeek(addDays(currentWeek, 7));
  const handlePrevWeek = () => setCurrentWeek(addDays(currentWeek, -7));

  const handleSelectSession = (session) => {
    setSelectedSession(session);
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ici on envoie un message au parent (la page Shopify)
    // Shopify interceptera le message et ajoutera l'article au panier avec les Custom Properties
    const message = {
      type: 'WINGCLASS_BOOKING',
      payload: {
        sessionId: selectedSession.id,
        courseName: courseTypes.find(c => c.id === selectedSession.course_type_id)?.name || 'Cours',
        date: format(new Date(selectedSession.start_time), "dd/MM/yyyy HH:mm"),
        customerInfo: formData
      }
    };
    window.parent.postMessage(message, '*');
  };

  const courseInfo = selectedSession 
    ? courseTypes.find(c => c.id === selectedSession.course_type_id) 
    : { name: 'Cours de Wingfoil - The Ridery', duration_minutes: 120 };

  return (
    <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative max-h-[90vh]">
      
      {/* Close button (Simulated for iframe) */}
      <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 z-10">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      {/* Left Pane - Image & Recap */}
      <div className="w-full md:w-1/2 bg-gray-50 flex flex-col">
        <div className="h-64 md:h-1/2 bg-cover bg-center" style={{ backgroundImage: 'url("https://theridery.com/cdn/shop/files/aile-de-wing-foil-duotone-slick-2024.jpg?v=1711623863")' }}></div>
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
             <img src="https://theridery.com/cdn/shop/files/favicon_32x32.png" alt="Logo" className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{courseInfo?.name || 'Cours de Wingfoil avec The Ridery'}</h2>
          <p className="text-gray-500 text-sm mb-6">Les cours durent {courseInfo?.duration_minutes / 60}h, pense à bien arriver 20 minutes avant pour te préparer et pas perdre une seule seconde sur l'eau !</p>
          
          {selectedSession && (
            <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center text-gray-700">
                <CalendarIcon className="w-5 h-5 mr-3 text-orange-500" />
                <span className="font-medium">{format(new Date(selectedSession.start_time), "EEEE, d MMMM yyyy", { locale: fr })}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Clock className="w-5 h-5 mr-3 text-orange-500" />
                <span className="font-medium">
                  {format(new Date(selectedSession.start_time), "HH:mm")} - {format(new Date(selectedSession.end_time), "HH:mm")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane - Interaction */}
      <div className="w-full md:w-1/2 p-8 overflow-y-auto flex flex-col">
        {step === 1 ? (
          <>
            <div className="text-center mb-8">
              <h3 className="font-medium text-gray-500 text-sm mb-1 uppercase tracking-wider">Étape 1</h3>
              <h2 className="text-2xl font-bold text-gray-900">Quel moment vous convient le mieux ?</h2>
            </div>

            {/* Date Picker (Semaine) */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={handlePrevWeek} className="p-2 rounded-full hover:bg-gray-100 text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
              <h3 className="font-bold text-gray-900 capitalize">{format(currentWeek, "MMMM yyyy", { locale: fr })}</h3>
              <button onClick={handleNextWeek} className="p-2 rounded-full hover:bg-gray-100 text-gray-600"><ChevronRight className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-8">
              {days.map((day, i) => {
                const isSelected = isSameDay(day, selectedDate);
                const isPast = day < new Date(new Date().setHours(0,0,0,0));
                return (
                  <button 
                    key={i} 
                    disabled={isPast}
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all
                      ${isSelected ? 'bg-gray-900 text-white shadow-md' : isPast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-700'}
                    `}
                  >
                    <span className="text-xs font-medium mb-1 uppercase">{format(day, "eee", { locale: fr })}</span>
                    <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{format(day, "d")}</span>
                  </button>
                );
              })}
            </div>

            {/* Time Slots */}
            <div className="space-y-3 flex-1">
              {sessionsOfTheDay.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                  <p className="text-gray-500">Aucun créneau disponible à cette date.</p>
                </div>
              ) : (
                sessionsOfTheDay.map(session => {
                  const capacity = courseTypes.find(c => c.id === session.course_type_id)?.capacity || 4;
                  const enrolled = sessionParticipants.filter(p => p.session_id === session.id).length;
                  const placesLeft = capacity - enrolled;
                  const isFull = placesLeft <= 0;

                  return (
                    <button 
                      key={session.id}
                      disabled={isFull}
                      onClick={() => handleSelectSession(session)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all
                        ${isFull ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' : 'bg-white border-gray-300 hover:border-orange-500 hover:shadow-md'}
                      `}
                    >
                      <div className="font-bold text-gray-900 text-lg">
                        {format(new Date(session.start_time), "HH:mm")} - {format(new Date(session.end_time), "HH:mm")}
                      </div>
                      <div className={`text-sm font-medium px-3 py-1 rounded-full ${isFull ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                        {isFull ? 'Complet' : `${placesLeft} place${placesLeft > 1 ? 's' : ''} restante${placesLeft > 1 ? 's' : ''}`}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-600">Vous ne trouvez pas votre date ? <a href="#" className="text-orange-600 font-medium hover:underline">Rejoindre la liste d'attente</a></p>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setStep(1)} className="flex items-center text-orange-600 font-medium hover:underline mb-6 w-max">
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux dates
            </button>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Compléter la réservation</h2>
            </div>

            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 mb-8 flex items-start gap-3 text-teal-800">
              <div className="mt-0.5"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
              <div>
                <p className="font-bold">La réservation ne sera confirmée qu'après le paiement</p>
                <p className="text-sm mt-1 opacity-80">Vous serez redirigé vers le panier Shopify pour finaliser votre achat.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input required type="text" placeholder="Entrez votre nom" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input required type="email" placeholder="Entrez votre e-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                <input required type="tel" placeholder="Entrez votre numéro" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau de Wing ? *</label>
                <select required value={formData.niveau} onChange={e => setFormData({...formData, niveau: e.target.value})} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white">
                  <option value="">Sélectionner</option>
                  <option value="debutant">Jamais pratiqué</option>
                  <option value="initie">J'ai déjà volé</option>
                  <option value="autonome">Je tire des bords</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-4 rounded-xl transition-colors shadow-lg mt-6">
                Ajouter au panier
              </button>
            </form>
          </>
        )}
      </div>

    </div>
  );
}
