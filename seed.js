import { supabaseAdmin } from './lib/supabase-admin.js';

async function seed() {
  // 1. Create Instructors
  const { data: insts } = await supabaseAdmin.from('instructors').insert([
    { first_name: 'Kevin', last_name: 'Monin', email: 'kevin@theridery.com', color: '#3B82F6' },
    { first_name: 'Alex', last_name: 'Ridery', email: 'alex@theridery.com', color: '#10B981' },
    { first_name: 'Sarah', last_name: 'Coach', email: 'sarah@theridery.com', color: '#F59E0B' }
  ]).select();

  // 2. Create Course Types
  const { data: courses } = await supabaseAdmin.from('course_types').insert([
    { name: 'Wingboost Débutant', capacity: 4, duration_minutes: 120, color: '#3B82F6' },
    { name: 'Perfectionnement', capacity: 4, duration_minutes: 120, color: '#10B981' },
    { name: 'Foil Avancé', capacity: 6, duration_minutes: 120, color: '#F59E0B' }
  ]).select();

  // 3. Create Sessions today and tomorrow
  if (insts && courses) {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const end1 = new Date(today.getTime() + 2 * 60 * 60 * 1000);
    
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(14, 0, 0, 0);
    const end2 = new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000);

    await supabaseAdmin.from('sessions').insert([
      { instructor_id: insts[0].id, course_type_id: courses[0].id, start_time: today, end_time: end1, spot_location: 'La Couarde' },
      { instructor_id: insts[1].id, course_type_id: courses[1].id, start_time: tomorrow, end_time: end2, spot_location: 'Plage des Culs Nus' }
    ]);
  }
  console.log("Seeding complete.");
}
seed();
