# Real Nurse — Clinical Licensure Prep & AI Mastery Engine

> **Document Version:** 1.0.0  
> **Last Updated:** October 2026  
> **Status:** Active Development (Core Study Platform Complete & Hardened)  
> **Primary Target Exams:** 🇵🇭 Philippine Nurse Licensure Examination (PRC NLE) & 🌐 NCLEX-RN  

---

## 1. App Description & Vision

**Real Nurse** is an intelligent, high-stakes board examination preparation platform engineered specifically for Filipino and international nursing graduates. 

Unlike generic flashcard apps or static question banks, Real Nurse combines **evidence-based cognitive science** with **grounded artificial intelligence** to guide candidates systematically toward the **PRC 75% passing standard** and NCLEX clinical judgment model:

- **Free Spaced Repetition Scheduler (FSRS):** Implements modern spaced-repetition algorithms to guarantee memory retention of critical pharmacology dosages, emergency interventions, and lab values right up to exam day.
- **Backward-Planning Curriculum Engine:** Automatically calculates candidate study schedules backwards from their official PRC or NCLEX exam date, balancing daily hours, rest days, and front-loading high-risk weak areas.
- **Grounded Document Hub & AI Tutor (RAG):** Allows nursing candidates to upload their own nursing school notes, Saunders textbook chapters, or drug handbooks (up to 25 MB) and ask questions that are answered strictly from the text with **exact page-number citations**.
- **Real-Time Board Analytics:** Tracks competency across all 5 PRC NLE parts (Fundamentals, Maternal/Child, Community Health, Med-Surg, Mental Health) and NCLEX Client Needs categories, highlighting borderline (<75%) and critical (<60%) topics for targeted 10-item remediation drills.

---

## 2. Technology Stack & Architecture

| Layer | Technologies & Libraries | Key Responsibilities |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts | Single-page application, custom color design system, responsive candidate UI, client-side FSRS calculations. |
| **Backend API** | Node.js, Express, TypeScript, Multer, Rate Limiting, PDF-Parse | RESTful study endpoints, grounded RAG pipeline, exam taxonomy, document processing. |
| **AI Engine** | Google Gemini 2.5 Flash / Flash-Lite (`@google/generative-ai`) | Document-grounded clinical tutoring, high-yield question generation with rationales, flashcard synthesis. |
| **Database & Auth** | Supabase (PostgreSQL) + In-Memory Fallback Engine | Candidate profiles, document chunks, exam attempt tracking, study history. |
| **Testing** | Vitest (37 Frontend tests + 27 Backend tests = 64 Passing) | Unit testing, FSRS verification, security boundary audits, end-to-end integration. |

---

## 3. Recent Changes & Fixes (Latest Sprint)

### 3.1. Empty Document Library by Default
- **Issue:** New user accounts were seeing pre-populated demo documents (`Saunders Pharm`, `Brunner Endocrine`). Furthermore, when an uploaded file was deleted, it would reappear upon navigating away and returning.
- **Fix:** 
  - Isolated demo documents as background system references in `backend/src/services/rag.service.ts`.
  - Removed fallback mock arrays in `frontend/src/lib/api.ts`.
  - User libraries now start completely empty (`[]`) for newly registered users.
  - Deletions are persisted across sessions and views.

### 3.2. Responsive AI Document Chat
- **Issue:** In the Document AI section, conversational greetings (e.g., "hi", "hello") occasionally timed out or failed to respond warmly.
- **Fix:** Implemented an immediate, warm conversational handler with a quick 3-second timeout and rich clinical fallback that welcomes the student, references their loaded document, and suggests 3 high-yield questions.

### 3.3. Clean Slate Calendar
- **Issue:** The calendar automatically painted every day in the month with purple "Reading" badges even though a new user had not configured or started studying yet.
- **Fix:**
  - Removed the `|| "Reading"` default fallback on cell rendering in `frontend/src/views/Plan.tsx`.
  - Unscheduled days now render cleanly as neutral dates with subtle highlights on `TODAY` and `EXAM`.
  - Added an on-demand **[Generate Study Roadmap]** button that creates the backward plan only when the user requests it.
  - Added a **[Clear Calendar]** button allowing the user to reset all marked days back to clean slate.
  - Clicking an unscheduled day displays an "Unscheduled Slate" with 1-click buttons to schedule individual activities.

