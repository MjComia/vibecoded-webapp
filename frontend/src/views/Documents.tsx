import { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  Send,
  Sparkles,
  Layers,
  ListChecks,
  AlertCircle,
  Bookmark,
  CheckCircle2,
  Trash2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Card, PageHead, Btn, Pill } from "../ui";
import {
  fetchStudyDocuments,
  uploadStudyDocument,
  fetchDocumentDetails,
  askDocumentQuestion,
  generateFlashcardsFromDoc,
  generateQuizFromDoc,
  deleteStudyDocument,
  StudyDocument,
  DocumentDetails,
  ChatCitation,
} from "../lib/api";
import { createNewCard } from "../lib/srs";
import { useAuth } from "../context/AuthContext";

interface ChatMessage {
  me: boolean;
  text: string;
  citations?: ChatCitation[];
  timestamp?: string;
}

interface DocumentsProps {
  go?: (v: string) => void;
}

export default function Documents({ go }: DocumentsProps) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<StudyDocument[]>([]);
  const [curIndex, setCurIndex] = useState(0);
  const [docDetails, setDocDetails] = useState<DocumentDetails | null>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Chat State
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    {
      me: false,
      text: "Hello! I am your AI Clinical Study Assistant. Ask me anything about this document, and I will answer grounded strictly in its contents with exact page citations.",
    },
  ]);
  const [query, setQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Generation Feedback States
  const [generatingType, setGeneratingType] = useState<"flashcards" | "quiz" | null>(null);
  const [generationResult, setGenerationResult] = useState<{
    type: "flashcards" | "quiz";
    count: number;
    items: any[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial document list
  useEffect(() => {
    loadDocuments();
  }, [user?.id]);

  const loadDocuments = async () => {
    const list = await fetchStudyDocuments(user?.id);
    setDocs(list);
    if (list.length > 0) {
      setCurIndex(0);
      loadDocDetails(list[0].id);
      setMsgs([
        {
          me: false,
          text: `👋 Hello! I am your Real Nurse AI Study Tutor. I'm currently loaded with "${list[0].filename}". Ask me anything about this document, and I will cite exact page numbers!`,
        },
      ]);
    } else {
      setDocDetails(null);
      setMsgs([
        {
          me: false,
          text: "Welcome to Real Nurse AI Study Hub! Upload your nursing review notes, textbook chapters, or clinical drug cards to ask questions with exact page citations and generate practice drills.",
        },
      ]);
    }
  };

  const loadDocDetails = async (id: string) => {
    const details = await fetchDocumentDetails(id);
    setDocDetails(details);
  };

  const handleSelectDoc = (index: number) => {
    setCurIndex(index);
    setGenerationResult(null);
    if (docs[index]) {
      loadDocDetails(docs[index].id);
      setMsgs([
        {
          me: false,
          text: `Now studying ${docs[index].filename}. Ask questions about this specific document, and I'll cite exact page numbers.`,
        },
      ]);
    }
  };

  // Upload handler with strict 25 MB file size limit
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadError(null);

    // 25 MB Limit check
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(
        `File "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB, exceeding the 25 MB limit. Please upload a specific chapter or smaller file.`
      );
      return;
    }

    setUploading(true);
    try {
      const newDoc = await uploadStudyDocument(file, user?.id);
      const updatedList = [newDoc, ...docs.filter((d) => d.id !== newDoc.id)];
      setDocs(updatedList);
      setCurIndex(0);
      await loadDocDetails(newDoc.id);
      setMsgs([
        {
          me: false,
          text: `Successfully extracted and vectorized "${newDoc.filename}" (${newDoc.pageCount} pages). You can now ask questions, generate flashcards, or create a quiz drill!`,
        },
      ]);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload document. Please ensure it is a readable PDF.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to remove this document from your study hub?")) return;
    await deleteStudyDocument(id, user?.id);
    const remaining = docs.filter((d) => d.id !== id);
    setDocs(remaining);
    if (remaining.length > 0) {
      handleSelectDoc(0);
    } else {
      setDocDetails(null);
      setCurIndex(0);
      setMsgs([
        {
          me: false,
          text: "Document removed. Upload a new nursing textbook or handout to begin a new grounded study session.",
        },
      ]);
    }
  };

  // Grounded Chat submission
  const handleAsk = async (customQuestion?: string) => {
    const qText = customQuestion || query.trim();
    if (!qText || isAsking || !currentDoc) return;

    setQuery("");
    setIsAsking(true);
    setMsgs((prev) => [...prev, { me: true, text: qText }]);

    try {
      const response = await askDocumentQuestion(currentDoc.id, qText);
      setMsgs((prev) => [
        ...prev,
        {
          me: false,
          text: response.answer,
          citations: response.citations,
        },
      ]);
    } catch {
      setMsgs((prev) => [
        ...prev,
        {
          me: false,
          text: "An error occurred retrieving information from the document. Please try again.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  // One-click generators
  const handleGenerateFlashcards = async () => {
    if (!currentDoc || generatingType) return;
    setGeneratingType("flashcards");
    try {
      const cards = await generateFlashcardsFromDoc(currentDoc.id, 8);
      setGenerationResult({
        type: "flashcards",
        count: cards.length,
        items: cards,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!currentDoc || generatingType) return;
    setGeneratingType("quiz");
    try {
      const questions = await generateQuizFromDoc(currentDoc.id, 5);
      setGenerationResult({
        type: "quiz",
        count: questions.length,
        items: questions,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleSaveDeckAndStudy = () => {
    if (!currentDoc || !generationResult || generationResult.type !== "flashcards") return;
    const deckId = `deck-custom-${Date.now()}`;
    const newCards = generationResult.items.map((c: any, i: number) => ({
      id: `card-${Date.now()}-${i}`,
      deck_id: deckId,
      front: c.front,
      back: c.back,
      explanation: c.pageNumber ? `Source: ${currentDoc.filename} (Page ${c.pageNumber})` : `Grounded in ${currentDoc.filename}`,
      fsrsCard: createNewCard(),
    }));

    const newDeck = {
      id: deckId,
      title: currentDoc.filename.replace(/\.[^/.]+$/, ""),
      category: "Document Synthesis",
      exam: "BOTH" as const,
      description: `Synthesized from ${currentDoc.filename} (${currentDoc.pageCount} pages).`,
      cards: newCards,
    };

    try {
      const saved = localStorage.getItem("real_nurse_decks");
      const existing = saved ? JSON.parse(saved) : [];
      localStorage.setItem("real_nurse_decks", JSON.stringify([newDeck, ...existing]));
      sessionStorage.setItem("new_deck_to_open", deckId);
      if (go) {
        go("flashcards");
      }
    } catch (err) {
      console.warn("Failed to save generated deck:", err);
    }
  };

  const handleLaunchQuizInQuizMaker = () => {
    if (!currentDoc || !generationResult || generationResult.type !== "quiz") return;
    sessionStorage.setItem("custom_quiz_questions", JSON.stringify(generationResult.items));
    sessionStorage.setItem("custom_quiz_title", currentDoc.filename);
    if (go) {
      go("quiz");
    }
  };

  const currentDoc = docs[curIndex];

  return (
    <div className="rise space-y-8">
      <PageHead
        eyebrow="RAG Document Hub"
        title="Study Directly From Your Own Files"
        sub="Upload board review notes and textbooks (up to 25 MB). Ask questions with exact page citations and synthesize flashcards & practice drills in one click."
      />

      {uploadError && (
        <div className="rounded-2xl border border-danger/30 bg-[#ffdad6] p-4 text-xs font-semibold text-danger flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_1.35fr]">
        {/* Left Column: Upload & Document Library */}
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            className={`rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
              drag ? "border-teal bg-teal-tint" : "border-lav-deep bg-white hover:border-teal/50"
            }`}
          >
            <div className="mx-auto size-14 rounded-2xl bg-lav grid place-items-center text-rosetext">
              <UploadCloud size={28} />
            </div>
            <h2 className="mt-4 text-base sm:text-lg font-bold text-ink">
              Drop PDFs, Review Handouts or Notes
            </h2>
            <p className="mt-1 text-xs text-ink-soft">
              PDF or Text documents · <b className="text-rosetext">Strict 25 MB limit</b> per file
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              hidden
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            <Btn
              className="mt-5 text-xs font-bold px-6 py-2.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Extracting & Vectorizing…" : "Browse Files"}
            </Btn>

            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="mx-auto size-6 rounded-full border-2 border-lav border-t-teal animate-spin" />
                <p className="text-xs font-semibold text-rosetext animate-pulse">
                  Chunking pages & generating embeddings…
                </p>
              </div>
            )}
          </div>

          {/* Document List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                Study Library ({docs.length})
              </p>
              <span className="text-xs text-ink-soft">Select to study</span>
            </div>

            <Card className="p-2 space-y-1">
              {docs.length === 0 ? (
                <div className="p-8 text-center text-xs text-ink-soft">
                  No documents uploaded yet. Upload a nursing chapter to begin.
                </div>
              ) : (
                docs.map((d, i) => {
                  const isSelected = curIndex === i;
                  const sizeMB = (d.fileSizeBytes / (1024 * 1024)).toFixed(1);
                  return (
                    <div
                      key={d.id}
                      onClick={() => handleSelectDoc(i)}
                      className={`w-full flex items-center gap-3.5 rounded-2xl px-3.5 py-3.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-lav border border-line shadow-xs"
                          : "hover:bg-canvas"
                      }`}
                    >
                      <div className="size-10 rounded-xl bg-canvas border border-line grid place-items-center text-rosetext shrink-0">
                        <FileText size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="block text-xs sm:text-sm font-semibold truncate text-ink">
                          {d.filename}
                        </span>
                        <span className="text-xs text-ink-soft flex items-center gap-2 mt-0.5">
                          <span>{sizeMB} MB</span>
                          <span>•</span>
                          <span>{d.pageCount} Pages</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Pill tone={d.status === "ready" ? "teal" : "indigo"}>
                          {d.status === "ready" ? "Ready" : "Processing"}
                        </Pill>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(d.id, e)}
                          title="Delete document"
                          className="text-ink-soft/60 hover:text-danger p-1 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </Card>
          </div>
        </div>

        {/* Right Column: Active Document Workspace & Grounded Chat */}
        <div className="space-y-6">
          {currentDoc && (
            <Card className="p-6 md:p-8 space-y-6">
              {/* Header with One-Click Generators */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-ink truncate max-w-sm">
                    {currentDoc.filename}
                  </h2>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {currentDoc.pageCount} Pages extracted · Grounded clinical context
                  </p>
                </div>

                <div className="flex gap-2">
                  <Btn
                    variant="soft"
                    onClick={handleGenerateFlashcards}
                    disabled={generatingType !== null}
                    className="text-xs font-semibold py-2"
                  >
                    <Layers size={14} />
                    {generatingType === "flashcards" ? "Generating…" : "Flashcards"}
                  </Btn>

                  <Btn
                    variant="soft"
                    onClick={handleGenerateQuiz}
                    disabled={generatingType !== null}
                    className="text-xs font-semibold py-2"
                  >
                    <ListChecks size={14} />
                    {generatingType === "quiz" ? "Generating…" : "Quiz Drill"}
                  </Btn>
                </div>
              </div>

              {/* Generation Result Notice */}
              {generationResult && (
                <div className="rounded-2xl border border-teal/40 bg-teal-tint p-4 space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rosetext flex items-center gap-2">
                      <Sparkles size={15} />
                      Synthesized {generationResult.count} {generationResult.type === "flashcards" ? "Flashcards" : "Quiz Questions"} from {currentDoc.filename}
                    </span>
                    <Pill tone="teal">Ready to Study</Pill>
                  </div>
                  <p className="text-xs text-ink leading-relaxed">
                    Items are grounded in the document text and mapped with clinical rationales.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {generationResult.type === "flashcards" ? (
                      <Btn
                        onClick={handleSaveDeckAndStudy}
                        className="text-xs font-bold py-2 px-4 shadow-sm"
                      >
                        <Layers size={14} /> Save as Deck & Open in Flashcards
                      </Btn>
                    ) : (
                      <Btn
                        onClick={handleLaunchQuizInQuizMaker}
                        className="text-xs font-bold py-2 px-4 shadow-sm"
                      >
                        <Sparkles size={14} /> Launch Practice Drill in Quiz Maker
                      </Btn>
                    )}
                  </div>
                </div>
              )}

              {/* Document Sample Excerpts with Page numbers */}
              {docDetails?.sampleChunks && docDetails.sampleChunks.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                    Document Excerpts & Page Index:
                  </p>
                  <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                    {docDetails.sampleChunks.map((chunk, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-line bg-canvas p-3.5 text-xs text-ink leading-relaxed space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-lav px-2 py-0.5 text-[10px] font-bold text-rosetext">
                            Page {chunk.pageNumber}
                          </span>
                          {chunk.sectionHeading && (
                            <span className="font-semibold text-ink-soft truncate">
                              {chunk.sectionHeading}
                            </span>
                          )}
                        </div>
                        <p className="text-ink-soft">{chunk.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {!currentDoc && (
            <Card className="p-8 text-center space-y-3.5 border-dashed border-2 border-line">
              <div className="mx-auto size-12 rounded-2xl bg-teal-tint grid place-items-center text-rosetext">
                <BookOpen size={24} />
              </div>
              <h3 className="text-base font-bold text-ink">No Active Study Document</h3>
              <p className="text-xs text-ink-soft max-w-md mx-auto leading-relaxed">
                Upload a nursing chapter or clinical notes on the left (up to 25 MB). The AI tutor will extract its contents, cite exact pages, and generate flashcards or practice questions.
              </p>
              <Btn
                className="text-xs font-bold py-2.5 px-6 mx-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload File to Begin
              </Btn>
            </Card>
          )}

          {/* Grounded AI Study Assistant with Page Citations */}
          <Card className="p-6 md:p-8 flex flex-col space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-teal-tint grid place-items-center text-rosetext">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-ink">
                    AI Study Assistant (Grounded RAG)
                  </h2>
                  <p className="text-xs text-ink-soft">Strict page citations from active file</p>
                </div>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                "When should I withhold this drug?",
                "What are early signs of toxicity?",
                "What lab values must be monitored?",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleAsk(chip)}
                  disabled={isAsking || !currentDoc}
                  className="rounded-full border border-line bg-canvas px-3 py-1 text-[11px] font-medium text-ink-soft hover:bg-lav transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {msgs.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[90%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 ${
                    m.me
                      ? "ml-auto bg-teal text-ink font-semibold"
                      : "bg-lav text-ink border border-line"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Page Citations Badges */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="pt-2 border-t border-line/50 space-y-1.5">
                      <p className="text-[11px] font-bold text-rosetext uppercase tracking-wider flex items-center gap-1">
                        <Bookmark size={11} fill="currentColor" /> Verified Citations:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.citations.map((c, ci) => (
                          <div
                            key={ci}
                            className="rounded-lg bg-white/80 border border-line px-2.5 py-1 text-[11px] text-ink font-medium shadow-2xs"
                            title={c.excerpt}
                          >
                            <b className="text-rosetext">Page {c.pageNumber}</b>
                            {c.sectionHeading && <span> • {c.sectionHeading}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isAsking && (
                <div className="rounded-2xl bg-lav p-4 text-xs text-ink-soft flex items-center gap-2 max-w-[70%]">
                  <div className="size-3 rounded-full border-2 border-teal border-t-transparent animate-spin" />
                  <span>Searching document chunks and formulating answer with citations…</span>
                </div>
              )}
            </div>

            {/* Query Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAsk();
              }}
              className="flex gap-2 pt-2"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  currentDoc
                    ? `Ask anything about ${currentDoc.filename} (e.g. When should I withhold digoxin?)`
                    : "Upload a document to ask questions..."
                }
                disabled={!currentDoc || isAsking}
                className="flex-1 rounded-full border border-line bg-canvas px-4 py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
              <Btn
                variant="indigo"
                type="submit"
                disabled={!query.trim() || isAsking || !currentDoc}
                className="px-5 shrink-0"
                aria-label="Send query"
              >
                <Send size={15} />
              </Btn>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
