/** CV upload rules (FR-CAN-005, NFR-SEC-008). Pure functions – unit tested. */

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_MAX_COUNT = 5;

export const PDF = "application/pdf";
export const DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export type CvMimeType = typeof PDF | typeof DOCX;

/**
 * The real type, from the file's bytes – never from its name or the browser's claim.
 * PDF: starts with "%PDF-". DOCX: a ZIP ("PK\x03\x04") containing word/document.xml.
 */
export function detectCvType(bytes: Uint8Array): CvMimeType | null {
  const head = String.fromCharCode(...bytes.subarray(0, 5));
  if (head === "%PDF-") return PDF;
  const isZip =
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;
  if (isZip && Buffer.from(bytes).includes("word/document.xml")) return DOCX;
  return null;
}

/** A display name: no path, no control characters, sensible length, correct extension. */
export function cleanFilename(name: string, type: CvMimeType): string {
  const base = (name.split(/[\\/]/).pop() ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\.(pdf|docx)$/i, "")
    .trim()
    .slice(0, 100);
  return `${base || "CV"}.${type === PDF ? "pdf" : "docx"}`;
}

export type CvCheck =
  | { ok: true; type: CvMimeType }
  | { ok: false; status: 413 | 415; message: string };

export function checkCvFile(bytes: Uint8Array): CvCheck {
  if (bytes.byteLength === 0)
    return { ok: false, status: 415, message: "The file is empty." };
  if (bytes.byteLength > CV_MAX_BYTES)
    return { ok: false, status: 413, message: "CVs can be up to 5 MB." };
  const type = detectCvType(bytes);
  if (!type)
    return {
      ok: false,
      status: 415,
      message: "Upload a PDF or Word (.docx) file.",
    };
  return { ok: true, type };
}
