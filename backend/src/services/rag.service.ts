import { getGeminiClient, GEMINI_MODEL } from "../config/gemini.js";
import pdfParse from "pdf-parse";
import { supabase, isSupabaseConfigured } from "../config/supabase.js";

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  sectionHeading?: string;
  content: string;
  embedding?: number[];
}

export interface StoredDocument {
  id: string;
  userId?: string;
  filename: string;
  fileSizeBytes: number;
  pageCount: number;
  status: "uploaded" | "processing" | "ready" | "failed";
  chunks: DocumentChunk[];
  createdAt: string;
}

// In-memory cache for fast local retrieval and resilience
const documentsCache = new Map<string, StoredDocument>();

// Seed default documents if empty so user always has rich clinical content
function ensureSeedDocuments() {
  if (documentsCache.size === 0) {
    const seed1Id = "doc-saunders-pharm";
    const chunks1: DocumentChunk[] = [
      {
        id: "chunk-s-1",
        documentId: seed1Id,
        chunkIndex: 0,
        pageNumber: 1,
        sectionHeading: "Chapter 14: Cardiac Glycosides & Digoxin",
        content: "Digoxin (Lanoxin) exerts a positive inotropic action (increases myocardial contraction strength) and a negative chronotropic action (decreases heart rate by slowing AV node conduction). Therapeutic serum level is strictly 0.5 to 2.0 ng/mL. Levels > 2.0 ng/mL indicate severe digitalis toxicity.",
      },
      {
        id: "chunk-s-2",
        documentId: seed1Id,
        chunkIndex: 1,
        pageNumber: 2,
        sectionHeading: "Nursing Assessment & Administration",
        content: "Before administering any dose of digoxin, the nurse MUST auscultate the apical pulse for one full minute. If the heart rate is below 60 bpm in an adult (or below 70 bpm in a child, below 90 bpm in an infant), withhold the medication, recheck, and notify the healthcare provider immediately.",
      },
      {
        id: "chunk-s-3",
        documentId: seed1Id,
        chunkIndex: 2,
        pageNumber: 3,
        sectionHeading: "Digitalis Toxicity & Potassium Interactions",
        content: "Hypokalemia (potassium < 3.5 mEq/L) drastically potentiates digoxin toxicity by allowing increased myocardial binding. Early symptoms: anorexia, nausea, vomiting, diarrhea, and fatigue. Visual disturbances are hallmark: blurred vision, green-yellow halos around objects, photophobia. Antidote is Digoxin Immune Fab (Digibind).",
      },
    ];

    documentsCache.set(seed1Id, {
      id: seed1Id,
      filename: "Saunders_Comprehensive_Pharm_Ch14.pdf",
      fileSizeBytes: 18400000,
      pageCount: 3,
      status: "ready",
      chunks: chunks1,
      createdAt: new Date().toISOString(),
    });

    const seed2Id = "doc-brunner-endocrine";
    const chunks2: DocumentChunk[] = [
      {
        id: "chunk-b-1",
        documentId: seed2Id,
        chunkIndex: 0,
        pageNumber: 1,
        sectionHeading: "Endocrine Emergencies: Thyroid Storm & Hypocalcemia",
        content: "Thyroidectomy complications include hemorrhage, respiratory distress from tracheal compression, recurrent laryngeal nerve damage manifested by hoarseness, and inadvertent removal of parathyroid glands causing acute hypocalcemia and tetany.",
      },
      {
        id: "chunk-b-2",
        documentId: seed2Id,
        chunkIndex: 1,
        pageNumber: 2,
        sectionHeading: "Post-Thyroidectomy Nursing Management",
        content: "Assess for numbness or tingling around the mouth, toes, and fingers. Evaluate Chvostek's sign (facial spasm upon tapping facial nerve) and Trousseau's sign (carpopedal spasm upon inflating blood pressure cuff above systolic pressure for 3 minutes). Keep IV Calcium Gluconate and a tracheostomy tray readily accessible at the bedside.",
      },
    ];

    documentsCache.set(seed2Id, {
      id: seed2Id,
      filename: "Brunner_Suddarth_Endocrine_Notes.pdf",
      fileSizeBytes: 12100000,
      pageCount: 2,
      status: "ready",
      chunks: chunks2,
      createdAt: new Date().toISOString(),
    });
  }
}

ensureSeedDocuments();

