-- ====================================================================
-- REAL NURSE: SUPABASE INITIAL DATABASE SCHEMA & SEED MIGRATION
-- Supports: Philippine NLE + NCLEX-RN, Spaced Repetition (FSRS),
-- Server-side Mock Exam Timing, RAG Vector Search, and RLS Isolation.
-- ====================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. User Profiles Table (Mirrors Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT DEFAULT 'Nursing Candidate',
  target_exam TEXT DEFAULT 'NCLEX-RN' CHECK (target_exam IN ('NCLEX-RN', 'NLE')),
  exam_date DATE DEFAULT (CURRENT_DATE + INTERVAL '90 days'),
  daily_goal_minutes INTEGER DEFAULT 60,
  streak_days INTEGER DEFAULT 0,
  last_study_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to automatically create a profile when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, target_exam)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Reviewee'),
    COALESCE(NEW.raw_user_meta_data->>'target_exam', 'NCLEX-RN')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Subjects & Topics (Curriculum Taxonomies)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('NLE', 'NCLEX-RN', 'BOTH')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  syllabus_weight NUMERIC DEFAULT 1.0,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Flashcards & Spaced Repetition (FSRS)
CREATE TABLE IF NOT EXISTS public.decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  explanation TEXT,
  mnemonic TEXT,
  -- FSRS specific parameters
  due_date TIMESTAMPTZ DEFAULT NOW(),
  stability NUMERIC DEFAULT 0,
  difficulty NUMERIC DEFAULT 0,
  elapsed_days INTEGER DEFAULT 0,
  scheduled_days INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  state INTEGER DEFAULT 0, -- 0=New, 1=Learning, 2=Review, 3=Relearning
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.review_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 4), -- 1=Again, 2=Hard, 3=Good, 4=Easy
  review_duration_ms INTEGER,
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI Quizzes & Questions
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  difficulty TEXT DEFAULT 'Board-level' CHECK (difficulty IN ('Foundation', 'Board-level', 'Hard NGN')),
  question_count INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  stem TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of strings e.g. ["Option A", "Option B", ...]
  correct_answer_index INTEGER NOT NULL,
  rationale TEXT,
  clinical_tip TEXT,
  difficulty TEXT DEFAULT 'Board-level',
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_items INTEGER NOT NULL,
  answers JSONB NOT NULL, -- Array of user selections
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Mock Exam Simulator (With Server-Side Timing)
CREATE TABLE IF NOT EXISTS public.mock_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('NLE', 'NCLEX-RN')),
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  passing_score_percentage NUMERIC DEFAULT 75.0,
  sections_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mock_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mock_exam_id UUID NOT NULL REFERENCES public.mock_exams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  score_percentage NUMERIC,
  section_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mock_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.mock_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option INTEGER,
  is_correct BOOLEAN,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

-- 7. Daily Tasks & Pomodoro Logs
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  kind TEXT DEFAULT 'read' CHECK (kind IN ('cards', 'read', 'test')),
  link_type TEXT,
  link_id TEXT,
  scheduled_date DATE DEFAULT CURRENT_DATE,
  is_done BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pomodoro_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  mode TEXT DEFAULT 'Focus',
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Document Uploads & RAG Chunks (with pgvector)
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'processing' CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),
  page_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_id UUID NOT NULL REFERENCES public.uploads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  page_number INTEGER DEFAULT 1,
  section_heading TEXT,
  content TEXT NOT NULL,
  embedding VECTOR(768),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector similarity search helper function
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding VECTOR(768),
  match_count INT,
  target_user_id UUID,
  filter_upload_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  upload_id UUID,
  page_number INT,
  section_heading TEXT,
  content TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.upload_id,
    dc.page_number,
    dc.section_heading,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE dc.user_id = target_user_id
    AND (filter_upload_id IS NULL OR dc.upload_id = filter_upload_id)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 9. Community Marketplace
CREATE TABLE IF NOT EXISTS public.shared_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_tag TEXT NOT NULL,
  item_count INTEGER DEFAULT 0,
  rating_avg NUMERIC DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  import_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deck_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shared_deck_id UUID NOT NULL REFERENCES public.shared_decks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shared_deck_id, user_id)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_ratings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Subjects & Topics (Public readable)
CREATE POLICY "Public can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Public can view topics" ON public.topics FOR SELECT USING (true);

-- 3. Decks & Cards
CREATE POLICY "Users can manage own decks" ON public.decks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own cards" ON public.cards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view public decks" ON public.decks FOR SELECT USING (is_public = true);
CREATE POLICY "Users can manage own review logs" ON public.review_logs FOR ALL USING (auth.uid() = user_id);

-- 4. Quizzes & Questions
CREATE POLICY "Users can manage own quizzes" ON public.quizzes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view questions in quizzes" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Users can insert questions" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can manage own quiz attempts" ON public.quiz_attempts FOR ALL USING (auth.uid() = user_id);

-- 5. Mock Exams
CREATE POLICY "Public can view mock exams" ON public.mock_exams FOR SELECT USING (true);
CREATE POLICY "Users can manage own mock attempts" ON public.mock_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own mock answers" ON public.mock_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.mock_attempts WHERE id = attempt_id AND user_id = auth.uid())
);

