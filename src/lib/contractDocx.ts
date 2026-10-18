import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, HeadingLevel, Packer, WidthType, BorderStyle,
  PageNumber, Footer, NumberFormat,
} from 'docx';

/* ------------------------------------------------------------------ */
/*  Parse contract HTML → docx Document                                */
/* ------------------------------------------------------------------ */

const FONT = 'Times New Roman';
const FONT_SIZE = 24; // half-points (12pt = 24)

interface Run {
  text: string;
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  break?: boolean;
}

/**
 * Parse inline HTML (inside a <p>, <td>, <div>, etc.) into TextRun-ready objects.
 * Handles <strong>, <b>, <em>, <i>, <u>, <br>, and plain text.
 */
function parseInlineHtml(html: string): Run[] {
  const runs: Run[] = [];
  // Remove HTML comments
  let cleaned = html.replace(/<!--[\s\S]*?-->/g, '');
  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&agrave;/g, '\u00E0')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ');

  // Regex to match tags or text
  const tagRegex = /<(\/?)(\w+)[^>]*>|([^<]+)/g;
  let match: RegExpExecArray | null;
  let bold = false;
  let italic = false;
  let underline = false;

  while ((match = tagRegex.exec(cleaned)) !== null) {
    const [, closing, tagName, text] = match;
    if (text) {
      // Plain text
      const decoded = text.replace(/\s+/g, ' ');
      if (decoded.trim() || decoded === ' ') {
        runs.push({ text: decoded, bold, italics: italic, underline });
      }
    } else if (tagName) {
      const tag = tagName.toLowerCase();
      if (tag === 'br') {
        runs.push({ text: '', break: true });
      } else if (tag === 'strong' || tag === 'b') {
        bold = !closing;
      } else if (tag === 'em' || tag === 'i') {
        italic = !closing;
      } else if (tag === 'u') {
        underline = !closing;
      }
      // Ignore other tags (span, div inside p, etc.)
    }
  }

  return runs;
}

/**
 * Convert parsed runs into docx TextRun objects.
 */
function toTextRuns(runs: Run[]): TextRun[] {
  return runs.map(r => {
    if (r.break) {
      return new TextRun({ break: 1, font: FONT, size: FONT_SIZE });
    }
    return new TextRun({
      text: r.text,
      bold: r.bold,
      italics: r.italics,
      underline: r.underline ? {} : undefined,
      font: FONT,
      size: FONT_SIZE,
    });
  });
}

/**
 * Create a Paragraph from parsed runs with alignment options.
 */
function makeParagraph(
  runs: Run[],
  options: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    spacing?: { before?: number; after?: number };
    indent?: { left?: number };
  } = {},
): Paragraph {
  return new Paragraph({
    children: toTextRuns(runs),
    alignment: options.alignment ?? AlignmentType.JUSTIFIED,
    heading: options.heading,
    spacing: options.spacing ?? { after: 120 },
    indent: options.indent,
  });
}

/**
 * Parse a simple <table> block into a docx Table.
 */
function parseTableHtml(tableHtml: string): Table | null {
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  const rows: TableRow[] = [];
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cells: TableCell[] = [];
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const cellContent = cellMatch[1].trim();
      const runs = parseInlineHtml(cellContent);

      // Detect alignment from style
      const styleMatch = cellMatch[0].match(/text-align:\s*(center|right|left)/i);
      const alignment = styleMatch
        ? styleMatch[1].toLowerCase() === 'center' ? AlignmentType.CENTER
        : styleMatch[1].toLowerCase() === 'right' ? AlignmentType.RIGHT
        : AlignmentType.LEFT
        : AlignmentType.LEFT;

      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: toTextRuns(runs),
              alignment,
              spacing: { before: 60, after: 60 },
            }),
          ],
          borders: {
            top: { style: BorderStyle.NONE, size: 0 },
            bottom: { style: BorderStyle.NONE, size: 0 },
            left: { style: BorderStyle.NONE, size: 0 },
            right: { style: BorderStyle.NONE, size: 0 },
          },
          width: { size: 50, type: WidthType.PERCENTAGE },
        }),
      );
    }

    if (cells.length > 0) {
      rows.push(new TableRow({ children: cells }));
    }
  }

  if (rows.length === 0) return null;

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Main converter: parse contract HTML and produce a docx Document buffer.
 */
