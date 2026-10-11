import { useEffect, useState, useRef } from "react";
import {
  RotateCw,
  Plus,
  Layers,
  Check,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Calendar,
  X,
  UploadCloud,
  FileText,
  Trash2,
  FolderOpen,
  AlertCircle,
} from "lucide-react";
import { Card, PageHead, Pill, Bar, Btn } from "../ui";
import {
  computeNextIntervals,
  applyCardReview,
  createNewCard,
  type CardRating,
} from "../lib/srs";
import {
  fetchStudyDocuments,
  uploadStudyDocument,
  generateFlashcardsFromDoc,
  StudyDocument,
} from "../lib/api";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Card as FSRSCard } from "ts-fsrs";

export interface FlashcardItem {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  explanation?: string;
  mnemonic?: string;
  fsrsCard: FSRSCard;
}

export interface DeckItem {
  id: string;
  title: string;
  category: string;
  exam: "NCLEX-RN" | "NLE" | "BOTH";
  description: string;
  cards: FlashcardItem[];
}

const initialDecks: DeckItem[] = [
  {
    id: "deck-pharm-1",
    title: "Pharmacology: Cardiac & Emergency Drugs",
    category: "Pharmacology",
    exam: "BOTH",
    description: "Inotropes, beta-blockers, antiarrhythmics, toxicity benchmarks, and emergency antidotes.",
    cards: [
      {
        id: "c-1",
        deck_id: "deck-pharm-1",
        front: "What is the specific antidote for heparin sodium overdose?",
        back: "Protamine sulfate. Administer slowly via IV (1 mg neutralizes ~100 units of heparin). Monitor aPTT (target: 1.5–2.5× control).",
        explanation: "Protamine is a strongly basic protein that binds strongly acidic heparin to form an inactive salt.",
        mnemonic: "Heparin -> Protamine (H & P are alphabetical neighbors)",
        fsrsCard: createNewCard(),
      },
      {
        id: "c-2",
        deck_id: "deck-pharm-1",
        front: "Early clinical manifestations of Digoxin toxicity?",
        back: "GI disturbances (anorexia, nausea, vomiting) followed by neurological changes (yellow-green visual halos, blurred vision).",
        explanation: "Always assess apical pulse for 1 full minute prior to administration. Hold if < 60 bpm in adults. Hypokalemia drastically increases toxicity risk.",
        mnemonic: "EARLY signs are gut-first (N/V), LATE signs are eye-halos.",
        fsrsCard: createNewCard(),
      },
      {
        id: "c-3",
        deck_id: "deck-pharm-1",
        front: "First-line emergency pharmacotherapy for acute anaphylactic shock?",
        back: "Intramuscular Epinephrine (1:1000, 0.3–0.5 mg) administered immediately into the anterolateral mid-thigh.",
        explanation: "Alpha-1 vasoconstriction reverses hypotension; Beta-2 stimulation bronchodilates airways. Repeat q5-15 min if unresolving.",
        mnemonic: "Epi in the thigh saves a life",
        fsrsCard: createNewCard(),
      },
      {
        id: "c-4",
        deck_id: "deck-pharm-1",
        front: "Normal serum potassium range & critical ECG sign of hyperkalemia?",
        back: "3.5 – 5.0 mEq/L. Earliest ECG indicator: Tall, peaked T waves (progressing to widened QRS and sinusoidal rhythm).",
        explanation: "Treat severe hyperkalemia immediately with IV Calcium Gluconate (membrane stabilizer), followed by Regular Insulin + D50W, and Kayexalate or Albuterol.",
        mnemonic: "Peaked T = High K+",
        fsrsCard: createNewCard(),
      },
      {
        id: "c-5",
        deck_id: "deck-pharm-1",
        front: "Priority drug for preeclampsia seizure prophylaxis & toxicity antidote?",
        back: "Magnesium Sulfate (IV). Antidote for toxicity is 10% Calcium Gluconate (IV push).",
        explanation: "Monitor: deep tendon reflexes (patellar) present, respirations ≥ 12/min, and urine output ≥ 30 mL/hr.",
        mnemonic: "BURP = BP stable, Urine >30, Resp >12, Patellar reflex intact.",
        fsrsCard: createNewCard(),
      },
    ],
  },
  {
    id: "deck-nle-law",
    title: "Philippine Nursing Jurisprudence & RA 9173",
    category: "Nursing Practice & Jurisprudence",
    exam: "NLE",
    description: "Philippine Nursing Act of 2002, BON resolutions, malpractice, legal doctrines, and ethical codes.",
    cards: [
      {
        id: "c-6",
        deck_id: "deck-nle-law",
        front: "Under RA 9173, what is the composition of the Professional Regulatory Board of Nursing (BON)?",
        back: "One (1) Chairperson and six (6) Members appointed by the President of the Philippines from a PRC shortlist.",
        explanation: "Qualifications: Natural born citizen, Registered Nurse, Master's degree in Nursing, at least 10 years of nursing practice.",
        fsrsCard: createNewCard(),
      },
      {
        id: "c-7",
        deck_id: "deck-nle-law",
        front: "Define Res Ipsa Loquitur and provide a classic clinical nursing example.",
        back: "Literally 'The thing speaks for itself'. The injury would not have occurred without negligence (e.g. surgical sponge left in client's abdomen).",
        explanation: "Shifts the burden of proof to the defendant to prove they were not negligent.",
        fsrsCard: createNewCard(),
      },
      {
        id: "c-8",
        deck_id: "deck-nle-law",
        front: "Doctrine of Respondeat Superior in nursing practice?",
        back: "'Let the master answer' - The hospital or employer is liable for the negligent acts of employees acting within the scope of their employment.",
        explanation: "Does not relieve the individual nurse of personal civil liability.",
        fsrsCard: createNewCard(),
      },
    ],
  },
  {
    id: "deck-medsurg-fluids",
    title: "Fluid, Electrolyte & Acid-Base Imbalances",
    category: "Physiological Integrity",
    exam: "BOTH",
    description: "ABG ROME analysis, metabolic acidosis, hyponatremia, hypercalcemia, and IV solution osmolarity.",
    cards: [
      {
        id: "c-9",
        deck_id: "deck-medsurg-fluids",
        front: "ROME mnemonic for Arterial Blood Gas (ABG) analysis?",
        back: "Respiratory Opposite (pH and PaCO2 move in opposite directions), Metabolic Equal (pH and HCO3 move in same direction).",
        explanation: "Normal ranges: pH 7.35–7.45, PaCO2 35–45 mmHg, HCO3 22–26 mEq/L.",
        mnemonic: "R-O-M-E",
        fsrsCard: createNewCard(),
      },
      {
        id: "c-10",
        deck_id: "deck-medsurg-fluids",
        front: "Clinical indicators of Hypocalcemia: Chvostek's & Trousseau's signs?",
        back: "Chvostek: Facial muscle twitching upon tapping facial nerve. Trousseau: Carpopedal spasm induced by inflating BP cuff above systolic for 3 min.",
        explanation: "Ca < 8.5 mg/dL. Also causes prolonged QT interval, tetany, and laryngeal spasms.",
        mnemonic: "C = Cheek (Chvostek), T = Tourniquet / BP cuff (Trousseau)",
        fsrsCard: createNewCard(),
      },
    ],
  },
];

