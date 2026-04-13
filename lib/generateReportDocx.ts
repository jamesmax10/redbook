import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  TableLayoutType,
  convertInchesToTwip,
  ShadingType,
} from "docx";
import type { Adjustment } from "./types";

interface Comparable {
  address: string;
  price_or_rent: number;
  gross_internal_area: number;
  rate_per_sqm: number;
  adjustments: Adjustment[] | null;
  adjusted_rate_per_sqm: number | null;
}

export interface ReportData {
  reportDate: string;
  caseData: {
    id: string;
    property_address: string;
    client_name: string;
    valuation_date: string;
    purpose: string | null;
    basis_of_value: string | null;
  };
  property: {
    address: string;
    property_type: string | null;
    gross_internal_area: number | null;
    condition: string | null;
    tenure: string | null;
  } | null;
  comparables: Comparable[];
  valuation: {
    adopted_rate_per_sqm: number | null;
    adopted_rate_rationale: string | null;
    assumptions: string | null;
    limiting_conditions: string | null;
    valuer_name: string | null;
  } | null;
}

function fmtCurrency(v: number): string {
  return v.toLocaleString("en-IE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const FONT = "Calibri";
const BODY_SIZE = 22; // 11pt
const SMALL_SIZE = 18; // 9pt

function sectionHeading(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        font: FONT,
        color: "1F2937",
      }),
    ],
  });
}

function bodyText(text: string, opts?: { italics?: boolean; bold?: boolean; spacing?: { before?: number; after?: number } }) {
  return new Paragraph({
    spacing: { after: 160, ...opts?.spacing },
    children: [
      new TextRun({
        text,
        size: BODY_SIZE,
        font: FONT,
        italics: opts?.italics,
        bold: opts?.bold,
      }),
    ],
  });
}

function fieldRow(label: string, value: string | null | undefined) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: `${label}:  `, bold: true, size: BODY_SIZE, font: FONT, color: "374151" }),
      new TextRun({ text: value ?? "Not provided", size: BODY_SIZE, font: FONT, color: value ? "111827" : "9CA3AF" }),
    ],
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { after: 60 }, children: [] });
}

// ── Table helpers ──
//
// Page is A4 (11906 twips wide) with 1.15" margins each side (1656 twips).
// Available width: 11906 − 2 × 1656 = 8594 twips.
// Column widths in twips, summing to 8594:
const COL_ADDRESS = 2900;
const COL_PRICE = 1500;
const COL_AREA = 1200;
const COL_RATE = 1400;
const COL_ADJ_RATE = 1594;

const HEADER_SHADING = { type: ShadingType.SOLID, color: "F3F4F6" } as const;
const THIN_BORDER = { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" };
const CELL_BORDERS = {
  top: THIN_BORDER,
  bottom: THIN_BORDER,
  left: THIN_BORDER,
  right: THIN_BORDER,
};
const CELL_MARGIN = {
  top: convertInchesToTwip(0.04),
  bottom: convertInchesToTwip(0.04),
  left: convertInchesToTwip(0.06),
  right: convertInchesToTwip(0.06),
};

function headerCell(text: string, widthTwips: number) {
  return new TableCell({
    width: { size: widthTwips, type: WidthType.DXA },
    borders: CELL_BORDERS,
    shading: HEADER_SHADING,
    margins: CELL_MARGIN,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 18, font: FONT, color: "374151" })],
      }),
    ],
  });
}

function dataCell(
  text: string,
  widthTwips: number,
  align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT,
) {
  return new TableCell({
    width: { size: widthTwips, type: WidthType.DXA },
    borders: CELL_BORDERS,
    margins: CELL_MARGIN,
    children: [
      new Paragraph({
        alignment: align,
        children: [new TextRun({ text, size: 18, font: FONT })],
      }),
    ],
  });
}