// Cosine similarity helper
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Simple TF-IDF cosine fallback for resilience
function keywordSimilarity(query: string, content: string): number {
  const qWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const cWords = content.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  if (qWords.length === 0 || cWords.length === 0) return 0;

  let matches = 0;
  for (const qw of qWords) {
    if (cWords.includes(qw)) matches++;
  }
  return matches / qWords.length;
}

export class RAGService {
  /**
   * Parse PDF buffer into page-by-page text
   */
  static async extractTextFromPDF(buffer: Buffer): Promise<{ pageCount: number; pages: { pageNumber: number; text: string }[] }> {
    try {
      const data = await pdfParse(buffer);
      const fullText = data.text || "";
      const pageCount = data.numpages || 1;

      // Split pages by form feed if present, or divide proportionally
      const rawPages = fullText.split(/\f|\n{4,}/).filter((t: string) => t.trim().length > 0);
      const pages: { pageNumber: number; text: string }[] = [];

      if (rawPages.length > 0) {
        rawPages.forEach((text: string, idx: number) => {
          pages.push({
            pageNumber: idx + 1,
            text: text.trim(),
          });
        });
      } else {
        pages.push({
          pageNumber: 1,
          text: fullText.trim(),
        });
      }

      return { pageCount: pages.length || pageCount, pages };
    } catch (err: any) {
      console.warn("[RAGService] pdfParse error, treating as raw text:", err.message);
      const text = buffer.toString("utf-8");
      return {
        pageCount: 1,
        pages: [{ pageNumber: 1, text: text.trim() }],
      };
    }
  }

  /**
   * Chunk document pages into semantically coherent segments with page metadata
   */
  static chunkPages(docId: string, pages: { pageNumber: number; text: string }[]): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;

    for (const page of pages) {
      // Split into paragraphs or chunks of ~150-300 words
      const paragraphs = page.text.split(/\n\s*\n/).filter((p) => p.trim().length > 30);

      if (paragraphs.length === 0 && page.text.trim().length > 0) {
        chunks.push({
          id: `${docId}-chunk-${chunkIndex}`,
          documentId: docId,
          chunkIndex,
          pageNumber: page.pageNumber,
          content: page.text.trim(),
        });
        chunkIndex++;
      } else {
        for (const para of paragraphs) {
          const lines = para.trim().split("\n");
          let heading: string | undefined = undefined;
          if (lines[0].length < 80 && !lines[0].endsWith(".")) {
            heading = lines[0];
          }

          chunks.push({
            id: `${docId}-chunk-${chunkIndex}`,
            documentId: docId,
            chunkIndex,
            pageNumber: page.pageNumber,
            sectionHeading: heading,
            content: para.trim(),
          });
          chunkIndex++;
        }
      }
    }

