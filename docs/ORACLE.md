# Sponsorship Eligibility Oracle — V1

Scope: the UK Skilled Worker route, and nothing else. Per `NEXUS_V3.0_FINAL` §5.

Not in V1: evidence graph, probes, proof page, credentials, feed, auto-apply,
Kanban integration, employer accounts, market intelligence.

---

## What it does

Reads a job posting, checks it against the Register of Licensed Sponsors and a
pinned rules snapshot, and returns a verdict that **names the one rule that
decides it**.

```
Occupation going rate — £44,000 < £49,400 · shortfall £5,400 · 37.5 h/wk basis.
                                                       SW 14.2 · Table 1, row 2136
```

Not a match score. Not a percentage. A named binding constraint with a citation
you can go and check.

---

## Layout

| Path | Role |
|---|---|
| `src/oracle/types.ts` | Contracts. Applicant record carries only what the rules test. |
| `src/oracle/evaluate.ts` | **The verdict function.** Pure, deterministic, no LLM. |
| `src/oracle/snapshot.ts` | Snapshot load, integrity hash, staleness, diffing. |
| `src/oracle/register.ts` | Sponsor name matching — ranks, never silently picks. |
| `src/oracle/soc.ts` | Occupation code suggestion — suggests, never selects. |
| `src/oracle/routes.ts` | HTTP surface, mounted at `/api/oracle`. |
| `src/components/OracleWorkbench.tsx` | The interface. Scoped styles. |
| `data/snapshots/*.json` | Immutable, content-addressed rules snapshots. |
| `scripts/oracle-seal.ts` | Recompute snapshot ids after editing. |
| `tests/oracle/` | 97 tests, including the golden set. |

---

## Acceptance criteria

Each is enforced by a named test, not by convention.

| AC | Requirement | Enforced by |
|---|---|---|
| **AC-1** | Every verdict names the binding constraint. Never a bare yes/no, never a score. | `evaluate.test.ts` › *AC-1 · binding constraint* |
| **AC-2** | Verdict is a pure function of (posting, applicant, snapshot). Byte-identical across 100 runs. No LLM in the verdict path. | `evaluate.test.ts` › *AC-2 · the verdict is a pure function* |
| **AC-3** | Every verdict cites its snapshot date and source table row. | `evaluate.test.ts` › *AC-3 · every constraint cites an authority* |
| **AC-4** | Occupation code is never auto-selected. | `UnconfirmedSocError`; route returns `422 SOC_UNCONFIRMED` |
| **AC-5** | Tradeable-point paths reported separately, never silently applied. | `evaluate.test.ts` › *AC-5 · tradeable points* |
| **AC-6** | Snapshots versioned and diffable; a rules change re-flags prior checks. | `snapshot.test.ts` › *snapshot diffing* |
| **AC-7** | Zero PII. | Applicant type carries no identifying field; `evaluate.test.ts` › *AC-7* |
| **AC-8** | No LinkedIn dependency anywhere. | Only Greenhouse / Lever / Ashby public feeds are reachable |
| **AC-9** | Disclaimer on every verdict. | `evaluate.test.ts` › *AC-9* |

### AC-2 in practice

`evaluate()` takes no clock, opens no socket, and reads no global. Everything —
including the rules snapshot and the time the posting was read — is an explicit
argument. Currency formatting is hand-rolled rather than `Intl`, because locale
data drifts between Node versions and a verdict must not.

---

## The rules pipeline is the company

> A stale snapshot produces confidently wrong verdicts, and the product's only
> asset is being right. — `NEXUS_V1_DESIGN_AND_OPERATIONS` §3.1

Snapshots are **content-addressed**: the id is `{route}-{date}+{sha256[:12]}`
over the canonical JSON. Editing a snapshot without resealing makes it fail
validation at load. `npm run oracle:seal:check` runs in `test:ci`.

```bash
npm run oracle:seal          # rewrite ids after editing a snapshot
npm run oracle:seal:check    # fail if any id is stale (CI)
```

### The shipped snapshot is unverified, on purpose

`data/snapshots/uk-skilled-worker-2026-08-14.json` carries `verified: false`.
Its occupation rows are **illustrative** — they have not been read from Appendix
Skilled Occupations against a primary source.

Two things follow, both deliberate:

