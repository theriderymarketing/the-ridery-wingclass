import { create } from 'zustand';
import { supabaseProxy as supabase } from './supabase-proxy';

const handleError = (error, context) => {
  if (error) {
    console.error(`Erreur Supabase [${context}]:`, error);
    alert(`Erreur système (${context}): ${error.message}`);
    throw error;
  }
};

export const useStore = create((set, get) => ({
  instructors: [],
  courseTypes: [],
  sessions: [],
  studentCredits: [],
  sessionParticipants: [],
  customers: [], // Récupéré de la table existante
  isLoaded: false,

  fetchData: async () => {
    try {
      const res = await fetch('/api/admin/data');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      set({
        instructors: data.instructors || [],
        courseTypes: data.courseTypes || [],
        sessions: data.sessions || [],
        studentCredits: data.studentCredits || [],
        sessionParticipants: data.sessionParticipants || [],
        customers: data.customers || [],
        isLoaded: true
      });
    } catch (error) {
      handleError(error, 'fetch data');
    }
  },



  // Ajouter un professeur
  addInstructor: async (instructorData) => {
    try {
      const res = await fetch('/api/admin/instructors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instructorData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data) {
        set((state) => ({ instructors: [...state.instructors, json.data] }));
      }
    } catch (err) {
      handleError(err, 'addInstructor');
    }
  },

  // Ajouter un cours
  addSession: async (sessionData) => {
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data) {
        set((state) => ({ sessions: [...state.sessions, json.data] }));
      }
    } catch (err) {
      handleError(err, 'addSession');
    }
  },

  // Inscrire un élève
  enrollStudent: async (sessionId, customerId) => {
    // 1. Ajouter le participant
    const { data, error } = await supabase.from('session_participants').insert([{ session_id: sessionId, customer_id: customerId }]).select();
    handleError(error, 'enrollStudent');
    
    if (data) {
      set((state) => ({ sessionParticipants: [...state.sessionParticipants, ...data] }));
      
      // 2. Déduire un crédit (si applicable) - simplifié
      const session = get().sessions.find(s => s.id === sessionId);
      if (session) {
        const credit = get().studentCredits.find(c => c.customer_id === customerId && c.course_type_id === session.course_type_id);
        if (credit) {
          const newUsed = credit.credits_used + 1;
          await supabase.from('student_credits').update({ credits_used: newUsed }).eq('id', credit.id);
          set(state => ({
            studentCredits: state.studentCredits.map(c => c.id === credit.id ? { ...c, credits_used: newUsed } : c)
          }));
        }
      }
    }
  }

}));
