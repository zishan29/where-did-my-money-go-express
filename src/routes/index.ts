import { Router, type Router as ExpressRouter } from "express";
import dotenv from "dotenv";
dotenv.config();
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() })

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

import { GoogleGenAI } from "@google/genai";

const router: ExpressRouter = Router();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are an expense parser. The user will give you raw text describing one or more expenses.
Extract and return ONLY a JSON array with this shape, nothing else:
[
  {
    "merchant": string,
    "amount": number,
    "currency": "INR",
    "category": string,  // e.g. Food, Transport, Shopping, Entertainment, Utilities
    "date": string | null  // ISO 8601 if found, else null
  }
]`;

export function sanitizeStatement(text: string): string {
  return text
    .replace(/[A-Z]{4}0[A-Z0-9]{6}/g, "[IFSC]")        // IFSC codes
    .replace(/\d{9,18}/g, "[ACCOUNT]")                    // account numbers
    .replace(/\d{4}\s?\d{4}\s?\d{4}\s?\d{4}/g, "[CARD]") // card numbers
    .replace(/PAN\s?:?\s?[A-Z]{5}\d{4}[A-Z]/gi, "[PAN]") // PAN numbers
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]"); // emails
}

async function parseExpense(rawText: string) {

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${SYSTEM_PROMPT}\n\nUser input: ${rawText}`,
  });

  const text = response.text?.trim() ?? "";
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

router.post("/", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    let expenses = await parseExpense(text);
    res.status(200).json({ expenses });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

router.post("/upload", upload.single("statement"), async (req, res) => {
  const buffer = req.file?.buffer;
  if (!buffer) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const text = await extractTextFromPDF(buffer);
  const sanitized = sanitizeStatement(text);

  const expenses = await parseExpense(sanitized);
  // Just return the raw text first, don't call LLM yet
  res.status(200).json({ raw: expenses, charCount: text.length });
});

export default router;
