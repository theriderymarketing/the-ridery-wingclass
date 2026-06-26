import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

import { verifyRole } from '../verify-admin';

export async function GET(request) {
  try {
    const auth = await verifyRole(request, ['admin', 'instructor']);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const [instRes, courseRes, sessRes, credRes, partRes] = await Promise.all([
      supabaseAdmin.from('instructors').select('*'),
      supabaseAdmin.from('course_types').select('*'),
      supabaseAdmin.from('sessions').select('*'),
      supabaseAdmin.from('student_credits').select('*'),
      supabaseAdmin.from('session_participants').select('*')
    ]);

    if (instRes.error) throw instRes.error;
    if (courseRes.error) throw courseRes.error;
    if (sessRes.error) throw sessRes.error;
    if (credRes.error) throw credRes.error;
    if (partRes.error) throw partRes.error;

    // Fetch only customers who are enrolled in a session
    const customerIds = [...new Set((partRes.data || []).map(p => p.customer_id))].filter(Boolean);
    
    let customers = [];
    if (customerIds.length > 0) {
      // Split into batches of 200 to avoid URL length limits in Supabase
      for (let i = 0; i < customerIds.length; i += 200) {
        const batch = customerIds.slice(i, i + 200);
        const { data, error } = await supabaseAdmin
          .from('customers')
          .select('*')
          .in('id', batch);
        if (error) throw error;
        customers = customers.concat(data || []);
      }
    }

    return NextResponse.json({
      instructors: instRes.data || [],
      courseTypes: courseRes.data || [],
      sessions: sessRes.data || [],
      studentCredits: credRes.data || [],
      sessionParticipants: partRes.data || [],
      customers: customers
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
