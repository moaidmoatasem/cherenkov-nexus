import { describe, it, expect } from "vitest";
import { identifyHost, fetchAtsJob } from "../src/server/integrations/atsConnector";

describe("identifyHost", () => {
  it("recognizes Greenhouse boards", () => {
    expect(identifyHost("https://boards.greenhouse.io/monzo/jobs/7343996")).toBe("greenhouse");
    expect(identifyHost("https://job-boards.greenhouse.io/monzo/jobs/7343996")).toBe("greenhouse");
  });

  it("recognizes Lever job sites", () => {
    expect(identifyHost("https://jobs.lever.co/monzo/abc123")).toBe("lever");
  });

  it("recognizes Ashby boards", () => {
    expect(identifyHost("https://jobs.ashbyhq.com/monzo/xyz456")).toBe("ashby");
  });

  it("treats unknown hosts as generic", () => {
    expect(identifyHost("https://example.com/careers")).toBe("generic");
  });

  it("handles malformed URLs as generic", () => {
    expect(identifyHost("not-a-url")).toBe("generic");
  });
});

describe("fetchAtsJob", () => {
  it("rejects unsupported hosts without hanging", async () => {
    await expect(
      fetchAtsJob("http://127.0.0.1:9/") // fast connection-refused instead of real network
    ).rejects.toBeTruthy();
  });
});