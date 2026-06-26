import { create } from 'zustand';
import { supabaseProxy as supabase } from './supabase-proxy';
import { fetchWithAuth } from './auth-utils';

const handleError = (error, context) => {
  if (error) {
    console.error(`Erreur Supabase [${context}]:`, error);
    if (!error.message?.toLowerCase().includes('unauthorized')) {
      alert(`Erreur système (${context}): ${error.message}`);
    }
  }
};

export const useStore = create((set, get) => ({
  instructors: [],
  courseTypes: [],
  sessions: [],
  studentCredits: [],
  sessionParticipants: [],
  customers: [], // Récupéré de la table existante
  settings: { closedDates: [] },
  isLoaded: false,

  fetchData: async () => {
    try {
      const res = await fetchWithAuth('/api/admin/data');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      set({
        instructors: data.instructors || [],
        courseTypes: data.courseTypes || [],
        sessions: data.sessions || [],
        studentCredits: data.studentCredits || [],
        sessionParticipants: data.sessionParticipants || [],
        customers: data.customers || [],
        settings: { closedDates: [] }, // Will fetch settings separately if needed or just initialize
        isLoaded: true
      });
      get().fetchSettings();
    } catch (error) {
      handleError(error, 'fetch data');
    }
  },

  fetchSettings: async () => {
    try {
      const res = await fetchWithAuth('/api/admin/settings');
      const json = await res.json();
      if (res.ok && json.data) {
        set({ settings: json.data });
      }
    } catch(err) {
      console.error(err);
    }
  },

  updateSettings: async (newSettings) => {
    try {
      const res = await fetchWithAuth('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        set({ settings: newSettings });
      }
    } catch(err) {
      handleError(err, 'updateSettings');
    }
  },

  addCourseType: async (data) => {
    try {
      const res = await fetchWithAuth('/api/admin/course-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data) set((state) => ({ courseTypes: [...state.courseTypes, json.data] }));
    } catch (err) { handleError(err, 'addCourseType'); }
  },

  updateCourseType: async (data) => {
    try {
      const res = await fetchWithAuth('/api/admin/course-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data) set((state) => ({ courseTypes: state.courseTypes.map(c => c.id === json.data.id ? json.data : c) }));
    } catch (err) { handleError(err, 'updateCourseType'); }
  },

  deleteCourseType: async (id) => {
    try {
      const res = await fetchWithAuth('/api/admin/course-types', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      set((state) => ({ courseTypes: state.courseTypes.filter(c => c.id !== id) }));
    } catch (err) { handleError(err, 'deleteCourseType'); }
  },

  // Ajouter un professeur
  addInstructor: async (instructorData) => {
    try {
      const res = await fetchWithAuth('/api/admin/instructors', {
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

  // Modifier un professeur
  updateInstructor: async (instructorData) => {
    try {
      const res = await fetchWithAuth('/api/admin/instructors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instructorData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data) {
        set((state) => ({ 
          instructors: state.instructors.map(i => i.id === json.data.id ? json.data : i) 
        }));
      }
    } catch (err) {
      handleError(err, 'updateInstructor');
    }
  },

  // Supprimer un professeur
  deleteInstructor: async (id) => {
    try {
      const res = await fetchWithAuth('/api/admin/instructors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      set((state) => ({ instructors: state.instructors.filter(i => i.id !== id) }));
    } catch (err) {
      handleError(err, 'deleteInstructor');
    }
  },

  // Ajouter un cours
  addSession: async (sessionData) => {
    try {
      const res = await fetchWithAuth('/api/admin/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data) {
        set((state) => ({ sessions: [...state.sessions, json.data] }));
        return json.data;
      }
    } catch (err) {
      handleError(err, 'addSession');
      return null;
    }
  },

  // Modifier un cours
  updateSession: async (sessionData) => {
    try {
      const res = await fetchWithAuth('/api/admin/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data) {
        set((state) => ({ 
          sessions: state.sessions.map(s => s.id === json.data.id ? json.data : s) 
        }));
      }
    } catch (err) {
      handleError(err, 'updateSession');
    }
  },

  // Supprimer un cours
  deleteSession: async (id) => {
    try {
      const res = await fetchWithAuth('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      set((state) => ({ sessions: state.sessions.filter(s => s.id !== id) }));
    } catch (err) {
      handleError(err, 'deleteSession');
    }
  },

  // Ajouter un élève
  addCustomer: async (customerData) => {
    try {
      const res = await fetchWithAuth('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (json.data) {
        set((state) => ({ customers: [...state.customers, json.data] }));
        return json.data;
      }
    } catch (err) {
      handleError(err, 'addCustomer');
      return null;
    }
  },

  // Inscrire un élève
  enrollStudent: async (sessionId, customerId) => {
    try {
      const res = await fetchWithAuth('/api/admin/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, customer_id: customerId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      const data = json.data;
      if (data) {
        set((state) => ({ sessionParticipants: [...state.sessionParticipants, data] }));
        
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
    } catch (err) {
      handleError(err, 'enrollStudent');
    }
  },

  // Désinscrire un élève
  removeStudent: async (participantId) => {
    try {
      const res = await fetchWithAuth('/api/admin/participants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: participantId })
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to remove participant');
      }
      set((state) => ({ sessionParticipants: state.sessionParticipants.filter(p => p.id !== participantId) }));
    } catch (err) {
      handleError(err, 'removeStudent');
    }
  }

}));
