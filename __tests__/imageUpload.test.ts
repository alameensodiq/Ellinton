/// <reference types="jest" />

import { isValidDocumentDataUri, normalizeDataUri } from "../app/lib/imageUpload";

describe("normalizeDataUri", () => {
  it("adds the correct image/png data URI prefix for raw base64", () => {
    expect(normalizeDataUri("abcd", "image/png")).toBe(
      "data:image/png;base64,abcd"
    );
  });

  it("keeps a valid backend-compliant URI unchanged", () => {
    const value = "data:image/jpeg;base64,abcd";
    expect(normalizeDataUri(value, "image/png")).toBe(value);
    expect(isValidDocumentDataUri(value)).toBe(true);
  });

  it("accepts PDF data URIs", () => {
    const value = "data:application/pdf;base64,JVBERi0xLjQK";
    expect(isValidDocumentDataUri(value)).toBe(true);
    expect(normalizeDataUri(value, "image/png")).toBe(value);
  });
});
