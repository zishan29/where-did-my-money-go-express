// src/routes/index.ts
import { Router } from "express";
import multer from "multer";
import { extractTextFromPDF } from "../services/pdf";
import { parseExpense } from "../services/gemini";
import { generateInsights } from "../services/insights";
import { answerQuestion } from "../services/chat";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function sanitizeStatement(text: string): string {
  return text
    .replace(/[A-Z]{4}0[A-Z0-9]{6}/g, "[IFSC]")        // IFSC codes
    .replace(/\d{9,18}/g, "[ACCOUNT]")                    // account numbers
    .replace(/\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/g, "[CARD]") // card numbers
    .replace(/PAN\s?:?\s?[A-Z]{5}\d{4}[A-Z]/gi, "[PAN]") // PAN numbers
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]"); // emails
}

router.post("/upload", upload.single("statement"), async (req, res) => {
  const buffer = req.file?.buffer;
  if (!buffer) return res.status(400).json({ error: "No file uploaded" });
  try {
    const text = await extractTextFromPDF(buffer);
    const sanitized = sanitizeStatement(text);
    const expenses = await parseExpense(sanitized);
    res.status(200).json({ raw: expenses });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("GEMINI ERROR:", err);
      res.status(500).json({ error: err.message });
    } else {
      console.error("Unknown error", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
});

router.post("/insights", async (req, res) => {
  const { expenses } = req.body;
  if (!expenses?.length) return res.status(400).json({ error: "No expenses" });

  try {
    const insights = await generateInsights(expenses);
    res.status(200).json({ insights });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("GEMINI ERROR:", err);
      res.status(500).json({ error: err.message });
    } else {
      console.error("Unknown error", err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
});

router.post("/chat", async (req, res) => {
  const { question, expenses } = req.body;
  if (!question || !expenses?.length)
    return res.status(400).json({ error: "Missing question or expenses" });

  try {
    const answer = await answerQuestion(question, expenses);
    res.status(200).json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
