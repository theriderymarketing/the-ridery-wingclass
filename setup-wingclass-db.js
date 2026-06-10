import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    CREATE TABLE IF NOT EXISTS instructors (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      color TEXT DEFAULT '#3B82F6',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS course_types (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      capacity INTEGER NOT NULL DEFAULT 4,
      duration_minutes INTEGER NOT NULL DEFAULT 120,
      color TEXT DEFAULT '#10B981',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
      course_type_id UUID REFERENCES course_types(id) ON DELETE CASCADE,
      start_time TIMESTAMP WITH TIME ZONE NOT NULL,
      end_time TIMESTAMP WITH TIME ZONE NOT NULL,
      status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
      spot_location TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS student_credits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
      course_type_id UUID REFERENCES course_types(id) ON DELETE CASCADE,
      credits_total INTEGER NOT NULL DEFAULT 0,
      credits_used INTEGER NOT NULL DEFAULT 0,
      shopify_order_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS session_participants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'attended', 'no_show', 'cancelled')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(session_id, customer_id)
    );
  `;
  
  // Actually, we can't run raw SQL from the JS client easily without RPC unless we set it up.
  // Instead, let's create a SQL file that the user can execute if needed, or I can use the supabase cli if installed.
  console.log("Please run this SQL in your Supabase SQL Editor:");
  console.log(sql);
}

run();
