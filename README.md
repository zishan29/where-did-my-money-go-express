# Where Did My Money Go? — Backend

Express + TypeScript API that handles PDF extraction, LLM parsing, AI insights, and natural language Q&A for bank statements.

---

## Tech stack

- **Express** with **TypeScript**
- **ts-node-dev** for development
- **pdfjs-dist** for PDF text extraction
- **Google Gemini** (`gemini-3-flash-preview`) for all AI calls
- **multer** for file upload handling

---

## API endpoints

### `POST /api/parse/upload`
Upload a bank statement PDF. Returns parsed transactions.

**Request:** `multipart/form-data` with field `statement` (PDF file)

**Response:**
```json
{
  "raw": [
    {
      "merchant": "Swiggy",
      "amount": 337,
      "currency": "INR",
      "category": "Food",
      "date": "2026-01-06",
      "type": "debit"
    }
  ]
}
```

---

### `POST /api/parse/insights`
Generate AI insights from parsed transactions.

**Request:**
```json
{
  "expenses": [/* array of expense objects */]
}
```

**Response:**
```json
{
  "insights": [
    {
      "type": "warning",
      "title": "Net savings are minuscule",
      "body": "Your savings rate is just 3.3%..."
    }
  ]
}
```

---

### `POST /api/parse/chat`
Answer a natural language question about transactions.

**Request:**
```json
{
  "question": "How much did I spend on food?",
  "expenses": [/* array of expense objects */]
}
```

**Response:**
```json
{
  "answer": "You spent ₹1,729 on food across Swiggy, Zomato, and Hungerbox."
}
```

---

## Getting started

### Prerequisites
- Node.js 18+
- pnpm
- Gemini API key ([get one free at aistudio.google.com](https://aistudio.google.com))

### Install and run

```bash
git clone https://github.com/yourusername/where-my-money-backend
cd where-my-money-backend
pnpm install
cp .env.example .env   # add your Gemini API key
pnpm dev
```

Server runs on `http://localhost:3000`

### Environment variables

```env
GEMINI_API_KEY=your_key_here
PORT=3000
```

Create a `.env.example` with the same keys but empty values and commit that — never commit `.env`.

---

## Project structure

src/
├── server.ts           # Entry point
├── app.ts              # Express setup, middleware, route mounting
├── routes/
│   └── index.ts        # Route definitions
├── services/
│   ├── pdf.ts          # PDF text extraction with pdfjs-dist
│   ├── gemini.ts       # Transaction parsing with Gemini
│   ├── insights.ts     # AI insights generation
│   └── chat.ts         # Natural language Q&A
└── types/
└── index.ts        # Shared TypeScript types

---

## How PDF parsing works

PDF upload
→ pdfjs-dist extracts raw text
→ sanitizer strips IFSC, account numbers, PAN
→ Gemini parses text into structured JSON
→ response sent to frontend

The LLM prompt explicitly handles Indian bank statement patterns — UPI transfers, IB Billpay, PhonePe, salary credits — and maps them to clean categories.

---

## Deployment

Deployed on **Render**. Connect your GitHub repo, set environment variables in the Render dashboard, and deploy. Use the following start command:

```bash
pnpm build && pnpm start
```

Make sure `tsconfig.json` has `"outDir": "./dist"` and your `package.json` start script runs `node dist/server.js`.
