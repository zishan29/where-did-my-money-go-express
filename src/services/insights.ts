import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateInsights(expenses: any[]) {
  const totalSpent = expenses
    .filter(e => e.type === "debit")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = expenses
    .filter(e => e.type === "credit")
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryMap = expenses
    .filter(e => e.type === "debit")
    .reduce((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

  const monthlyMap = expenses.reduce((acc, e) => {
    const month = e.date?.slice(0, 7) ?? "Unknown";
    if (!acc[month]) acc[month] = { spent: 0, income: 0 };
    if (e.type === "debit") acc[month].spent += e.amount;
    else acc[month].income += e.amount;
    return acc;
  }, {} as Record<string, { spent: number; income: number }>);

  const PROMPT = `You are a sharp, direct personal finance analyst reviewing someone's Indian bank statement.

Here is their financial summary:
- Total spent: ₹${totalSpent.toLocaleString("en-IN")}
- Total income: ₹${totalIncome.toLocaleString("en-IN")}
- Net: ₹${(totalIncome - totalSpent).toLocaleString("en-IN")}
- Spending by category: ${JSON.stringify(categoryMap)}
- Monthly breakdown: ${JSON.stringify(monthlyMap)}
- All transactions: ${JSON.stringify(expenses)}

Generate exactly 5 insights about this person's spending. Be specific with numbers, not vague.
Be direct and conversational — like a smart friend, not a bank chatbot.
Point out patterns, anomalies, and one actionable suggestion.

Return ONLY a JSON array, no markdown, no explanation:
[
  {
    "type": "warning" | "positive" | "neutral" | "tip",
    "title": "short headline (5 words max)",
    "body": "2-3 sentence insight with specific numbers and dates where relevant"
  }
]`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: PROMPT,
  });

  const text = response.text?.trim() ?? "";
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