1. Every verdict computed from it is stamped `provisional: true`, and the
   interface shows a banner that cannot be dismissed.
2. `POST /api/oracle/verdict` returns **409 `SNAPSHOT_UNVERIFIED`** unless the
   caller passes `allowProvisional: true`.

This is §2 of `NEXUS_V3.0_FINAL` applied in code: data without a named source,
date, and measurement does not get to decide anything. **Replacing the
occupations block with verified data is the first task before any real use.**

---

## API

| Method | Path | Decides? |
|---|---|---|
| `GET` | `/api/oracle/snapshot` | no — reports loaded rules, age, verified state |
| `POST` | `/api/oracle/posting` | no — reads a public ATS feed |
| `POST` | `/api/oracle/sponsor` | no — ranks register candidates |
| `POST` | `/api/oracle/soc` | no — ranks occupation codes |
| `POST` | `/api/oracle/verdict` | **yes** |

```bash
curl -X POST localhost:3000/api/oracle/verdict \
  -H 'Content-Type: application/json' \
  -d '{
    "posting": {"company":"Monzo Bank","title":"Senior QA Automation Engineer",
                "salaryGbp":44000,"hoursPerWeek":37.5},
    "applicant": {"englishCefr":"B2"},
    "socCode": "2136", "socConfirmed": true,
    "allowProvisional": true
  }'
```

Only Greenhouse, Lever and Ashby are reachable from `/posting` — public,
unauthenticated, read-only feeds (`NEXUS_V3.0_FINAL` V1). Any other host returns
422. There is no LinkedIn path, by construction (AC-8, V4).

---

## Sponsor matching

The previous matcher was `LIKE '%name%' … LIMIT 1` against 126,998 rows. For a
query of `Wise` it returned **"Aaron Wise Limited"** and reported it as a
verified legal fact; for an empty company name it matched `LIKE '%%'` and
returned **"Google"**.

`src/oracle/register.ts` normalises names, strips legal-form suffixes, scores
exact → normalised → leading-token → token-overlap, and **refuses to
auto-confirm** unless the top candidate is both strong and clearly ahead of the
runner-up. Ambiguity becomes a question, not a guess.

Both defects are pinned by regression tests in `tests/oracle/register.test.ts`.

---

## Occupation codes — the liability line

The sponsor bears sole responsibility for the code on a Certificate of
Sponsorship, and a wrong code causes refusal. If the Oracle ever picks one, a
refused visa becomes attributable to the Oracle.

So `rankSocCandidates()` ranks and explains; `evaluate()` throws
`UnconfirmedSocError` on an unconfirmed code. The rule is architectural, not a
UI convention someone can forget. When two plausible codes carry materially
different going rates, the interface shows both rates side by side, says plainly
that the choice changes the verdict, and links CASCOT.

---

## Verdict outcomes

| Outcome | Meaning |
|---|---|
| `ELIGIBLE` | Every constraint satisfied. |
| `INELIGIBLE` | A constraint failed. `binding` names the first failure in statutory order. |
| `CONDITIONAL` | Default path fails, but a tradeable option **the applicant can actually claim** would clear it. Reported separately; never applied. |
| `CANNOT_DETERMINE` | An input is missing. Says which one. |

An option the applicant cannot claim leaves the verdict `INELIGIBLE` — an
unreachable alternative is not a condition.

---

## Before this goes near a real user

1. **Replace the occupation rows** with verified Appendix Skilled Occupations
   data, then set `verified: true` and reseal.
2. **Solicitor review** of the disclaimer, the "not advice" framing, and the
   SOC-confirmation language (AC-9). UK immigration advice is regulated; one
   disclaimer paragraph is a note that you noticed, not a mitigation.
3. **Build the ingestion pipeline** — `fetch → checksum → diff → validate →
   snapshot → version → publish → re-flag`, with a material diff halting for
   human sign-off. The diffing half exists (`diffSnapshots`, `codesAffectedBy`);
   the fetch and publish halves do not.
4. **Golden-set expansion** to ~40 hand-verified scenarios. 13 are in place.

---

## Running it

```bash
npm run dev                              # http://localhost:3000 → Sponsorship Oracle
npx vitest run tests/oracle              # 97 tests
npm run test:ci                          # typecheck + seal check + all tests
```
