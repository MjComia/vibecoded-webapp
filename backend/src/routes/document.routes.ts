import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { RAGService } from "../services/rag.service.js";

export const documentRouter = Router();

// Configure Multer with strict 25 MB file size limit and memory storage
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/octet-stream",
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith(".pdf") || file.originalname.endsWith(".txt")) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only PDF and text documents are supported."));
    }
  },
});

// Middleware for Multer error handling (e.g. 25MB exceeded)
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          error: "File exceeds the maximum allowable limit of 25 MB.",
        });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
};

/**
 * POST /api/documents/upload
 * Upload and vectorize study notes or textbook chapter
 */
documentRouter.post("/upload", handleUpload, async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "No file was uploaded." });
    }

    const userId = req.body?.userId;

    const doc = await RAGService.processAndStoreDocument({
      filename: file.originalname,
      buffer: file.buffer,
      fileSizeBytes: file.size,
      userId,
    });

    res.status(201).json({
      success: true,
      document: {
        id: doc.id,
        filename: doc.filename,
        fileSizeBytes: doc.fileSizeBytes,
        pageCount: doc.pageCount,
        chunkCount: doc.chunks.length,
        status: doc.status,
        createdAt: doc.createdAt,
      },
    });
  } catch (err: any) {
    console.error("[Documents] Upload processing error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to process document." });
  }
});

/**
 * GET /api/documents
 * List all available study documents (scoped to user if authenticated)
 */
documentRouter.get("/", (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string) || undefined;
    const docs = RAGService.listDocuments(userId);
    res.json({
      success: true,
      documents: docs.map((d) => ({
        id: d.id,
        filename: d.filename,
        fileSizeBytes: d.fileSizeBytes,
        pageCount: d.pageCount,
        status: d.status,
        createdAt: d.createdAt,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/documents/:id
 * Get single document details & chunk excerpt
 */
documentRouter.get("/:id", (req: Request, res: Response) => {
  try {
    const doc = RAGService.getDocumentById(req.params.id as string);
    if (!doc) {
      return res.status(404).json({ success: false, error: "Document not found." });
    }

    res.json({
      success: true,
      document: {
        id: doc.id,
        filename: doc.filename,
        fileSizeBytes: doc.fileSizeBytes,
        pageCount: doc.pageCount,
        chunkCount: doc.chunks.length,
        status: doc.status,
        createdAt: doc.createdAt,
        sampleChunks: doc.chunks.slice(0, 5).map((c) => ({
          pageNumber: c.pageNumber,
          sectionHeading: c.sectionHeading,
          content: c.content,
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/documents/:id
 * Remove document from study hub
 */
documentRouter.delete("/:id", (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId || req.body?.userId) as string | undefined;
    const removed = RAGService.deleteDocument(req.params.id as string, userId);
    res.json({ success: removed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/documents/:id/chat
 * Grounded AI Study Assistant with page citations
 */
documentRouter.post("/:id/chat", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ success: false, error: "Query string is required." });
    }

    const result = await RAGService.answerQueryWithCitations(query, req.params.id as string);
    res.json({
      success: true,
      answer: result.answer,
      citations: result.citations,
    });
  } catch (err: any) {
    console.error("[Documents] Chat error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/documents/:id/generate-flashcards
 * Create flashcards directly from document text
 */
documentRouter.post("/:id/generate-flashcards", async (req: Request, res: Response) => {
  try {
    const count = Number(req.body?.count) || 8;
    const cards = await RAGService.generateFlashcards(req.params.id as string, count);
    res.json({ success: true, count: cards.length, flashcards: cards });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/documents/:id/generate-quiz
 * Create practice quiz directly from document text
 */
documentRouter.post("/:id/generate-quiz", async (req: Request, res: Response) => {
  try {
    const count = Number(req.body?.count) || 5;
    const questions = await RAGService.generateQuiz(req.params.id as string, count);
    res.json({ success: true, count: questions.length, questions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
