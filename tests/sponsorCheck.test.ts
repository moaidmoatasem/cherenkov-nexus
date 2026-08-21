import { describe, it, expect } from "vitest";
import type { Client } from "@libsql/client";
import { checkVisaSponsorship, matchSponsorOnRegister } from "../src/server/sponsorCheck";

/**
 * A stand-in for the register table.
 *
 * The real query is anchored (`= ?`, `LIKE 'q %'`, `LIKE 'lead %'`), so the
 * stub applies those same three predicates rather than returning everything.
 * A stub that ignored them would pass even if the anchoring regressed, which
 * is the bug these tests exist to catch.
 */
function registerStub(names: string[]): Client {
  return {
    execute: async ({ args }: { sql: string; args: unknown[] }) => {
      const [exact, prefix, leadPrefix] = args as string[];
      const like = (value: string, pattern: string) =>
        value.startsWith(pattern.slice(0, -2) + " ");
      const rows = names
        .filter((name) => {
          const lower = name.toLowerCase();
          return lower === exact || like(lower, prefix) || like(lower, leadPrefix);
        })
        .map((name) => ({ name }));
      return { rows } as never;
    },
  } as unknown as Client;
}

/** A register that cannot be reached at all. */
const brokenDb = {
  execute: async () => {
    throw new Error("SQLITE_CORRUPT: database disk image is malformed");
  },
} as unknown as Client;

const REGISTER = [
  "Google",
  "Amazon",
  "Monzo Bank",
  "Monzo Bank Ltd",
  "Revolut",
  "Deliveroo",
];

describe("matchSponsorOnRegister", () => {
  it("resolves an exact registered name", async () => {
    expect(await matchSponsorOnRegister("Monzo Bank", registerStub(REGISTER))).toBe("Monzo Bank");
  });

  it("resolves a longer legal name from its leading token", async () => {
    expect(await matchSponsorOnRegister("Monzo Bank Ltd", registerStub(REGISTER))).toBe(
      "Monzo Bank Ltd"
    );
  });

  it("returns nothing for a company that is not registered", async () => {
    expect(await matchSponsorOnRegister("Definitely Not A Sponsor Ltd", registerStub(REGISTER)))
      .toBeNull();
  });
});

describe("checkVisaSponsorship — false positives that used to slip through", () => {
  // The retrieval was `LOWER(name) LIKE '%query%'` with `LIMIT 1`, so any
  // short string matched an arbitrary row and reported it as licensed.
  it.each(["o", "n", "Goo", "a"])(
    "does not report a sponsor for the fragment %j",
    async (fragment) => {
      const result = await checkVisaSponsorship(fragment, "", registerStub(REGISTER));
      expect(result.isLicensedSponsor).toBe(false);
      expect(result.matchedSponsor).toBeUndefined();
    }
  );

  // The bundled array matched substrings in both directions, so a company
  // whose name merely contained "Amazon" was reported as Amazon.
  it("does not resolve a fictional company to a real sponsor it contains", async () => {
    const result = await checkVisaSponsorship(
      "Amazonia Fake Corp Ltd",
      "",
      registerStub(REGISTER)
    );
    expect(result.isLicensedSponsor).toBe(false);
  });

  it("still resolves genuine registered employers", async () => {
    for (const company of ["Monzo Bank", "Revolut", "Deliveroo"]) {
      const result = await checkVisaSponsorship(company, "", registerStub(REGISTER));
      expect(result.isLicensedSponsor).toBe(true);
      expect(result.matchedSponsor).toBe(company);
      expect(result.sponsorSource).toBe("register");
    }
  });
});

describe("checkVisaSponsorship — the register and the posting are separate claims", () => {
  it("does not treat a sponsorship claim in the posting as a register match", async () => {
    const result = await checkVisaSponsorship(
      "Definitely Not A Sponsor Ltd",
      "We offer visa sponsorship for this role.",
      registerStub(REGISTER)
    );
    expect(result.isLicensedSponsor).toBe(false);
    expect(result.postingClaimsSponsorship).toBe(true);
    expect(result.sponsorSource).toBe("none");
  });

  it("reports a register match independently of the posting text", async () => {
    const result = await checkVisaSponsorship("Monzo Bank", "", registerStub(REGISTER));
    expect(result.isLicensedSponsor).toBe(true);
    expect(result.postingClaimsSponsorship).toBe(false);
  });
});

describe("checkVisaSponsorship — degraded register", () => {
  it("flags that the register could not be consulted", async () => {
    const result = await checkVisaSponsorship("Monzo Bank", "", brokenDb);
    expect(result.registerAvailable).toBe(false);
  });

  it("falls back to the bundled list only on a full normalised name", async () => {
    const result = await checkVisaSponsorship("Monzo Bank", "", brokenDb);
    expect(result.isLicensedSponsor).toBe(true);
    expect(result.sponsorSource).toBe("offline-list");
  });

  it("does not substring-match the bundled list when the register is down", async () => {
    const result = await checkVisaSponsorship("Amazonia Fake Corp Ltd", "", brokenDb);
    expect(result.isLicensedSponsor).toBe(false);
  });
});

describe("checkVisaSponsorship — queries too short to identify an employer", () => {
  it("does not consult the register for a single character", async () => {
    let consulted = false;
    const spy = {
      execute: async () => {
        consulted = true;
        return { rows: [] } as never;
      },
    } as unknown as Client;

    const result = await checkVisaSponsorship("o", "", spy);
    expect(consulted).toBe(false);
    expect(result.isLicensedSponsor).toBe(false);
  });

  it("treats an empty company name as unanswerable", async () => {
    const result = await checkVisaSponsorship("", "", registerStub(REGISTER));
    expect(result.isLicensedSponsor).toBe(false);
    expect(result.sponsorSource).toBe("none");
  });
});