### 3.4. Clean Analytics & Zero-State Statistics
- **Issue:** Analytics displayed pre-populated dummy metrics (`1,440 questions answered`, `74% readiness`, `78% mock score`, `184 flashcards`, and fake weak areas) for fresh accounts.
- **Fix:**
  - Updated `backend/src/services/analytics.service.ts` to isolate study attempts by `userId`.
  - Fresh accounts with 0 attempts return true zero metrics (`0` answered, `0%` readiness with a "Diagnostic Needed" pill, `0` flashcards, `0%` mock score).
  - Replaced hardcoded fallback strings in `frontend/src/views/Analytics.tsx` with a **Diagnostic Calibration** banner featuring a 1-click **[Begin 10-Item Diagnostic Drill]** button.
  - Added an empty-state card for Weak Areas and a **[Reset to Clean Slate]** action.

---

## 4. Phase Breakdown & Current Status

```
[Phase 1: Foundation & Auth]              --> COMPLETED ✅
[Phase 2: Core Study Loop (FSRS)]         --> COMPLETED ✅
[Phase 3: Backward-Planning Engine]       --> COMPLETED ✅
[Phase 4: Assessment & Mock Exam Engine]  --> COMPLETED ✅
[Phase 5: Document Hub & Grounded RAG]    --> COMPLETED ✅
[Phase 6: Real Analytics & Mastery Engine]--> COMPLETED ✅
[Phase 7: Community & Peer Sharing]       --> DEFERRED / COMING SOON ⏳
[Phase 8: Progressive Web App / Mobile]   --> DEFERRED / COMING SOON ⏳
[Phase 9: Security Audit & Integration]   --> COMPLETED ✅
```

---

### Detailed Phase Breakdown

#### ✅ Phase 1: Foundation, Design Tokens & Candidate Profile (COMPLETED)
- Custom clinical design system: Deep teal (`#0f4c5c`), Rose text (`#e68fad`), Lavender tint (`#f4eef6`), Clean paper canvas (`#fbf9fc`).
- Candidate authentication flow (Email/password with Supabase integration and robust guest/local fallback).
- Candidate onboarding & profile setup: Target exam (PRC NLE vs NCLEX-RN), official exam date, daily goal minutes, streak tracker.

#### ✅ Phase 2: Core Study Loop & FSRS Flashcards (COMPLETED)
- 4-Tier Free Spaced Repetition Scheduling algorithm (Again, Hard, Good, Easy) adjusting stability and difficulty dynamically.
- Spaced review queue prioritizing overdue cards.
- Interactive flashcard runner with keyboard shortcuts, flip animation, and progress meter.
- Flashcard deck management: Add, edit, delete, tag by clinical subject.

#### ✅ Phase 3: Backward-Planning Study Engine & Calendar (COMPLETED)
- Algorithm engineering study schedules backwards from official board exam date.
- Configurable daily hours (1 to 8 hours/day).
- Flexible rest-day modes (Sundays off, Saturdays off, 7 days continuous, or custom days of the week).
- Front-loading of student's weak subjects in early prep weeks.
- Interactive monthly calendar with single-day overrides, clean zero-state, and on-demand roadmap generation.

#### ✅ Phase 4: Assessment & Board Mock Exam Engine (COMPLETED)
- AI-synthesized NLE & NCLEX multiple-choice items with authentic clinical vignettes, high-distractor choices, and PRC rationales.
- Real-time exam simulation: 3-hour countdown timer, question bookmarking/flagging, question jump palette, pause & resume.
- Comprehensive scoring dashboard evaluating performance against the PRC 75% passing standard (and 60% per-subject condition).