interface FlashcardsProps {
  go?: (v: string) => void;
}

export default function Flashcards({ go }: FlashcardsProps) {
  const { user } = useAuth();
  const [decks, setDecks] = useState<DeckItem[]>(() => {
    const saved = localStorage.getItem("real_nurse_decks");
    return saved ? JSON.parse(saved) : initialDecks;
  });

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState<Record<CardRating, number>>({
    Again: 0,
    Hard: 0,
    Good: 0,
    Easy: 0,
  });

  // Modal for creating custom deck / cards
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newExplanation, setNewExplanation] = useState("");
  const [newMnemonic, setNewMnemonic] = useState("");

  // Document file-based custom deck creation
  const [showDocDeckModal, setShowDocDeckModal] = useState(false);
  const [docs, setDocs] = useState<StudyDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckCategory, setNewDeckCategory] = useState("Pharmacology");
  const [newDeckExam, setNewDeckExam] = useState<"NCLEX-RN" | "NLE" | "BOTH">("BOTH");
  const [newDeckCardCount, setNewDeckCardCount] = useState(8);
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load study documents & check if Documents Hub passed a deck to open
  useEffect(() => {
    loadUserDocs();

    const targetDeckId = sessionStorage.getItem("new_deck_to_open");
    if (targetDeckId) {
      const saved = localStorage.getItem("real_nurse_decks");
      const currentList = saved ? JSON.parse(saved) : decks;
      if (saved) setDecks(currentList);
      const match = currentList.find((d: DeckItem) => d.id === targetDeckId);
      if (match) {
        startStudying(targetDeckId);
      }
      sessionStorage.removeItem("new_deck_to_open");
    }
  }, []);

  const loadUserDocs = async () => {
    try {
      const list = await fetchStudyDocuments();
      setDocs(list);
      if (list.length > 0 && !selectedDocId) {
        setSelectedDocId(list[0].id);
        setNewDeckTitle(list[0].filename.replace(/\.[^/.]+$/, ""));
      }
    } catch (err) {
      console.warn("Failed to load documents in Flashcards:", err);
    }
  };

  const handleFileUploadForDeck = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setDeckError(null);

    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setDeckError(
        `File "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB, exceeding the 25 MB limit.`
      );
      return;
    }

    setIsUploadingFile(true);
    try {
      const newDoc = await uploadStudyDocument(file, user?.id);
      setDocs((prev) => [newDoc, ...prev]);
      setSelectedDocId(newDoc.id);
      setNewDeckTitle(newDoc.filename.replace(/\.[^/.]+$/, ""));
    } catch (err: any) {
      setDeckError(err.message || "Failed to upload document.");
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerateDeckFromFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId) {
      setDeckError("Please select or upload a document first.");
      return;
    }

    const doc = docs.find((d) => d.id === selectedDocId);
    if (!doc) return;

    setDeckError(null);
    setIsGeneratingDeck(true);

    try {
      const generatedCards = await generateFlashcardsFromDoc(selectedDocId, newDeckCardCount);
      if (!generatedCards || generatedCards.length === 0) {
        throw new Error("No flashcards could be extracted from this document.");
      }

      const deckId = `deck-custom-${Date.now()}`;
      const title = newDeckTitle.trim() || doc.filename.replace(/\.[^/.]+$/, "");

      const formattedCards: FlashcardItem[] = generatedCards.map((c, i) => ({
        id: `card-${Date.now()}-${i}`,
        deck_id: deckId,
        front: c.front,
        back: c.back,
        explanation: c.pageNumber ? `Source: ${doc.filename} (Page ${c.pageNumber})` : `Grounded in ${doc.filename}`,
        fsrsCard: createNewCard(),
      }));

      const newDeck: DeckItem = {
        id: deckId,
        title,
        category: newDeckCategory,
        exam: newDeckExam,
        description: `Custom deck synthesized from ${doc.filename} (${doc.pageCount} pages).`,
        cards: formattedCards,
      };

      const updated = [newDeck, ...decks];
      saveDecks(updated);
      setShowDocDeckModal(false);
      startStudying(deckId);
    } catch (err: any) {
      setDeckError(err.message || "Failed to generate deck from file.");
    } finally {
      setIsGeneratingDeck(false);
    }
  };

  const handleDeleteDeck = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom deck?")) return;
    const updated = decks.filter((d) => d.id !== deckId);
    saveDecks(updated);
    if (activeDeckId === deckId) {
      setActiveDeckId(null);
    }
  };

  const activeDeck = decks.find((d) => d.id === activeDeckId) || null;
  const cards = activeDeck?.cards || [];
  const currentCard = cards[cardIndex] || null;
  const isFinished = activeDeck && cardIndex >= cards.length;

  // Compute real-time FSRS intervals for current card
  const nextIntervals = currentCard
    ? computeNextIntervals(currentCard.fsrsCard)
    : null;

  // Persist decks changes
  const saveDecks = (updated: DeckItem[]) => {
    setDecks(updated);
    localStorage.setItem("real_nurse_decks", JSON.stringify(updated));
  };

  const startStudying = (deckId: string) => {
    setActiveDeckId(deckId);
    setCardIndex(0);
    setFlipped(false);
    setTally({ Again: 0, Hard: 0, Good: 0, Easy: 0 });
  };

  const handleRate = async (rating: CardRating) => {
    if (!currentCard || !activeDeck) return;

    // Apply FSRS review mathematics
    const reviewResult = applyCardReview(currentCard.fsrsCard, rating);
    const updatedCardItem: FlashcardItem = {
      ...currentCard,
      fsrsCard: reviewResult.card,
    };

    // Update in decks state
    const updatedDecks = decks.map((d) => {
      if (d.id === activeDeck.id) {
        return {
          ...d,
          cards: d.cards.map((c) => (c.id === currentCard.id ? updatedCardItem : c)),
        };
      }
      return d;
    });

    saveDecks(updatedDecks);

    // Record review log in Supabase if logged in
    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("review_logs").insert({
          user_id: user.id,
          card_id: currentCard.id.length === 36 ? currentCard.id : undefined,
          rating: rating === "Again" ? 1 : rating === "Hard" ? 2 : rating === "Good" ? 3 : 4,
          reviewed_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Failed to log review to Supabase:", err);
      }
    }

    setTally((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));
    setFlipped(false);
    setCardIndex((idx) => idx + 1);
  };

  // Keyboard controls: Space to flip, 1-4 to rate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeDeck || isFinished) return;

      if (e.code === "Space") {
        e.preventDefault();
        setFlipped((f) => !f);
      }

      if (flipped) {
        if (e.key === "1") handleRate("Again");
        if (e.key === "2") handleRate("Hard");
        if (e.key === "3") handleRate("Good");
        if (e.key === "4") handleRate("Easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDeck, isFinished, flipped, cardIndex]);

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeck || !newFront.trim() || !newBack.trim()) return;

    const newCard: FlashcardItem = {
      id: "card-" + Date.now(),
      deck_id: activeDeck.id,
      front: newFront.trim(),
      back: newBack.trim(),
      explanation: newExplanation.trim() || undefined,
      mnemonic: newMnemonic.trim() || undefined,
      fsrsCard: createNewCard(),
    };

    const updated = decks.map((d) =>
      d.id === activeDeck.id ? { ...d, cards: [...d.cards, newCard] } : d
    );

    saveDecks(updated);
    setNewFront("");
    setNewBack("");
    setNewExplanation("");
    setNewMnemonic("");
    setShowAddCardModal(false);
  };

  // 1. Deck Directory View (When no deck is active)
  if (!activeDeck) {
    return (
      <div className="rise space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <PageHead
            eyebrow="Spaced Repetition System (FSRS)"
            title="Clinical Flashcard Decks"
            sub="Review high-yield clinical facts, drug dosages, and nursing jurisprudence. FSRS adapts return intervals based on your recall accuracy."
          />

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Btn
              onClick={() => {
                setDeckError(null);
                setShowDocDeckModal(true);
              }}
              className="py-2.5 px-4 text-xs font-bold shadow-sm"
            >
              <Sparkles size={14} /> Create Deck from File
            </Btn>

            {go && (
              <Btn
                variant="soft"
                onClick={() => go("docs")}
                className="py-2.5 px-3.5 text-xs font-semibold"
              >
                <FolderOpen size={14} /> Document Hub
              </Btn>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => {
            const isCustom = d.id.startsWith("deck-custom-") || d.description.includes("synthesized") || d.description.includes("Custom");
            return (
              <Card key={d.id} className="p-7 flex flex-col justify-between hover:shadow-md transition-shadow relative group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Pill tone={d.exam === "NLE" ? "amber" : "teal"}>{d.exam} Exam</Pill>
                      {isCustom && <Pill tone="rose">📄 Grounded</Pill>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink-soft flex items-center gap-1.5">
                        <Layers size={13} className="text-rosetext" /> {d.cards.length} cards
                      </span>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDeck(d.id, e)}
                          title="Delete Deck"
                          className="size-6 rounded-full hover:bg-danger/10 text-ink-soft hover:text-danger grid place-items-center transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold font-display leading-snug">{d.title}</h3>
                  <p className="mt-2 text-xs font-medium text-rosetext">{d.category}</p>
                  <p className="mt-2 text-sm text-ink-soft leading-relaxed">{d.description}</p>
                </div>

                <div className="mt-6 pt-5 border-t border-line flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-soft">
                    {d.cards.length} cards in deck
                  </span>
                  <Btn onClick={() => startStudying(d.id)} className="px-5 py-2 text-xs">
                    Study Deck
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Modal: Create Deck from Uploaded File */}
        {showDocDeckModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
            <Card className="w-full max-w-lg p-6 sm:p-8 bg-white relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowDocDeckModal(false)}
                className="absolute top-5 right-5 size-8 rounded-full bg-lav hover:bg-lav-deep grid place-items-center text-ink-soft"
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-2.5 mb-2">
                <div className="size-9 rounded-xl bg-teal-tint text-rosetext grid place-items-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-ink">Create Deck from Uploaded File</h3>
                  <p className="text-xs text-ink-soft">Synthesize FSRS spaced repetition cards from your study files</p>
                </div>
              </div>

              {deckError && (
                <div className="my-4 p-3.5 rounded-xl bg-[#ffdad6] border border-danger/30 text-danger text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{deckError}</span>
                </div>
              )}

              <form onSubmit={handleGenerateDeckFromFile} className="space-y-4 mt-4">
                {/* Upload or select file */}
                <div>
                  <label className="block text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">
                    Study Document Source
                  </label>

                  {/* Direct upload row */}
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed border-teal/60 bg-teal-tint/40 mb-3">
                    <div className="flex items-center gap-2.5">
                      <UploadCloud size={18} className="text-rosetext shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-ink">Upload new document</p>
                        <p className="text-[11px] text-ink-soft">PDF or TXT up to 25 MB</p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.md"
                      className="hidden"
                      onChange={(e) => handleFileUploadForDeck(e.target.files)}
                    />
                    <Btn
                      type="button"
                      variant="soft"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFile}
                      className="text-xs font-semibold py-1.5 px-3"
                    >
                      {isUploadingFile ? "Processing…" : "Choose File"}
                    </Btn>
                  </div>

                  {docs.length === 0 ? (
                    <div className="p-4 rounded-xl border border-line bg-canvas text-center text-xs text-ink-soft">
                      No files uploaded yet. Click "Choose File" above to upload your first study material.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {docs.map((doc) => {
                        const isChosen = selectedDocId === doc.id;
                        return (
                          <div
                            key={doc.id}
                            onClick={() => {
                              setSelectedDocId(doc.id);
                              if (!newDeckTitle || newDeckTitle === "Custom Deck") {
                                setNewDeckTitle(doc.filename.replace(/\.[^/.]+$/, ""));
                              }
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${
                              isChosen
                                ? "border-teal bg-teal-tint/30 ring-2 ring-teal shadow-2xs font-bold text-ink"
                                : "border-line bg-canvas hover:bg-lav text-ink-soft"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <FileText size={15} className="shrink-0 text-rosetext" />
                              <span className="text-xs truncate">{doc.filename}</span>
                            </div>
                            <span className="text-[11px] opacity-75 shrink-0">{doc.pageCount} pgs</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Deck Title */}
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1">Deck Title</label>
                  <input
                    required
                    type="text"
                    value={newDeckTitle}
                    onChange={(e) => setNewDeckTitle(e.target.value)}
                    placeholder="e.g. Digoxin & Cardiac Pharmacology"
                    className="w-full rounded-2xl border border-line bg-canvas p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                  />
                </div>

                {/* Category & Exam */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1">Category</label>
                    <select
                      value={newDeckCategory}
                      onChange={(e) => setNewDeckCategory(e.target.value)}
                      className="w-full rounded-2xl border border-line bg-canvas p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    >
                      <option value="Pharmacology">Pharmacology</option>
                      <option value="Physiological Integrity">Med-Surg / Fluids</option>
                      <option value="Maternal & Child">Maternal & Child</option>
                      <option value="Psychiatric Nursing">Psychiatric</option>
                      <option value="Nursing Practice & Jurisprudence">Jurisprudence & Ethics</option>
                      <option value="Fundamentals">Fundamentals</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1">Target Exam</label>
                    <select
                      value={newDeckExam}
                      onChange={(e) => setNewDeckExam(e.target.value as any)}
                      className="w-full rounded-2xl border border-line bg-canvas p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                    >
                      <option value="BOTH">Both (NLE & NCLEX)</option>
                      <option value="NLE">Philippine NLE</option>
                      <option value="NCLEX-RN">US NCLEX-RN</option>
                    </select>
                  </div>
                </div>

                {/* Card Count Selector */}
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">Cards to Synthesize</label>
                  <div className="flex gap-2">
                    {[5, 8, 12, 15].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setNewDeckCardCount(cnt)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                          newDeckCardCount === cnt
                            ? "bg-teal text-ink border-teal font-bold"
                            : "bg-canvas border-line text-ink-soft hover:bg-lav"
                        }`}
                      >
                        {cnt} Cards
                      </button>
                    ))}
                  </div>
                </div>

                <Btn
                  type="submit"
                  disabled={isGeneratingDeck || !selectedDocId}
                  className="w-full py-3.5 mt-2 text-xs font-bold"
                >
                  <Sparkles size={15} />
                  {isGeneratingDeck
                    ? "Synthesizing Flashcards with Clinical Rationales…"
                    : `Synthesize ${newDeckCardCount} Cards with Gemini AI`}
                </Btn>
              </form>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // 2. Study Session Complete View
  if (isFinished) {
    const totalReviewed = tally.Again + tally.Hard + tally.Good + tally.Easy;
    const retentionRate = totalReviewed > 0 ? Math.round(((tally.Good + tally.Easy) / totalReviewed) * 100) : 100;

    return (
      <div className="rise max-w-2xl mx-auto">
        <PageHead
          eyebrow="Review Session Concluded"
          title={activeDeck.title}
          sub="Your card retention stability has been recalculated using the FSRS engine."
        />

        <Card className="p-10 md:p-12 text-center">
          <div className="size-16 rounded-full bg-teal-tint text-rosetext mx-auto grid place-items-center mb-5">
            <Sparkles size={28} />
          </div>

          <h2 className="text-2xl md:text-3xl font-bold font-display">Deck Completed!</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Accuracy: <b className="text-rosetext">{retentionRate}%</b> retention rate this session.
          </p>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="rounded-2xl p-4 bg-[#ffdad6] text-[#93000a]">
              <p className="text-2xl font-bold font-display">{tally.Again}</p>
              <p className="text-xs font-semibold mt-1">Again</p>
            </div>
            <div className="rounded-2xl p-4 bg-[#ffe8cf] text-[#8d4b00]">
              <p className="text-2xl font-bold font-display">{tally.Hard}</p>
              <p className="text-xs font-semibold mt-1">Hard</p>
            </div>
            <div className="rounded-2xl p-4 bg-lav text-indigo">
              <p className="text-2xl font-bold font-display">{tally.Good}</p>
              <p className="text-xs font-semibold mt-1">Good</p>
            </div>
            <div className="rounded-2xl p-4 bg-teal-tint text-rosetext">
              <p className="text-2xl font-bold font-display">{tally.Easy}</p>
              <p className="text-xs font-semibold mt-1">Easy</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Btn onClick={() => startStudying(activeDeck.id)} className="px-6">
              Restart Review
            </Btn>
            <Btn variant="ghost" onClick={() => setActiveDeckId(null)}>
              Return to All Decks
            </Btn>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Active Card-Flip Study Mode
  return (
    <div className="rise max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveDeckId(null)}
          className="text-xs font-semibold text-ink-soft hover:text-ink flex items-center gap-1.5 transition-colors"
        >
          <ChevronLeft size={16} /> All Decks
        </button>

        <button
          onClick={() => setShowAddCardModal(true)}
          className="text-xs font-semibold text-rosetext flex items-center gap-1 hover:underline"
        >
          <Plus size={14} /> Add Card to Deck
        </button>
      </div>

      <PageHead
        eyebrow="Spaced Repetition"
        title={activeDeck.title}
        sub="Recall the clinical intervention or rationales, flip to confirm, then rate with 1–4 keys."
      />

      {/* Progress Bar & Counter */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Bar value={((cardIndex + 1) / cards.length) * 100} />
        </div>
        <span className="text-xs font-bold text-ink-soft">
          {cardIndex + 1} / {cards.length}
        </span>
      </div>

      {/* 3D Flip Card Scene */}
      <div className="flip-scene">
        <button
          onClick={() => setFlipped(!flipped)}
          className={`flip-card ${
            flipped ? "flipped" : ""
          } relative block w-full min-h-[22rem] md:min-h-[25rem] text-left cursor-pointer`}
          aria-label="Flip card"
        >
          {/* Front Face */}
          <div className="flip-face absolute inset-0 rounded-[2rem] bg-white border border-line shadow-[0_30px_60px_-30px_rgba(19,27,46,.15)] p-8 md:p-12 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <Pill tone="teal">Question</Pill>
              <span className="text-xs font-medium text-ink-soft">FSRS Rep #{currentCard?.fsrsCard.reps || 0}</span>
            </div>

            <p className="my-6 text-center font-display text-xl sm:text-2xl md:text-3xl font-bold leading-snug text-ink">
              {currentCard?.front}
            </p>

            <span className="self-center text-xs font-semibold text-ink-soft flex items-center gap-2">
              <RotateCw size={12} className="text-rosetext" /> Tap card or press Space to reveal answer
            </span>
          </div>

          {/* Back Face */}
          <div className="flip-face flip-back absolute inset-0 rounded-[2rem] bg-teal text-ink p-8 md:p-12 flex flex-col justify-between shadow-[0_30px_60px_-30px_rgba(230,143,173,.5)]">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-rosetext">
                Clinical Answer
              </span>
              {currentCard?.mnemonic && (
                <span className="text-xs font-bold text-ink-soft bg-white/40 px-2.5 py-0.5 rounded-full">
                  Mnemonic: {currentCard.mnemonic}
                </span>
              )}
            </div>

            <div className="my-4 text-center">
              <p className="text-base sm:text-lg md:text-xl font-bold leading-relaxed">
                {currentCard?.back}
              </p>
              {currentCard?.explanation && (
                <p className="mt-3 text-xs sm:text-sm text-ink-soft bg-white/40 p-3 rounded-2xl leading-relaxed">
                  <b>Rationale: </b>
                  {currentCard.explanation}
                </p>
              )}
            </div>

            <span className="self-center text-xs font-semibold text-ink-soft">
              Rate your recall difficulty below to schedule next review
            </span>
          </div>
        </button>
      </div>

      {/* 4 Standard FSRS Rating Buttons with Dynamic Interval Previews */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 transition-opacity duration-300 ${
          flipped ? "opacity-100" : "opacity-35 pointer-events-none"
        }`}
      >
        <button
          onClick={() => handleRate("Again")}
          className="rounded-2xl py-3.5 px-3 bg-[#ffdad6] text-[#93000a] hover:bg-[#ffc5bf] transition-colors text-center"
        >
          <span className="block font-bold text-sm">Again</span>
          <span className="block text-xs opacity-80 mt-0.5">
            {nextIntervals?.Again.label || "< 1m"} · key 1
          </span>
        </button>

        <button
          onClick={() => handleRate("Hard")}
          className="rounded-2xl py-3.5 px-3 bg-[#ffe8cf] text-[#8d4b00] hover:bg-[#ffdcbd] transition-colors text-center"
        >
          <span className="block font-bold text-sm">Hard</span>
          <span className="block text-xs opacity-80 mt-0.5">
            {nextIntervals?.Hard.label || "10m"} · key 2
          </span>
        </button>

        <button
          onClick={() => handleRate("Good")}
          className="rounded-2xl py-3.5 px-3 bg-lav text-indigo hover:bg-lav-deep transition-colors text-center"
        >
          <span className="block font-bold text-sm">Good</span>
          <span className="block text-xs opacity-80 mt-0.5">
            {nextIntervals?.Good.label || "1d"} · key 3
          </span>
        </button>

        <button
          onClick={() => handleRate("Easy")}
          className="rounded-2xl py-3.5 px-3 bg-teal-tint text-rosetext hover:bg-[#f9d3e0] transition-colors text-center"
        >
          <span className="block font-bold text-sm">Easy</span>
          <span className="block text-xs opacity-80 mt-0.5">
            {nextIntervals?.Easy.label || "4d"} · key 4
          </span>
        </button>
      </div>

      {/* Add Card Modal */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg p-6 sm:p-8 bg-white relative">
            <button
              onClick={() => setShowAddCardModal(false)}
              className="absolute top-5 right-5 size-8 rounded-full bg-lav hover:bg-lav-deep grid place-items-center text-ink-soft"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <h3 className="font-display font-bold text-xl mb-4">Add Flashcard to {activeDeck.title}</h3>

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Question / Prompt (Front)</label>
                <textarea
                  required
                  rows={3}
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="e.g. Signs of Lithium toxicity and critical blood level?"
                  className="w-full rounded-2xl border border-line bg-canvas p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Answer / Intervention (Back)</label>
                <textarea
                  required
                  rows={3}
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="e.g. Nausea, tremors, ataxia, confusion. Toxic level > 1.5 mEq/L."
                  className="w-full rounded-2xl border border-line bg-canvas p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Clinical Explanation / Rationale (Optional)</label>
                <input
                  type="text"
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="e.g. Encourage adequate fluid and sodium intake."
                  className="w-full rounded-2xl border border-line bg-canvas p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">Mnemonic (Optional)</label>
                <input
                  type="text"
                  value={newMnemonic}
                  onChange={(e) => setNewMnemonic(e.target.value)}
                  placeholder="e.g. L-I-T-H"
                  className="w-full rounded-2xl border border-line bg-canvas p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <Btn type="submit" className="w-full py-3 mt-2">
                Save Card to Deck
              </Btn>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
