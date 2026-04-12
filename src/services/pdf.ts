import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

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