function buildComparablesTable(comparables: Comparable[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell("Address", COL_ADDRESS),
      headerCell("Price", COL_PRICE),
      headerCell("Area", COL_AREA),
      headerCell("€/sq m", COL_RATE),
      headerCell("Adj. €/sq m", COL_ADJ_RATE),
    ],
  });

  const dataRows = comparables.map(
    (c) =>
      new TableRow({
        children: [
          dataCell(c.address, COL_ADDRESS),
          dataCell(`€${fmtCurrency(c.price_or_rent)}`, COL_PRICE, AlignmentType.RIGHT),
          dataCell(Number(c.gross_internal_area).toLocaleString("en-IE"), COL_AREA, AlignmentType.RIGHT),
          dataCell(`€${fmtCurrency(Number(c.rate_per_sqm))}`, COL_RATE, AlignmentType.RIGHT),
          dataCell(
            `€${fmtCurrency(c.adjusted_rate_per_sqm ?? Number(c.rate_per_sqm))}`,
            COL_ADJ_RATE,
            AlignmentType.RIGHT,
          ),
        ],
      }),
  );

  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 8594, type: WidthType.DXA },
    columnWidths: [COL_ADDRESS, COL_PRICE, COL_AREA, COL_RATE, COL_ADJ_RATE],
    rows: [headerRow, ...dataRows],
  });
}

function comparablesSummary(comparables: Comparable[]): Paragraph | null {
  if (comparables.length === 0) return null;

  const rates = comparables.map(
    (c) => c.adjusted_rate_per_sqm ?? Number(c.rate_per_sqm)
  );

  const min = Math.min(...rates);
  const max = Math.max(...rates);
  const avg = rates.reduce((s, v) => s + v, 0) / rates.length;

  return new Paragraph({
    spacing: { before: 240, after: 160 },
    children: [
      new TextRun({ text: "The comparable evidence indicates a range of ", size: BODY_SIZE, font: FONT }),
      new TextRun({ text: `€${fmtCurrency(min)}`, bold: true, size: BODY_SIZE, font: FONT }),
      new TextRun({ text: " – ", size: BODY_SIZE, font: FONT }),
      new TextRun({ text: `€${fmtCurrency(max)}`, bold: true, size: BODY_SIZE, font: FONT }),
      new TextRun({ text: " per sq m, with an average of ", size: BODY_SIZE, font: FONT }),
      new TextRun({ text: `€${fmtCurrency(avg)}`, bold: true, size: BODY_SIZE, font: FONT }),
      new TextRun({ text: ` per sq m based on ${rates.length} comparable${rates.length === 1 ? "" : "s"}.`, size: BODY_SIZE, font: FONT }),
    ],
  });
}

