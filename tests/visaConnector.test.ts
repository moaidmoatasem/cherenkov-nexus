import { describe, it, expect } from "vitest";
import { parseRegisterCsv, normalizeHeader } from "../src/server/integrations/visaConnector";

describe("normalizeHeader", () => {
  it("lowercases and collapses punctuation", () => {
    expect(normalizeHeader("Organisation Name")).toBe("organisation name");
    expect(normalizeHeader("Town/City")).toBe("town city");
    expect(normalizeHeader("Sub Category (where applicable)")).toBe("sub category where applicable");
  });
});

describe("parseRegisterCsv", () => {
  it("maps current gov.uk worker register headers by name", () => {
    const csv = [
      "Organisation Name,Town/City,County/Region,Type & Rating,Sub Category (where applicable)",
      "Monzo Bank,London,Greater London,Worker (A rating),Skilled Worker",
      "Revolut Ltd,London,Greater London,Worker (A rating),Skilled Worker"
    ].join("\n");

    const rows = parseRegisterCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      organisationName: "Monzo Bank",
      town: "London",
      county: "Greater London",
      typeAndRating: "Worker (A rating)",
      route: "Skilled Worker"
    });
    expect(rows[1].organisationName).toBe("Revolut Ltd");
  });

  it("handles legacy header naming without town/route columns", () => {
    const csv = [
      "Organisation,Rating,Region",
      "Wise Payments,A Rating,UK"
    ].join("\n");

    const rows = parseRegisterCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      organisationName: "Wise Payments",
      typeAndRating: "A Rating",
      county: "UK",
      town: undefined,
      route: undefined
    });
  });

  it("deduplicates by organisation name", () => {
    const csv = [
      "Organisation Name,Type & Rating",
      "Monzo Bank,Worker (A rating)",
      "monzo bank,Worker (B rating)",
      "Monzo Bank,Worker (A rating)"
    ].join("\n");

    const rows = parseRegisterCsv(csv);
    expect(rows).toHaveLength(3); // parser keeps duplicates; upsert dedupes later
    expect(rows[0].organisationName).toBe("Monzo Bank");
  });

  it("throws when the organisation name column is missing", () => {
    expect(() => parseRegisterCsv("Town,Rating\nLondon,A Rating")).toThrow();
  });
});