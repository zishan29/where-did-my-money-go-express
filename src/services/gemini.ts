import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { type Expense } from "../types/index.js";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a bank statement expense parser for Indian bank statements.

Extract transactions and return ONLY a JSON array, nothing else. No markdown, no explanation.

Rules:
- "type": "debit" for money going out, "credit" for money coming in (salary, transfers received)
- "category": Use ONLY these categories: Food, Transport, Shopping, Entertainment, Utilities, Healthcare, Education, Investment, Salary, Personal Transfer, Financial Services
  - PhonePe/GPay/Paytm transactions = "Personal Transfer" unless merchant is identifiable
  - IB Billpay/Bill payments = "Utilities" or "Financial Services"  
  - UPI transfers to person names = "Personal Transfer"
  - Known brands (Swiggy, Zomato, Spotify, Amazon, H&M) = use their actual category
- "merchant": Clean up the name. "PHONEPE PAYMENTS" → "PhonePe". "IB BILLPAY DR" → "IB Billpay". Person names stay as-is.
- "amount": Always positive number
- "date": ISO 8601 format (YYYY-MM-DD) or null

Return this shape:
[
  {
    "merchant": string,
    "amount": number,
    "currency": "INR",
    "category": string,
    "date": string | null,
    "type": "debit" | "credit"
  }
]`;

export async function parseExpense(rawText: string): Promise<Expense[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `${SYSTEM_PROMPT}\n\nStatement text:\n${rawText}`,
  });

  const text = response.text?.trim() ?? "";
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