    return chunks;
  }

  /**
   * Embed chunks using Gemini Embedding API with safety timeout
   */
  static async embedChunks(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    try {
      const genAI = getGeminiClient();
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

      const embedded: DocumentChunk[] = [];
      for (const chunk of chunks) {
        try {
          const res = await embeddingModel.embedContent(chunk.content.substring(0, 1000));
          embedded.push({
            ...chunk,
            embedding: res.embedding.values,
          });
        } catch {
          embedded.push(chunk);
        }
      }
      return embedded;
    } catch (err: any) {
      console.warn("[RAGService] Embedding API unavailable, using keyword vectors:", err.message);
      return chunks;
    }
  }

  /**
   * Store and index an uploaded document
   */
  static async processAndStoreDocument(params: {
    filename: string;
    buffer: Buffer;
    fileSizeBytes: number;
    userId?: string;
  }): Promise<StoredDocument> {
    const docId = `doc-${Date.now()}`;
    const { pageCount, pages } = await this.extractTextFromPDF(params.buffer);
    const rawChunks = this.chunkPages(docId, pages);
    const embeddedChunks = await this.embedChunks(rawChunks);

    const doc: StoredDocument = {
      id: docId,
      userId: params.userId,
      filename: params.filename,
      fileSizeBytes: params.fileSizeBytes,
      pageCount,
      status: "ready",
      chunks: embeddedChunks,
      createdAt: new Date().toISOString(),
    };

    documentsCache.set(docId, doc);

    // Persist to Supabase if configured
    if (isSupabaseConfigured && params.userId) {
      try {
        const { data: uploadRec } = await supabase
          .from("uploads")
          .insert({
            user_id: params.userId,
            filename: params.filename,
            file_size_bytes: params.fileSizeBytes,
            mime_type: "application/pdf",
            storage_path: `study-materials/${docId}-${params.filename}`,
            status: "ready",
            page_count: pageCount,
          })
          .select("id")
          .single();

        if (uploadRec?.id) {
          doc.id = uploadRec.id;
          documentsCache.set(uploadRec.id, doc);
        }
      } catch (err) {
        console.warn("[RAGService] Supabase upload sync error:", err);
      }
    }

    return doc;
  }

  /**
   * Retrieve list of all documents
   */
  static listDocuments(): StoredDocument[] {
    ensureSeedDocuments();
    return Array.from(documentsCache.values()).map((d) => ({
      ...d,
      chunks: [], // Omit heavy chunks in list view
    }));
  }

  /**
   * Get single document by ID with chunks
   */
  static getDocumentById(docId: string): StoredDocument | null {
    ensureSeedDocuments();
    return documentsCache.get(docId) || null;
  }

  /**
   * Delete a document
   */
  static deleteDocument(docId: string): boolean {
    return documentsCache.delete(docId);
  }

  /**
   * Search top matching chunks for a question with page citations
   */
  static async findRelevantChunks(query: string, documentId?: string, limit = 4): Promise<Array<DocumentChunk & { similarity: number }>> {
    ensureSeedDocuments();

    let targetDocs: StoredDocument[] = [];
    if (documentId && documentsCache.has(documentId)) {
      targetDocs = [documentsCache.get(documentId)!];
    } else {
      targetDocs = Array.from(documentsCache.values());
    }

    let allChunks: DocumentChunk[] = [];
    for (const d of targetDocs) {
      allChunks = allChunks.concat(d.chunks);
    }

    if (allChunks.length === 0) return [];

    // Try embedding the query
    let queryEmbedding: number[] | null = null;
    try {
      const genAI = getGeminiClient();
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const res = await embeddingModel.embedContent(query.substring(0, 500));
      queryEmbedding = res.embedding.values;
    } catch {
      queryEmbedding = null;
    }

    const scored = allChunks.map((chunk) => {
      let sim = 0;
      if (queryEmbedding && chunk.embedding) {
        sim = cosineSimilarity(queryEmbedding, chunk.embedding);
      } else {
        sim = keywordSimilarity(query, chunk.content);
      }
      return { ...chunk, similarity: sim };
    });

    // Sort by descending relevance
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, limit);
  }

  /**
   * Grounded AI Study Assistant with STRICT page citations
   */
  static async answerQueryWithCitations(query: string, documentId?: string): Promise<{
    answer: string;
    citations: Array<{ pageNumber: number; sectionHeading?: string; excerpt: string; similarity: number }>;
  }> {
    const relevantChunks = await this.findRelevantChunks(query, documentId, 3);

    const citations = relevantChunks.map((c) => ({
      pageNumber: c.pageNumber,
      sectionHeading: c.sectionHeading,
      excerpt: c.content.length > 180 ? c.content.substring(0, 180) + "…" : c.content,
      similarity: Number(c.similarity.toFixed(3)),
    }));

    if (relevantChunks.length === 0 || (relevantChunks[0].similarity < 0.05 && !relevantChunks[0].embedding)) {
      return {
        answer: "I couldn't find relevant content in the uploaded document matching your question. Please verify your search terms or upload additional chapter notes.",
        citations: [],
      };
    }

    const contextText = relevantChunks
      .map((c, i) => `[Source ${i + 1} | Page ${c.pageNumber}${c.sectionHeading ? ` | Section: ${c.sectionHeading}` : ""}]:\n${c.content}`)
      .join("\n\n");

    const prompt = `You are Real Nurse AI Study Assistant, an expert Philippine NLE and NCLEX-RN clinical nursing tutor.
Answer the student's question strictly grounded in the document excerpts below.

CRITICAL INSTRUCTION ON CITATIONS:
You MUST cite the exact page number (e.g. "According to Page ${relevantChunks[0]?.pageNumber}..." or "[Page ${relevantChunks[0]?.pageNumber}]") whenever providing medical facts, dosages, or nursing priorities.

DOCUMENT EXCERPTS:
${contextText}

STUDENT QUESTION:
${query}

INSTRUCTIONS:
1. Provide a concise, clinical, high-yield answer.
2. Bold key nursing actions (e.g., **Hold medication**, **Assess apical pulse for 1 full minute**).
3. Always include the page citation (e.g. "Per Page X...").
4. If the excerpt does not have the answer, state that clearly.`;

    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const res = await model.generateContent(prompt);
      const answer = res.response.text().trim();
      return { answer, citations };
    } catch (err: any) {
      console.warn("[RAGService] Gemini chat generation fallback:", err.message);

      // Smart fallback using top matching chunk with page citation
      const top = relevantChunks[0];
      const answer = `Per Page ${top.pageNumber}${top.sectionHeading ? ` (${top.sectionHeading})` : ""}: ${top.content}`;
      return { answer, citations };
    }
  }

  /**
   * Generate Flashcards from document content
   */
  static async generateFlashcards(documentId: string, count = 8): Promise<Array<{ front: string; back: string; pageNumber: number }>> {
    ensureSeedDocuments();
    const doc = documentsCache.get(documentId);
    if (!doc || doc.chunks.length === 0) {
      throw new Error("Document not found or has no content.");
    }

    const textSample = doc.chunks.map((c) => `[Page ${c.pageNumber}]: ${c.content}`).join("\n\n").substring(0, 4000);

    const prompt = `You are a clinical nursing board exam flashcard generator.
Generate exactly ${count} high-yield clinical flashcards strictly based on this document excerpt:
${textSample}

Return ONLY a valid JSON array of objects:
[
  {
    "front": "Question or clinical cue (e.g. 'What is the therapeutic serum level of Digoxin?')",
    "back": "Concise answer with rationale (e.g. '0.5–2.0 ng/mL. Toxicity occurs > 2.0 ng/mL, potentiated by hypokalemia.')",
    "pageNumber": 1
  }
]`;

    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const res = await model.generateContent(prompt);
      let text = res.response.text().trim();
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) text = match[1].trim();
      return JSON.parse(text);
    } catch {
      // Local fallback flashcards
      return doc.chunks.slice(0, count).map((c, i) => ({
        front: c.sectionHeading ? `Clinical Key: ${c.sectionHeading}` : `Review Question Item #${i + 1}`,
        back: c.content,
        pageNumber: c.pageNumber,
      }));
    }
  }

  /**
   * Generate Quiz Drill from document content
   */
  static async generateQuiz(documentId: string, count = 5): Promise<any[]> {
    ensureSeedDocuments();
    const doc = documentsCache.get(documentId);
    if (!doc || doc.chunks.length === 0) {
      throw new Error("Document not found or has no content.");
    }

    const textSample = doc.chunks.map((c) => `[Page ${c.pageNumber}]: ${c.content}`).join("\n\n").substring(0, 4000);

    const prompt = `You are an expert nursing board exam item writer.
Create ${count} multiple-choice questions strictly grounded in this textbook excerpt:
${textSample}

Return ONLY a valid JSON array:
[
  {
    "stem": "Clinical vignette question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer_index": 0,
    "rationale": "Clear clinical rationale referencing the document page",
    "clinical_tip": "Quick memory mnemonic",
    "pageNumber": 1
  }
]`;

    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const res = await model.generateContent(prompt);
      let text = res.response.text().trim();
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) text = match[1].trim();
      const parsed = JSON.parse(text);
      return parsed.map((q: any, i: number) => ({
        ...q,
        id: `doc-q-${Date.now()}-${i}`,
        subject: "Study Material",
        topic: doc.filename,
        difficulty: "Board-level",
      }));
    } catch {
      return [
        {
          id: `doc-q-${Date.now()}-0`,
          stem: `Based on ${doc.filename}, what is the priority nursing intervention described on Page ${doc.chunks[0]?.pageNumber || 1}?`,
          options: [
            doc.chunks[0]?.content.substring(0, 80) || "Assess patient vitals",
            "Hold all medications and discharge client",
            "Increase infusion rate without checking",
            "Recheck lab values in 24 hours",
          ],
          correct_answer_index: 0,
          rationale: `Per Page ${doc.chunks[0]?.pageNumber || 1}: ${doc.chunks[0]?.content}`,
          clinical_tip: "Always cross-reference clinical parameters before administration.",
          subject: "Study Material",
          topic: doc.filename,
          difficulty: "Board-level",
        },
      ];
    }
  }
}
