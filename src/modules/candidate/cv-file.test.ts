import { describe, expect, it } from "vitest";
import {
  CV_MAX_BYTES,
  DOCX,
  PDF,
  checkCvFile,
  cleanFilename,
  detectCvType,
} from "./cv-file";

const bytes = (s: string) => new TextEncoder().encode(s);
const docx = () => {
  const b = new Uint8Array(200);
  b.set([0x50, 0x4b, 0x03, 0x04]);
  b.set(bytes("word/document.xml"), 40);
  return b;
};

describe("detectCvType (by content, NFR-SEC-008)", () => {
  it("recognises PDF and DOCX", () => {
    expect(detectCvType(bytes("%PDF-1.7 ..."))).toBe(PDF);
    expect(detectCvType(docx())).toBe(DOCX);
  });

  it("rejects other files, even when renamed", () => {
    expect(detectCvType(bytes("<html><script>alert(1)</script>"))).toBeNull(); // "cv.pdf" that is HTML
    expect(detectCvType(bytes("MZ\x90\x00"))).toBeNull(); // Windows executable
    const zip = new Uint8Array(50);
    zip.set([0x50, 0x4b, 0x03, 0x04]); // a ZIP that isn't a Word document
    expect(detectCvType(zip)).toBeNull();
  });
});

describe("checkCvFile", () => {
  it("accepts a small PDF", () => {
    expect(checkCvFile(bytes("%PDF-1.4 tiny"))).toEqual({
      ok: true,
      type: PDF,
    });
  });

  it("refuses empty, too large and wrong-type files with the right status", () => {
    expect(checkCvFile(new Uint8Array(0))).toMatchObject({
      ok: false,
      status: 415,
    });
    const big = new Uint8Array(CV_MAX_BYTES + 1);
    big.set(bytes("%PDF-"));
    expect(checkCvFile(big)).toMatchObject({ ok: false, status: 413 });
    expect(checkCvFile(bytes("hello"))).toMatchObject({
      ok: false,
      status: 415,
    });
  });

  it("accepts exactly 5 MB", () => {
    const max = new Uint8Array(CV_MAX_BYTES);
    max.set(bytes("%PDF-"));
    expect(checkCvFile(max).ok).toBe(true);
  });
});

describe("cleanFilename", () => {
  it("strips paths, control characters and fixes the extension to match the content", () => {
    expect(cleanFilename("C:\\Users\\amira\\My CV.PDF", PDF)).toBe("My CV.pdf");
    expect(cleanFilename("../../etc/passwd", PDF)).toBe("passwd.pdf");
    expect(cleanFilename("cv\u0000\u001f.docx", DOCX)).toBe("cv.docx");
    expect(cleanFilename("evil.exe", PDF)).toBe("evil.exe.pdf");
    expect(cleanFilename("", DOCX)).toBe("CV.docx");
  });
});
