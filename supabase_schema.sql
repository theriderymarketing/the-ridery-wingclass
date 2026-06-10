-- Supabase Schema for THE RIDERY WINGCLASS (Mise à jour avec Rôles & Profils Clients)

-- 1. Customers Table (Les élèves/clients)
-- Contient toutes les infos nécessaires pour La Pelle et le profil de l'élève
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth DATE, -- Date de naissance
  address TEXT, -- Adresse postale
  has_license BOOLEAN DEFAULT false, -- A une licence ?
  license_number TEXT, -- Numéro de licence (si oui)
  purchased_license_type TEXT DEFAULT 'none' CHECK (purchased_license_type IN ('none', 'daily', 'annual')), -- Type de licence achetée
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Profiles Table (Pour la gestion des rôles de l'application)
-- Fait le lien entre le système de connexion Auth de Supabase et notre base
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'instructor', 'partner', 'student')),
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Instructors Table (Professeurs)
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Lien avec son compte de connexion (optionnel)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Course Types (Type de cours : Wingboost, Débutant, Perfectionnement)
CREATE TABLE IF NOT EXISTS course_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  duration_minutes INTEGER NOT NULL DEFAULT 120,
  color TEXT DEFAULT '#10B981',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Sessions (Les créneaux de cours programmés)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
  course_type_id UUID REFERENCES course_types(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  spot_location TEXT, -- Lieu du cours (ex: La Pelle, Plage des Culs Nus)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Student Credits (Les crédits achetés via Shopify)
CREATE TABLE IF NOT EXISTS student_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  course_type_id UUID REFERENCES course_types(id) ON DELETE CASCADE,
  credits_total INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  shopify_order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Session Participants (Les élèves inscrits à une session)
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'booked' CHECK (status IN ('booked', 'attended', 'no_show', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, customer_id)
);

-- Sécurité : RLS Policies
-- Désactiver RLS temporairement pour simplifier le développement initial
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE instructors DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_credits DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants DISABLE ROW LEVEL SECURITY;