#### ✅ Phase 5: Grounded Document Hub & RAG Engine (COMPLETED)
- Upload clinical notes, drug cards, and textbooks with strict 25 MB file limit.
- In-memory PDF parsing and semantic chunking.
- Grounded AI tutor providing answers with clickable page citations and excerpt verification.
- 1-click synthesis of flashcards and practice quizzes directly from uploaded documents.
- Clean empty library by default for new accounts.

#### ✅ Phase 6: Real Analytics & Mastery Engine (COMPLETED)
- Competency tracking across all 5 PRC NLE parts and NCLEX Client Needs categories.
- Interactive Competency Radar chart visualizing clinical strengths and weaknesses.
- Priority Weak Areas list ranking sub-75% topics needing remediation.
- 1-click targeted remediation drills directly from flagged weak topics.
- Clean zero-state calibration for fresh accounts.

#### ⏳ Phase 7: Community & Peer Sharing (DEFERRED / COMING SOON)
*Per user instruction, this phase is currently placed on hold and designated as "Coming Soon" in the UI:*
- Peer deck exchange and shared student question banks.
- Community upvoting and educator-verified deck badges.
- Study group discussion threads.

#### ⏳ Phase 8: PWA, Offline Caching & Mobile App (DEFERRED / COMING SOON)
*Per user instruction, this phase is currently marked as "Coming Soon":*
- Progressive Web App (PWA) manifest and service worker offline caching.
- Push notifications for daily study reminders and streak preservation.
- Future React Native / App Store mobile app wrapper.

#### ✅ Phase 9: Security Audit, Hardening & Cross-Feature E2E (COMPLETED)
- Rate limiting on heavy AI generation and document embedding endpoints.
- Strict 25 MB payload validation and MIME type verification.
- Cross-feature study loop validation: Weak area in Analytics -> Targeted Drill in Quiz -> Grounded Card in FSRS -> Scheduled Session in Calendar.
- 64 automated Vitest tests passing with 100% test success rate.

---

## 5. Upcoming Milestones & Roadmap (What We're About to Do)

### Milestone 1: Production Deployment & Live Hosting
- Deploy frontend to **Vercel** or **Netlify** with custom domain (e.g., `realnurse.ph` or `realnurse.app`).
- Deploy backend to **Render**, **Railway**, or **Fly.io**.
- Link live cloud **Supabase** project for production database and authentication.

### Milestone 2: Monetization & Payment Gateway Integration
- **Target Market:** Philippine nursing students and NCLEX candidates.
- **Recommended Pricing (in Philippine Pesos):**
  - **Free Tier:** 10 questions/day, 1 document upload (up to 10 MB), basic flashcards.
  - **Pro Monthly:** **₱299 - ₱399 / month** (Affordable student pricing, unlimited AI questions, 25 MB document uploads, full NLE mock exams).
  - **Board Exam Pass (4 Months):** **₱899 - ₱1,199 one-time** (Best value for the 4-month review season leading to May or November NLE).
- **Payment Providers:**
  - **GCash & Maya** integration via **Xendit Philippines** or **PayMongo**.
  - Credit/Debit cards via Stripe or PayMongo.
- **API Cost Control:**
  - Set monthly spending caps in Google Cloud Console for the Gemini API.
  - Implement response caching for common nursing questions to minimize API usage.

### Milestone 3: Content Expansion (PRC NLE Question Bank)
- Curate 2,500+ verified past PRC board exam questions across:
  - *Part 1: Foundation of Nursing Practice*
  - *Part 2: Community Health Nursing & Care of the Mother and Child*
  - *Part 3: Care of Clients with Physiological and Psychosocial Alterations (Part A)*
  - *Part 4: Care of Clients with Physiological and Psychosocial Alterations (Part B)*
  - *Part 5: Care of Clients with Physiological and Psychosocial Alterations (Part C)*

---

## 6. Verification Status

```bash
# Frontend Test Suite: 10 test files, 37 passed
npm test (frontend) -> 37 passed (100%)

# Backend Test Suite: 6 test files, 27 passed
npm test (backend)  -> 27 passed (100%)

# Total Automated Tests: 64 passed
```