-- 6. Tasks & Pomodoro
CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own pomodoro logs" ON public.pomodoro_logs FOR ALL USING (auth.uid() = user_id);

-- 7. Uploads & Document Chunks (Strict User Isolation)
CREATE POLICY "Users can manage own uploads" ON public.uploads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own document chunks" ON public.document_chunks FOR ALL USING (auth.uid() = user_id);

-- 8. Community
CREATE POLICY "Public can view shared decks" ON public.shared_decks FOR SELECT USING (true);
CREATE POLICY "Authors can manage shared decks" ON public.shared_decks FOR ALL USING (auth.uid() = author_id);
CREATE POLICY "Users can read deck ratings" ON public.deck_ratings FOR SELECT USING (true);
CREATE POLICY "Users can submit ratings" ON public.deck_ratings FOR ALL USING (auth.uid() = user_id);

-- ====================================================================
-- SEED DATA: PHILIPPINE NLE & NCLEX-RN TAXONOMIES
-- ====================================================================

-- NCLEX-RN Subjects
INSERT INTO public.subjects (id, code, name, exam_type, description) VALUES
  ('11111111-1111-1111-1111-111111111101', 'NCLEX-PHARM', 'Pharmacology & Parenteral Therapies', 'NCLEX-RN', 'Drug calculations, adverse effects, contraindications, and medication rights'),
  ('11111111-1111-1111-1111-111111111102', 'NCLEX-MEDSURG', 'Physiological Adaptation & Med-Surg', 'NCLEX-RN', 'Care for clients with acute, chronic, or life-threatening physical conditions'),
  ('11111111-1111-1111-1111-111111111103', 'NCLEX-MCH', 'Maternal & Child Health', 'NCLEX-RN', 'Antepartum, intrapartum, postpartum, newborn, and pediatric developmental stages'),
  ('11111111-1111-1111-1111-111111111104', 'NCLEX-PSYCH', 'Psychosocial Integrity', 'NCLEX-RN', 'Mental health alterations, crisis intervention, coping mechanisms, and defense mechanisms'),
  ('11111111-1111-1111-1111-111111111105', 'NCLEX-MGMT', 'Management of Care & Prioritization', 'NCLEX-RN', 'Delegation, assignment, ethics, informed consent, triage, and prioritization')
ON CONFLICT (id) DO NOTHING;

-- Philippine NLE Subjects (5 Parts)
INSERT INTO public.subjects (id, code, name, exam_type, description) VALUES
  ('22222222-2222-2222-2222-222222222201', 'NLE-PART1', 'Part I: Foundation of Professional Nursing Practice', 'NLE', 'Nursing jurisprudence, ethics, research, fundamentals of nursing practice, and leadership'),
  ('22222222-2222-2222-2222-222222222202', 'NLE-PART2', 'Part II: Community Health & Maternal-Child Nursing', 'NLE', 'Primary health care, epidemiology, maternal, neonatal, and child health nursing'),
  ('22222222-2222-2222-2222-222222222203', 'NLE-PART3', 'Part III: Care of Clients (Alterations in Oxygenation & Fluid/Electrolytes)', 'NLE', 'Cardiovascular, respiratory, hematologic, fluids and electrolytes, acid-base balance'),
  ('22222222-2222-2222-2222-222222222204', 'NLE-PART4', 'Part IV: Care of Clients (Alterations in Nutrition, Elimination & Metabolism)', 'NLE', 'Gastrointestinal, endocrine, renal, urinary, metabolic disorders, and oncology'),
  ('22222222-2222-2222-2222-222222222205', 'NLE-PART5', 'Part V: Care of Clients with Alterations in Perception & Coordination, Psych', 'NLE', 'Neurologic, musculoskeletal, sensory alterations, acute psychiatry, and crisis intervention')
ON CONFLICT (id) DO NOTHING;

-- Topics for NCLEX-Pharm
INSERT INTO public.topics (subject_id, name, syllabus_weight, order_index) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Cardiac Glycosides & Antiarrhythmics', 1.2, 1),
  ('11111111-1111-1111-1111-111111111101', 'Anticoagulants & Thrombolytics', 1.3, 2),
  ('11111111-1111-1111-1111-111111111101', 'Insulin, Hypoglycemics & Endocrine Agents', 1.1, 3),
  ('11111111-1111-1111-1111-111111111101', 'Psychotropic Medications & Lithium', 1.0, 4)
ON CONFLICT DO NOTHING;

-- Topics for NLE Part 1
INSERT INTO public.topics (subject_id, name, syllabus_weight, order_index) VALUES
  ('22222222-2222-2222-2222-222222222201', 'RA 9173 (Philippine Nursing Act of 2002)', 1.5, 1),
  ('22222222-2222-2222-2222-222222222201', 'Code of Ethics & Patient Rights', 1.2, 2),
  ('22222222-2222-2222-2222-222222222201', 'Basic Nursing Skills & Infection Control', 1.0, 3),
  ('22222222-2222-2222-2222-222222222201', 'Nursing Process & Clinical Documentation', 1.0, 4)
ON CONFLICT DO NOTHING;