export async function contractHtmlToDocx(html: string): Promise<Buffer> {
  // Strip <head>, <style>, <!DOCTYPE>, keeping only <body> content
  let body = html;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) body = bodyMatch[1];

  // Remove HTML comments
  body = body.replace(/<!--[\s\S]*?-->/g, '');

  // Remove wrapping <div class="contract"> if present
  body = body.replace(/<div[^>]*class="contract"[^>]*>/gi, '');
  // Remove its closing tag (last </div>)
  body = body.replace(/<\/div>\s*$/i, '');

  const children: (Paragraph | Table)[] = [];

  // Split into block-level elements: <h1>, <p>, <table>, <div>
  const blockRegex = /<(h1|h2|p|table|div)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = blockRegex.exec(body)) !== null) {
    const tag = blockMatch[1].toLowerCase();
    const attrs = blockMatch[2];
    const content = blockMatch[3];

    if (tag === 'h1' || tag === 'h2') {
      const runs = parseInlineHtml(content);
      // Make all runs bold + underlined for title
      runs.forEach(r => { r.bold = true; r.underline = true; });
      children.push(makeParagraph(runs, {
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 200 },
      }));
    } else if (tag === 'table') {
      const table = parseTableHtml(blockMatch[0]);
      if (table) children.push(table);
    } else if (tag === 'p') {
      const isSectionTitle = /class="[^"]*section-title[^"]*"/i.test(attrs);
      const isCenter = /class="[^"]*center[^"]*"/i.test(attrs);
      const isIndent = /class="[^"]*indent[^"]*"/i.test(attrs);

      const runs = parseInlineHtml(content);

      if (isSectionTitle) {
        // Force all runs bold for section titles
        runs.forEach(r => { r.bold = true; });
        children.push(makeParagraph(runs, {
          alignment: AlignmentType.LEFT,
          spacing: { before: 240, after: 120 },
        }));
      } else if (isCenter) {
        children.push(makeParagraph(runs, {
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
        }));
      } else {
        children.push(makeParagraph(runs, {
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
          indent: isIndent ? { left: 720 } : undefined,
        }));
      }
    } else if (tag === 'div') {
      // Recursively handle div content (witness-block, ack-block, etc.)
      const innerBlockRegex = /<(p|table)([^>]*)>([\s\S]*?)<\/\1>/gi;
      let innerMatch: RegExpExecArray | null;
      while ((innerMatch = innerBlockRegex.exec(content)) !== null) {
        const innerTag = innerMatch[1].toLowerCase();
        if (innerTag === 'p') {
          const isCenter = /class="[^"]*center[^"]*"/i.test(innerMatch[2]);
          const runs = parseInlineHtml(innerMatch[3]);
          children.push(makeParagraph(runs, {
            alignment: isCenter ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
            spacing: { after: 120 },
          }));
        } else if (innerTag === 'table') {
          const table = parseTableHtml(innerMatch[0]);
          if (table) children.push(table);
        }
      }
      // Handle standalone inline content in divs (signature lines)
      const divInline = content.replace(/<(p|table)[^>]*>[\s\S]*?<\/\1>/gi, '').trim();
      if (divInline && /</.test(divInline)) {
        const runs = parseInlineHtml(divInline);
        if (runs.some(r => r.text.trim())) {
          const styleMatch = attrs.match(/text-align:\s*(center|right)/i);
          const alignment = styleMatch
            ? styleMatch[1].toLowerCase() === 'center' ? AlignmentType.CENTER : AlignmentType.RIGHT
            : AlignmentType.LEFT;
          children.push(makeParagraph(runs, { alignment }));
        }
      }
    }
  }

  // If no blocks were parsed (fallback), create a simple paragraph with all text
  if (children.length === 0) {
    const allText = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    children.push(new Paragraph({
      children: [new TextRun({ text: allText, font: FONT, size: FONT_SIZE })],
    }));
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
          pageNumbers: { start: 1 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT,
                  size: 18,
                }),
              ],
            }),
          ],
        }),
      },
      children,
    }],
    numbering: { config: [] },
    styles: {
      default: {
        document: {
          run: { font: FONT, size: FONT_SIZE },
          paragraph: {
            spacing: { line: 360 },  // 1.5 line spacing
          },
        },
        heading1: {
          run: { font: FONT, size: 32, bold: true },
          paragraph: { alignment: AlignmentType.CENTER },
        },
      },
      paragraphStyles: [],
    },
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
