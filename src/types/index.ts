export type Expense = {
  merchant: string;
  amount: number;
  currency: string;
  category: string;
  date: string | null;
  type: "debit" | "credit";
};

export type Insight = {
  type: "warning" | "positive" | "neutral" | "tip";
  title: string;
  body: string;
};
