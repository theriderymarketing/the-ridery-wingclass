-- Supabase Schema for THE RIDERY WINGCLASS

-- 1. Instructors Table (Professeurs)
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  color TEXT DEFAULT '#3B82F6', -- Pour l'affichage dans le calendrier
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Course Types (Type de cours : Wingboost, Débutant, Perfectionnement)
CREATE TABLE IF NOT EXISTS course_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  color TEXT DEFAULT '#10B981',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Sessions (Les créneaux de cours programmés)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
  course_type_id UUID REFERENCES course_types(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  spot_location TEXT, -- Lieu du cours (ex: Plage des Culs Nus, La Couarde)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Student Credits (Les crédits achetés via Shopify)
-- Un client peut avoir par exemple "10 crédits Wingboost"
CREATE TABLE IF NOT EXISTS student_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE, -- Lien direct avec l'app de location existante
  course_type_id UUID REFERENCES course_types(id) ON DELETE CASCADE,
  credits_total INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  shopify_order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Session Participants (Les élèves inscrits à une session)
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'attended', 'no_show', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, customer_id) -- Un élève ne peut pas s'inscrire deux fois à la même session
);

-- Sécurité : RLS Policies
-- Désactiver RLS temporairement pour simplifier (l'API gère la sécu)
ALTER TABLE instructors DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_credits DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants DISABLE ROW LEVEL SECURITY;
