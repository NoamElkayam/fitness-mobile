// lib/pdf.ts
// ייצוא PDF בעזרת html2pdf.js (כולל jsPDF+html2canvas)
// מחליף זמנית "סקין" כדי שהטקסט יהיה כהה וחד על דף לבן.

export type PdfOptions = {
  filename?: string;
  margin?: number | [number, number, number, number];
  orientation?: "portrait" | "landscape";
  format?: string | [number, number];
  theme?: "light" | "dark"; // ברירת מחדל: 'light' = שחור על לבן
  scale?: number;           // חדות (ברירת מחדל 3)
};

export async function exportElementToPDF(
  containerId: string,
  {
    filename = "plan.pdf",
    margin = [12, 12, 12, 12],
    orientation = "portrait",
    format = "a4",
    theme = "light",
    scale = 3,
  }: PdfOptions = {}
) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const el = document.getElementById(containerId);
  if (!el) return;

  // סגנונות שמוחלים רק בזמן הייצוא כדי לעשות קונטרסט גבוה ולבטל שקיפויות
  const styleEl = document.createElement("style");
  styleEl.id = "pdf-export-style";
  styleEl.textContent = `
    [data-pdf-theme] { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

    /* PDF בהיר: לבן, טקסט כהה, בלי שקיפויות */
    [data-pdf-theme="light"]{ background:#ffffff !important; }
    [data-pdf-theme="light"] *{
      color:#0f172a !important;           /* Slate-900 */
      border-color:#e5e7eb !important;    /* Slate-200 */
      text-shadow:none !important;
      opacity:1 !important;
    }
    [data-pdf-theme="light"] .card{
      background:#ffffff !important;      /* לבטל rgba שקוף */
      border-color:#e5e7eb !important;
    }
    [data-pdf-theme="light"] .btn,
    [data-pdf-theme="light"] .btnPdf{
      display:none !important;            /* לא לייצא כפתורים */
    }

    /* אופציה: PDF כהה (אם תרצה) */
    [data-pdf-theme="dark"]{ background:#0b1220 !important; }
    [data-pdf-theme="dark"] *{
      color:#e5e7eb !important;
      border-color:rgba(255,255,255,.25) !important;
      text-shadow:none !important;
      opacity:1 !important;
    }

    /* למנוע שבירת שורות מוזרה בכותרות/כפתורים */
    [data-pdf-theme] h1, [data-pdf-theme] h2, [data-pdf-theme] h3, [data-pdf-theme] .title{
      font-weight:800 !important;
      letter-spacing:0 !important;
    }

    /* אופציונלי: רוחב מקסימלי נוח ל-A4 */
    [data-pdf-theme]{
      max-width: 780pt; /* ~A4 margins */
      margin-inline: auto;
    }
  `;
  document.head.appendChild(styleEl);

  // הפעלת ה"סקין" הזמני על האלמנט
  const prevAttr = el.getAttribute("data-pdf-theme");
  el.setAttribute("data-pdf-theme", theme);

  // משתמשים בבאנדל המלא (אין ייבוא של jspdf/html2canvas בנפרד)
  const mod = await import("html2pdf.js/dist/html2pdf.bundle.min.js");
  const html2pdf: any = (mod as any).default || (window as any).html2pdf;

  await html2pdf()
    .set({
      margin,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale,                // חדות גבוהה
        useCORS: true,
        backgroundColor: theme === "light" ? "#ffffff" : "#0b1220",
        letterRendering: true
      },
      jsPDF: { unit: "pt", format, orientation },
      pagebreak: { mode: ["css", "legacy"] },
    })
    .from(el)
    .save();

  // ניקוי
  if (prevAttr) el.setAttribute("data-pdf-theme", prevAttr);
  else el.removeAttribute("data-pdf-theme");
  styleEl.remove();
}
