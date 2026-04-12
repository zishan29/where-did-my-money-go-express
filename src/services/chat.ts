import { GoogleGenAI } from "@google/genai";
import { type Expense } from "../types/index";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function answerQuestion(
  question: string,
  expenses: Expense[]
): Promise<string> {
  const totalSpent = expenses
    .filter((e) => e.type === "debit")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = expenses
    .filter((e) => e.type === "credit")
    .reduce((sum, e) => sum + e.amount, 0);

  const PROMPT = `You are a personal finance assistant analyzing someone's Indian bank statement.

Here is their complete transaction data:
${JSON.stringify(expenses)}

Summary:
- Total spent: ₹${totalSpent.toLocaleString("en-IN")}
- Total income: ₹${totalIncome.toLocaleString("en-IN")}
- Date range: ${expenses[0]?.date} to ${expenses[expenses.length - 1]?.date}

The user is asking: "${question}"

Answer directly and conversationally. Use specific numbers from their data.
Keep it to 2-3 sentences max. Don't use bullet points.
If you can't answer from the data, say so honestly.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: PROMPT,
  });

  return response.text?.trim() ?? "I couldn't generate an answer.";
}