export async function generateReportDocx(data: ReportData): Promise<Buffer> {
  const { reportDate, caseData, property, comparables, valuation } = data;

  const children: (Paragraph | Table)[] = [];

  // ── Title block ──
  children.push(emptyLine());
  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "Valuation Report", bold: true, size: 48, font: FONT, color: "111827" })],
    }),
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [new TextRun({ text: caseData.property_address, size: 28, font: FONT, color: "374151" })],
    }),
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `Prepared for ${caseData.client_name}`,
          italics: true,
          size: BODY_SIZE,
          font: FONT,
          color: "6B7280",
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: `Valuation Date: ${fmtDate(caseData.valuation_date)}  ·  Report Date: ${fmtDate(reportDate)}`,
          italics: true,
          size: BODY_SIZE,
          font: FONT,
          color: "6B7280",
        }),
      ],
    }),
  );

  // ── Section 1: Property Overview ──
  children.push(sectionHeading("1.  Property Overview"));
  if (property) {
    children.push(fieldRow("Address", property.address));
    children.push(fieldRow("Property Type", property.property_type));
    children.push(
      fieldRow(
        "Gross Internal Area",
        property.gross_internal_area
          ? `${Number(property.gross_internal_area).toLocaleString("en-IE")} sq m`
          : null,
      ),
    );
    children.push(fieldRow("Condition", property.condition));
    children.push(fieldRow("Tenure", property.tenure));
  } else {
    bodyText("No subject property recorded for this case.", { italics: true });
  }

  // ── Section 2: Valuation Context ──
  children.push(sectionHeading("2.  Valuation Context"));
  children.push(fieldRow("Client", caseData.client_name));
  children.push(fieldRow("Valuation Date", fmtDate(caseData.valuation_date)));
  children.push(fieldRow("Report Date", fmtDate(reportDate)));
  children.push(fieldRow("Purpose", caseData.purpose));
  children.push(fieldRow("Basis of Value", caseData.basis_of_value));

  // ── Section 3: Comparable Evidence ──
  children.push(sectionHeading("3.  Comparable Evidence"));
  if (comparables.length > 0) {
    children.push(
      bodyText(
        `A total of ${comparables.length} comparable transaction${comparables.length === 1 ? " has" : "s have"} been identified and analysed. The details are summarised in the table below.`,
      ),
    );
    children.push(emptyLine());
    children.push(buildComparablesTable(comparables));
    const summary = comparablesSummary(comparables);
    if (summary) children.push(summary);
  } else {
    children.push(bodyText("No comparable evidence has been recorded for this case.", { italics: true }));
  }

  // ── Section 4: Valuation Conclusion ──
  children.push(sectionHeading("4.  Valuation Conclusion"));
  if (valuation?.adopted_rate_per_sqm != null) {
    children.push(
      new Paragraph({
        spacing: { after: 160 },
        children: [
          new TextRun({ text: "Having regard to the above comparable evidence, an adopted rate of ", size: BODY_SIZE, font: FONT }),
          new TextRun({ text: `€${fmtCurrency(valuation.adopted_rate_per_sqm)} per sq m`, bold: true, size: BODY_SIZE, font: FONT }),
          new TextRun({ text: " has been applied.", size: BODY_SIZE, font: FONT }),
        ],
      }),
    );

    if (property?.gross_internal_area != null) {
      const implied = valuation.adopted_rate_per_sqm * Number(property.gross_internal_area);
      const area = Number(property.gross_internal_area).toLocaleString("en-IE");

      children.push(
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: `Applied to the subject property's gross internal area of ${area} sq m, this results in an implied capital value of `,
              size: BODY_SIZE,
              font: FONT,
            }),
            new TextRun({ text: `€${fmtCurrency(implied)}`, bold: true, size: BODY_SIZE, font: FONT }),
            new TextRun({ text: ".", size: BODY_SIZE, font: FONT }),
          ],
        }),
      );

      children.push(emptyLine());
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Calculation:  ", bold: true, size: 20, font: FONT, color: "6B7280" }),
            new TextRun({
              text: `€${fmtCurrency(valuation.adopted_rate_per_sqm)} /sq m  ×  ${area} sq m  =  €${fmtCurrency(implied)}`,
              size: 20,
              font: FONT,
              color: "6B7280",
            }),
          ],
        }),
      );
    }
  } else {
    children.push(bodyText("No valuation conclusion has been recorded yet.", { italics: true }));
  }

  // ── Section 5: Rationale ──
  children.push(sectionHeading("5.  Rationale"));
  if (valuation?.adopted_rate_rationale) {
    children.push(bodyText(valuation.adopted_rate_rationale));
  } else {
    children.push(bodyText("No rationale has been provided yet.", { italics: true }));
  }

  // ── Section 6: Assumptions ──
  children.push(sectionHeading("6.  Assumptions"));
  if (valuation?.assumptions) {
    children.push(bodyText(valuation.assumptions));
  } else {
    children.push(bodyText("No assumptions have been recorded.", { italics: true }));
  }

  // ── Section 7: Limiting Conditions ──
  children.push(sectionHeading("7.  Limiting Conditions"));
  if (valuation?.limiting_conditions) {
    children.push(bodyText(valuation.limiting_conditions));
  } else {
    children.push(bodyText("No limiting conditions have been recorded.", { italics: true }));
  }

  // ── Section 8: Valuer Declaration ──
  children.push(sectionHeading("8.  Valuer Declaration"));
  children.push(
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: "\u201CI confirm that this valuation has been prepared in accordance with RICS standards and reflects my professional judgement. I have no conflict of interest in this instruction.\u201D",
          italics: true,
          size: BODY_SIZE,
          font: FONT,
        }),
      ],
    }),
  );
  children.push(emptyLine());
  children.push(fieldRow("Valuer Name", valuation?.valuer_name));
  children.push(fieldRow("Report Date", fmtDate(reportDate)));

  // ── Footer ──
  children.push(emptyLine());
  children.push(
    new Paragraph({
      spacing: { before: 600 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Draft Valuation Report  ·  Generated by RedBook Pro",
          color: "9CA3AF",
          size: SMALL_SIZE,
          font: FONT,
        }),
      ],
    }),
  );
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: "This is not a RICS-compliant valuation report. For professional use only.",
          color: "D1D5DB",
          size: 16,
          font: FONT,
        }),
      ],
    }),
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.15),
              right: convertInchesToTwip(1.15),
            },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
