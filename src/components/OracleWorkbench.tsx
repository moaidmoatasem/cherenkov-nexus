/**
 * Sponsorship Eligibility Oracle — the interface.
 *
 * Journey J1 from NEXUS_V1_DESIGN_AND_OPERATIONS: paste a posting, confirm the
 * occupation code, read the verdict. Three states, one mandatory human step.
 *
 * Visual language is the one specified in that document — inks and stamp
 * pigments rather than dark-mode-with-a-neon-accent, Spectral for the verdict
 * sentence, IBM Plex Mono for anything that came out of a government table.
 * Styles are scoped to `.oracle` so the surrounding application's theme engine
 * cannot bleed into a compliance instrument.
 */

import React, { useEffect, useMemo, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Contracts (mirror src/oracle/types.ts)
// ─────────────────────────────────────────────────────────────────────────────

type ConstraintStatus = 'satisfied' | 'failed' | 'not_applicable' | 'undetermined';

interface Citation {
  authority: string;
  paragraph?: string;
  table?: string;
  row?: string;
}

interface ConstraintResult {
  id: string;
  name: string;
  status: ConstraintStatus;
  detail: string;
  citation: Citation;
  binding?: boolean;
}

interface TradeableResult {
  id: string;
  name: string;
  claimable: boolean;
  reason: string;
  requiredSalaryGbp?: number;
  wouldClearBinding: boolean;
  citation: Citation;
}

interface Verdict {
  outcome: 'ELIGIBLE' | 'INELIGIBLE' | 'CONDITIONAL' | 'CANNOT_DETERMINE';
  binding: ConstraintResult | null;
  statement: string;
  constraints: ConstraintResult[];
  tradeable: TradeableResult[];
  socCode: string;
  sponsor: { registeredName: string; route?: string; rating?: string } | null;
  snapshot: { id: string; effectiveDate: string; verified: boolean };
  provisional: boolean;
  inputs: {
    company: string;
    title: string;
    salaryGbp?: number;
    hoursPerWeek?: number;
    sourceUrl?: string;
    retrievedAt?: string;
  };
  disclaimer: string;
}

interface SocCandidate {
  code: string;
  title: string;
  rqfLevel: number;
  goingRateGbp: number;
  score: number;
  matchedTerms: string[];
}

interface SponsorCandidate {
  registeredName: string;
  route?: string;
  rating?: string;
  town?: string;
  score: number;
  basis: string;
}

interface SnapshotInfo {
  id: string;
  effectiveDate: string;
  verified: boolean;
  ageDays: number;
  stale: boolean;
  provenance: { caveats: string[]; sources: string[] };
  occupationCount: number;
}

type Stage = 'input' | 'confirm' | 'verdict';

const gbp = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;

const GLYPH: Record<ConstraintStatus, string> = {
  satisfied: '✓',
  failed: '✕',
  not_applicable: '—',
  undetermined: '?',
};

const VERDICT_WORD: Record<Verdict['outcome'], string> = {
  ELIGIBLE: 'Eligible',
  INELIGIBLE: 'Not eligible',
  CONDITIONAL: 'Conditional',
  CANNOT_DETERMINE: 'Cannot determine',
};

// ─────────────────────────────────────────────────────────────────────────────

export const OracleWorkbench: React.FC = () => {
  const [stage, setStage] = useState<Stage>('input');
  const [snapshot, setSnapshot] = useState<SnapshotInfo | null>(null);
  const [busy, setBusy] = useState(false);
  /**
   * The first sponsor lookup after a server start pays for a one-off migration
   * over ~127k register rows. A bare spinner reads as a hang, so once a check
   * has been running for a few seconds, say what it is waiting on.
   */
  const [slowFirstCheck, setSlowFirstCheck] = useState(false);

  useEffect(() => {
    if (!busy) {
      setSlowFirstCheck(false);
      return;
    }
    const timer = setTimeout(() => setSlowFirstCheck(true), 3000);
    return () => clearTimeout(timer);
  }, [busy]);
  const [error, setError] = useState<string | null>(null);

  // Posting under check
  const [company, setCompany] = useState('Monzo Bank');
  const [title, setTitle] = useState('Senior QA Automation Engineer');
  const [salary, setSalary] = useState('44000');
  const [hours, setHours] = useState('37.5');
  const [duties, setDuties] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  // Applicant — only what the rules test (AC-7)
  const [englishCefr, setEnglishCefr] = useState('B2');
  const [newEntrant, setNewEntrant] = useState(false);
  const [hasPhd, setHasPhd] = useState(false);

  // Confirmation step
  const [socCandidates, setSocCandidates] = useState<SocCandidate[]>([]);
  const [socAmbiguous, setSocAmbiguous] = useState(false);
  const [chosenSoc, setChosenSoc] = useState<string | null>(null);
  const [manualSoc, setManualSoc] = useState('');
  const [sponsorCandidates, setSponsorCandidates] = useState<SponsorCandidate[]>([]);
  const [chosenSponsor, setChosenSponsor] = useState<SponsorCandidate | null>(null);
  const [sponsorMessage, setSponsorMessage] = useState<string | null>(null);

  const [verdict, setVerdict] = useState<Verdict | null>(null);

  useEffect(() => {
    fetch('/api/oracle/snapshot')
      .then((r) => r.json())
      .then(setSnapshot)
      .catch(() => setSnapshot(null));
  }, []);

  const effectiveSoc = chosenSoc ?? (manualSoc.trim() || null);

  const socRates = useMemo(() => {
    const map: Record<string, number> = {};
    socCandidates.forEach((c) => {
      map[c.code] = c.goingRateGbp;
    });
    return map;
  }, [socCandidates]);

  async function readPosting() {
    if (!sourceUrl.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/oracle/posting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not read that posting.');
      setCompany(data.posting.company ?? '');
      setTitle(data.posting.title ?? '');
      if (data.posting.salaryGbp) setSalary(String(data.posting.salaryGbp));
      setDuties(data.duties ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function goToConfirm() {
    setBusy(true);
    setError(null);
    try {
      const [socRes, sponsorRes] = await Promise.all([
        fetch('/api/oracle/soc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, duties }),
        }).then((r) => r.json()),
        fetch('/api/oracle/sponsor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company }),
        }).then((r) => r.json()),
      ]);

      setSocCandidates(socRes.candidates ?? []);
      setSocAmbiguous(Boolean(socRes.ambiguous));
      setChosenSoc(null);
      setManualSoc('');

      setSponsorCandidates(sponsorRes.candidates ?? []);
      setChosenSponsor(sponsorRes.confirmed ? (sponsorRes.candidates?.[0] ?? null) : null);
      setSponsorMessage(sponsorRes.message ?? null);

      setStage('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function runCheck() {
    if (!effectiveSoc) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/oracle/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posting: {
            company,
            title,
            salaryGbp: salary.trim() ? Number(salary) : undefined,
            hoursPerWeek: hours.trim() ? Number(hours) : undefined,
            sourceUrl: sourceUrl.trim() || undefined,
            retrievedAt: new Date().toISOString(),
          },
          applicant: {
            englishCefr: englishCefr || undefined,
            newEntrantBasis: newEntrant ? 'under_26' : undefined,
            hasRelevantPhd: hasPhd || undefined,
          },
          socCode: effectiveSoc,
          socConfirmed: true,
          sponsorCandidate: chosenSponsor,
          // The shipped snapshot is unverified; the API refuses it unless the
          // caller says so explicitly. The banner keeps that visible on screen.
          allowProvisional: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'SPONSOR_UNCONFIRMED') {
          setSponsorCandidates(data.candidates ?? []);
          throw new Error('More than one registered company could be this employer. Choose one below.');
        }
        throw new Error(data.error ?? 'Check failed.');
      }
      setVerdict(data.verdict);
      setStage('verdict');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setStage('input');
    setVerdict(null);
    setError(null);
  }

  return (
    <div className="oracle">
      <style>{ORACLE_CSS}</style>

      <div className="o-bar">
        <span>
          <b>CHERENKOV</b> · Sponsorship Oracle
        </span>
        {snapshot && !snapshot.verified && <span className="o-flag">UNVERIFIED RULES</span>}
        <span className="o-snap">
          {snapshot
            ? <>Rules snapshot <em>{snapshot.effectiveDate}</em> · {snapshot.occupationCount} occupations</>
            : 'Loading rules snapshot…'}
        </span>
      </div>

      {snapshot && !snapshot.verified && (
        <div className="o-warn-strip">
          <b>These rules have not been verified against a primary source.</b>
          {' '}Verdicts below exercise the engine end to end. They are not reliable and must not inform a real application.
        </div>
      )}

      {snapshot?.stale && (
        <div className="o-warn-strip o-stale">
          Rules snapshot is {snapshot.ageDays} days old. Verdicts may not reflect current rules.
        </div>
      )}

      {error && (
        <div className="o-error" role="alert">
          {error}
        </div>
      )}

      {/* ─── STATE 1 · INPUT ─────────────────────────────────────────────── */}
      {stage === 'input' && (
        <div className="o-shell">
          <div className="o-left">
            <p className="o-eyebrow">Check a role</p>
            <h2 className="o-h2">Can this role sponsor you?</h2>
            <p className="o-hint">
              The Oracle checks a posting against the Register of Licensed Sponsors and the
              occupation table, and names the rule that decides it.
            </p>

            <div className="o-field">
              <label htmlFor="o-url">Job posting URL — optional</label>
              <div className="o-row-inline">
                <input
                  id="o-url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://boards.greenhouse.io/…"
                  spellCheck={false}
                />
                <button className="o-act o-ghost" onClick={readPosting} disabled={busy || !sourceUrl.trim()}>
                  Read
                </button>
              </div>
              <p className="o-hint o-sm">
                Reads public, unauthenticated ATS feeds — Greenhouse, Lever, Ashby. No scraping, no
                account risk.
              </p>
            </div>

            <div className="o-field">
              <label htmlFor="o-company">Employer</label>
              <input id="o-company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="o-field">
              <label htmlFor="o-title">Job title</label>
              <input id="o-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="o-grid2">
              <div className="o-field">
                <label htmlFor="o-salary">Salary, £/year</label>
                <input id="o-salary" value={salary} onChange={(e) => setSalary(e.target.value)} inputMode="numeric" />
              </div>
              <div className="o-field">
                <label htmlFor="o-hours">Hours / week</label>
                <input id="o-hours" value={hours} onChange={(e) => setHours(e.target.value)} inputMode="decimal" />
              </div>
            </div>

            <button className="o-act" onClick={goToConfirm} disabled={busy || !company.trim() || !title.trim()}>
              {busy ? 'Working…' : 'Check role →'}
            </button>
            {busy && slowFirstCheck && (
              <p className="o-hint o-sm" role="status" style={{ marginTop: 10 }}>
                Preparing the sponsor register. This happens once after the app starts and takes
                up to a minute — later checks are immediate.
              </p>
            )}
          </div>

          <div className="o-right">
            <p className="o-eyebrow">Your attributes</p>
            <p className="o-binding" style={{ marginTop: 4, marginBottom: 20 }}>
              Only what the rules actually test. No name, no date of birth, no passport.
            </p>

            <div className="o-field">
              <label htmlFor="o-cefr">English, CEFR level</label>
              <select id="o-cefr" value={englishCefr} onChange={(e) => setEnglishCefr(e.target.value)}>
                {['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l) => (
                  <option key={l || 'none'} value={l}>
                    {l || 'Not recorded'}
                  </option>
                ))}
              </select>
            </div>

            <label className="o-check">
              <input type="checkbox" checked={newEntrant} onChange={(e) => setNewEntrant(e.target.checked)} />
              <span>
                I can evidence a new-entrant basis
                <em>Under 26, switching from a Student visa, postdoctoral, or working toward a professional qualification.</em>
              </span>
            </label>

            <label className="o-check">
              <input type="checkbox" checked={hasPhd} onChange={(e) => setHasPhd(e.target.checked)} />
              <span>
                I hold a PhD relevant to this occupation
                <em>Reported as a separate path. Never applied to the verdict automatically.</em>
              </span>
            </label>

            <p className="o-eyebrow" style={{ marginTop: 30 }}>What gets checked</p>
            <div className="o-ledger">
              {[
                ['Sponsor licence', 'Register'],
                ['Occupation eligibility', 'Occupation table'],
                ['Skill level', 'Occupation table'],
                ['General salary threshold', 'SW 14.1'],
                ['Occupation going rate', 'SW 14.2'],
                ['Hourly floor', 'SW 14.4'],
                ['English language', 'SW 6'],
              ].map(([name, ref]) => (
                <div className="o-lrow" key={name}>
                  <span className="o-glyph o-n">·</span>
                  <div className="o-lname">{name}</div>
                  <div className="o-lref">{ref}</div>
                </div>
              ))}
            </div>
            <p className="o-disc">
              Informational only. Not immigration advice. Occupation codes must be confirmed by you —
              the sponsor bears sole responsibility for the code on a Certificate of Sponsorship, and
              an incorrect code causes refusal.
            </p>
          </div>
        </div>
      )}

      {/* ─── STATE 2 · CONFIRM ───────────────────────────────────────────── */}
      {stage === 'confirm' && (
        <div className="o-shell">
          <div className="o-left">
            <p className="o-eyebrow">Posting</p>
            <h2 className="o-posting-title">{title}</h2>
            <p className="o-co">{company}</p>
            <dl className="o-facts">
              <dt>Salary</dt>
              <dd>{salary ? gbp(Number(salary)) : '—'}</dd>
              <dt>Hours</dt>
              <dd>{hours || '—'} / week</dd>
            </dl>

            <p className="o-eyebrow" style={{ marginTop: 28 }}>Sponsor licence</p>
            {sponsorCandidates.length === 0 && (
              <p className="o-hint">{sponsorMessage ?? 'No match on the register.'}</p>
            )}
            {sponsorCandidates.map((c) => (
              <button
                key={c.registeredName}
                className="o-soc o-compact"
                aria-checked={chosenSponsor?.registeredName === c.registeredName}
                role="radio"
                onClick={() => setChosenSponsor(c)}
              >
                <div className="o-soc-in o-soc-in2">
                  <div>
                    <div className="o-soc-t">{c.registeredName}</div>
                    <div className="o-soc-d">
                      {[c.route, c.rating, c.town].filter(Boolean).join(' · ') || 'Listed on the register'}
                    </div>
                  </div>
                  <span className="o-soc-conf">{(c.score * 100).toFixed(0)}%</span>
                </div>
              </button>
            ))}
          </div>

          <div className="o-right">
            <p className="o-eyebrow">Step 1 of 1 · Confirm the occupation code</p>
            <h2 className="o-h2">Which code matches the duties?</h2>
            <p className="o-hint" style={{ marginBottom: 22, maxWidth: '56ch' }}>
              Duties decide the code, not the job title. The going rate — and therefore the verdict —
              changes with the code you pick.
            </p>

            {socCandidates.map((c) => (
              <button
                key={c.code}
                className="o-soc"
                role="radio"
                aria-checked={chosenSoc === c.code}
                onClick={() => {
                  setChosenSoc(c.code);
                  setManualSoc('');
                }}
              >
                <div className="o-soc-in">
                  <span className="o-soc-code">{c.code}</span>
                  <div>
                    <div className="o-soc-t">{c.title}</div>
                    <div className="o-soc-d">
                      Going rate {gbp(c.goingRateGbp)} · matched on {c.matchedTerms.join(', ') || 'title'}
                    </div>
                  </div>
                  <span className="o-soc-conf">RQF {c.rqfLevel}</span>
                </div>
              </button>
            ))}

            {socCandidates.length === 0 && (
              <p className="o-hint">
                No occupation code could be suggested from that title. Enter one below.
              </p>
            )}

            {socAmbiguous && (
              <div className="o-warnbox">
                <b>More than one code is plausible</b>
                Their going rates differ by {gbp(Math.abs((socRates[socCandidates[0]?.code] ?? 0) - (socRates[socCandidates[1]?.code] ?? 0)))},
                which changes the verdict. Check the duties against CASCOT and keep a dated record of
                why you chose. This tool suggests; it never selects.
              </div>
            )}

            <div className="o-field" style={{ marginTop: 20 }}>
              <label htmlFor="o-manual-soc">Or enter a code directly</label>
              <input
                id="o-manual-soc"
                value={manualSoc}
                onChange={(e) => {
                  setManualSoc(e.target.value);
                  setChosenSoc(null);
                }}
                placeholder="e.g. 2136"
                spellCheck={false}
              />
            </div>

            <button className="o-act" onClick={runCheck} disabled={busy || !effectiveSoc}>
              {busy ? 'Running…' : `Run check with ${effectiveSoc ?? '…'} →`}
            </button>
            <button className="o-act o-ghost" onClick={() => setStage('input')} style={{ marginLeft: 8 }}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* ─── STATE 3 · VERDICT ───────────────────────────────────────────── */}
      {stage === 'verdict' && verdict && (
        <div className="o-shell">
          <div className="o-left">
            <p className="o-eyebrow">Posting</p>
            <h2 className="o-posting-title">{verdict.inputs.title}</h2>
            <p className="o-co">{verdict.inputs.company}</p>
            <dl className="o-facts">
              <dt>Salary</dt>
              <dd>{verdict.inputs.salaryGbp ? gbp(verdict.inputs.salaryGbp) : '—'}</dd>
              <dt>Occupation</dt>
              <dd>
                {verdict.socCode} <span className="o-muted">· confirmed by you</span>
              </dd>
              <dt>Hours</dt>
              <dd>{verdict.inputs.hoursPerWeek ?? '—'} / week</dd>
              <dt>Licence</dt>
              <dd className={verdict.sponsor ? 'o-pass' : 'o-fail'}>
                {verdict.sponsor
                  ? [verdict.sponsor.route, verdict.sponsor.rating].filter(Boolean).join(' · ') || 'Listed'
                  : 'No register match'}
              </dd>
            </dl>
            {verdict.sponsor && <p className="o-src">{verdict.sponsor.registeredName}</p>}
            {verdict.inputs.sourceUrl && (
              <p className="o-src">
                {verdict.inputs.sourceUrl}
                <br />
                Read {verdict.inputs.retrievedAt?.replace('T', ' ').slice(0, 16)} UTC
              </p>
            )}
            <button className="o-act o-ghost" onClick={reset} style={{ marginTop: 24 }}>
              Check another →
            </button>
          </div>

          <div className="o-right o-anim">
            <div className="o-verdict-head">
              <p className="o-eyebrow">Verdict</p>
              <h1 className={`o-verdict-word ${verdict.outcome === 'ELIGIBLE' ? 'o-ok' : verdict.outcome === 'CONDITIONAL' ? 'o-cond' : 'o-no'}`}>
                {VERDICT_WORD[verdict.outcome]}
              </h1>
              {verdict.binding && (
                <div className={`o-stamp ${verdict.outcome === 'CONDITIONAL' ? 'o-stamp-cond' : ''}`}>
                  <span className="o-stamp-w">
                    {verdict.outcome === 'CONDITIONAL' ? 'COND' : 'FAIL'}
                  </span>
                  <span className="o-stamp-d">
                    {[verdict.binding.citation.paragraph, verdict.binding.citation.table]
                      .filter(Boolean)
                      .join(' · ') || verdict.binding.citation.authority}
                  </span>
                </div>
              )}
            </div>

            <p className="o-binding">{verdict.statement}</p>

            {verdict.provisional && (
              <div className="o-warnbox">
                <b>Provisional</b>
                Computed from an unverified rules snapshot ({verdict.snapshot.id}). The engine,
                citations and arithmetic are real; the rate data behind them is not yet confirmed
                against the published tables.
              </div>
            )}

            <div className="o-ledger">
              {verdict.constraints.map((c, i) => (
                <div
                  key={c.id}
                  className={`o-lrow ${c.binding ? 'o-bind' : ''} ${c.status === 'not_applicable' ? 'o-na' : ''}`}
                  style={{ animationDelay: `${0.04 * (i + 1)}s` }}
                >
                  <span className={`o-glyph ${c.status === 'satisfied' ? 'o-p' : c.status === 'failed' ? 'o-f' : 'o-n'}`}>
                    {GLYPH[c.status]}
                  </span>
                  <div>
                    <div className="o-lname">
                      {c.name}
                      {c.binding && <span className="o-bindmark">BINDING</span>}
                    </div>
                    <div className="o-lval">{c.detail}</div>
                  </div>
                  <div className="o-lref">
                    {c.citation.paragraph ?? c.citation.table ?? ''}
                    {c.citation.row ? <><br />row {c.citation.row}</> : null}
                  </div>
                </div>
              ))}

              {verdict.tradeable.length > 0 && (
                <p className="o-subhead">Tradeable points — evaluated, not applied</p>
              )}

              {verdict.tradeable.map((t, i) => (
                <div
                  key={t.id}
                  className={`o-lrow ${t.claimable ? '' : 'o-na'}`}
                  style={{ animationDelay: `${0.04 * (verdict.constraints.length + i + 1)}s` }}
                >
                  <span className={`o-glyph ${t.wouldClearBinding ? 'o-p' : t.claimable ? 'o-f' : 'o-n'}`}>
                    {t.wouldClearBinding ? '✓' : t.claimable ? '✕' : '—'}
                  </span>
                  <div>
                    <div className="o-lname">{t.name}</div>
                    <div className="o-lval">{t.reason}</div>
                  </div>
                  <div className="o-lref">{t.citation.paragraph ?? ''}</div>
                </div>
              ))}
            </div>

            <div className="o-cite">
              <b>Rules snapshot</b> {verdict.snapshot.id} · effective {verdict.snapshot.effectiveDate}
              <br />
              <b>Reproducible</b> Re-running this check against the same snapshot returns this result
              byte for byte.
            </div>

            <p className="o-disc">{verdict.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Scoped styles — see NEXUS_V1_DESIGN_AND_OPERATIONS §1.2–1.6
// ─────────────────────────────────────────────────────────────────────────────

const ORACLE_CSS = `
.oracle{
  /* The Oracle keeps its own typographic identity — Spectral headings, Plex
     body, hairline rules — but its palette is bound to the app's theme
     tokens, so the dossier inverts correctly in the light themes. */
  --ink:var(--color-surface); --ink-2:var(--color-sunken); --ink-3:var(--color-surface-hover);
  --rule:var(--color-line-strong); --rule-soft:var(--color-line);
  --paper:var(--color-ink); --paper-2:var(--color-ink-muted); --paper-3:var(--color-ink-faint);
  --fail:var(--color-critical); --fail-deep:var(--color-critical);
  --pass:var(--color-positive); --cond:var(--color-caution);
  --wash-fail:var(--color-critical-soft); --wash-cond:var(--color-caution-soft);
  /* UI faces follow the product; the serif is the dossier's own and stays. */
  --mono:var(--font-mono); --sans:var(--font-sans);
  --serif:'Spectral',Georgia,serif;
  background:var(--ink); color:var(--paper); font-family:var(--sans);
  font-size:15px; line-height:1.5; border:1px solid var(--rule); border-radius:4px;
  overflow:hidden;
}
.oracle *{box-sizing:border-box}
.oracle :focus-visible{outline:2px solid var(--cond); outline-offset:2px}

.o-bar{display:flex;justify-content:space-between;align-items:center;gap:14px;
  padding:12px 22px;border-bottom:1px solid var(--rule);font-family:var(--mono);
  font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--paper-3);flex-wrap:wrap}
.o-bar b{color:var(--paper-2);font-weight:500}
.o-snap em{color:var(--cond);font-style:normal}
.o-flag{font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;color:var(--cond);
  border:1px solid var(--cond);padding:2px 6px;border-radius:2px}

.o-warn-strip{padding:11px 22px;background:var(--wash-cond);
  border-bottom:1px solid var(--rule);font-size:13px;line-height:1.55;color:var(--paper-2)}
.o-warn-strip b{color:var(--cond);font-weight:600}
.o-warn-strip.o-stale{background:var(--wash-fail)}
.o-error{padding:11px 22px;background:var(--wash-fail);border-bottom:1px solid var(--fail);
  font-size:13px;color:var(--paper)}

.o-shell{display:grid;grid-template-columns:minmax(0,38fr) minmax(0,62fr)}
.o-left{border-right:1px solid var(--rule);padding:30px 28px}
.o-right{padding:30px 30px 46px;position:relative}
@media(max-width:900px){
  .o-shell{grid-template-columns:1fr}
  .o-left{border-right:0;border-bottom:1px solid var(--rule);padding:24px 18px}
  .o-right{padding:24px 18px 44px}
}

.o-eyebrow{font-family:var(--mono);font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;
  color:var(--paper-3);margin:0 0 14px}
.o-h2{font-family:var(--serif);font-size:25px;font-weight:600;line-height:1.22;margin:0 0 10px}
.o-posting-title{font-family:var(--serif);font-size:23px;font-weight:600;line-height:1.22;margin:0 0 5px}
.o-co{font-family:var(--mono);font-size:13px;color:var(--paper-2);margin:0 0 18px}
.o-hint{font-size:12.5px;color:var(--paper-3);margin:8px 0 0;line-height:1.55}
.o-hint.o-sm{font-size:11.5px}
.o-muted{color:var(--paper-3)}
.o-pass{color:var(--pass)} .o-fail{color:var(--fail)}

.o-facts{display:grid;grid-template-columns:auto 1fr;gap:8px 18px;font-size:13.5px;
  align-items:baseline;margin:0}
.o-facts dt{font-family:var(--mono);font-size:10.5px;letter-spacing:.09em;text-transform:uppercase;
  color:var(--paper-3)}
.o-facts dd{font-family:var(--mono);color:var(--paper);margin:0}
.o-src{margin-top:18px;padding-top:14px;border-top:1px solid var(--rule-soft);font-size:11.5px;
  color:var(--paper-3);font-family:var(--mono);word-break:break-all;line-height:1.6}

.o-field{margin:18px 0 0}
.o-field label{display:block;font-family:var(--mono);font-size:10.5px;letter-spacing:.11em;
  text-transform:uppercase;color:var(--paper-3);margin-bottom:7px}
.o-field input,.o-field select{width:100%;background:var(--ink-2);border:1px solid var(--rule);
  color:var(--paper);font-family:var(--mono);font-size:13.5px;padding:11px 12px;border-radius:2px}
.o-field input::placeholder{color:var(--paper-3)}
.o-field input:focus,.o-field select:focus{border-color:var(--paper-3);outline:none}
.o-grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.o-row-inline{display:flex;gap:8px}
.o-row-inline input{flex:1;min-width:0}
.o-row-inline .o-act{margin-top:0;white-space:nowrap}

.o-check{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:start;
  margin:16px 0 0;cursor:pointer;font-size:13.5px;line-height:1.45}
.o-check input{margin-top:3px;accent-color:var(--cond)}
.o-check em{display:block;font-style:normal;font-size:11.5px;color:var(--paper-3);margin-top:3px}

.o-act{font-family:var(--mono);font-size:11.5px;letter-spacing:.11em;text-transform:uppercase;
  background:var(--paper);color:var(--ink);border:0;padding:11px 18px;border-radius:2px;
  cursor:pointer;margin-top:20px;font-weight:500}
.o-act:hover:not(:disabled){opacity:.88}
.o-act:disabled{opacity:.42;cursor:not-allowed}
.o-ghost{background:transparent;color:var(--paper-2);border:1px solid var(--rule)}
.o-ghost:hover:not(:disabled){background:var(--ink-2);color:var(--paper)}

.o-soc{border:1px solid var(--rule);border-radius:2px;margin-bottom:10px;background:var(--ink-2);
  cursor:pointer;display:block;width:100%;text-align:left;color:inherit;font:inherit;padding:0}
.o-soc:hover{border-color:var(--paper-3)}
.o-soc[aria-checked=true]{border-color:var(--paper);background:var(--ink-3)}
.o-soc-in{padding:14px 16px;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:start}
.o-soc-in2{grid-template-columns:1fr auto}
.o-soc-code{font-family:var(--mono);font-size:15px;color:var(--paper);font-weight:500}
.o-soc-t{font-size:13.5px;margin-bottom:4px}
.o-soc-d{font-size:12px;color:var(--paper-3);line-height:1.5}
.o-soc-conf{font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;color:var(--paper-3);
  white-space:nowrap;text-transform:uppercase}

.o-warnbox{border-left:2px solid var(--cond);background:var(--wash-cond);padding:12px 14px;
  font-size:12.5px;line-height:1.6;color:var(--paper-2);margin:18px 0 4px}
.o-warnbox b{color:var(--cond);font-weight:500;display:block;font-family:var(--mono);font-size:10.5px;
  letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px}

.o-verdict-head{position:relative;padding-right:120px;margin-bottom:6px}
@media(max-width:640px){.o-verdict-head{padding-right:0}}
.o-verdict-word{font-family:var(--serif);font-size:clamp(30px,5vw,46px);line-height:1.02;
  font-weight:600;letter-spacing:-.015em;margin:0}
.o-verdict-word.o-no{color:var(--fail)}
.o-verdict-word.o-ok{color:var(--pass)}
.o-verdict-word.o-cond{color:var(--cond)}
.o-binding{font-family:var(--serif);font-size:18px;font-style:italic;line-height:1.45;
  color:var(--paper);margin:14px 0 6px;max-width:54ch}

.o-stamp{position:absolute;top:2px;right:0;transform:rotate(-2.5deg);border:1px solid var(--fail);
  box-shadow:0 0 0 3px var(--ink),0 0 0 4px var(--fail);padding:8px 12px 7px;color:var(--fail);
  text-align:center;opacity:.92}
.o-stamp.o-stamp-cond{border-color:var(--cond);color:var(--cond);
  box-shadow:0 0 0 3px var(--ink),0 0 0 4px var(--cond)}
.o-stamp-w{font-family:var(--mono);font-size:14px;letter-spacing:.16em;font-weight:500;display:block;line-height:1}
.o-stamp-d{font-family:var(--mono);font-size:8.5px;letter-spacing:.1em;margin-top:5px;display:block;opacity:.8}
@media(max-width:640px){.o-stamp{position:static;display:inline-block;margin-top:14px}}

.o-ledger{margin-top:26px;border-top:1px solid var(--rule)}
.o-lrow{display:grid;grid-template-columns:22px 1fr auto;gap:13px;padding:12px 0;
  border-bottom:1px solid var(--rule-soft);align-items:baseline}
.o-lrow.o-na{opacity:.45}
.o-lrow.o-bind{background:var(--wash-fail);box-shadow:inset 2px 0 0 var(--fail);
  padding-left:13px;margin-left:-13px}
.o-glyph{font-family:var(--mono);font-size:13px;line-height:1.35}
.o-glyph.o-p{color:var(--pass)} .o-glyph.o-f{color:var(--fail)} .o-glyph.o-n{color:var(--paper-3)}
.o-lname{font-size:13.5px;line-height:1.4}
.o-lrow.o-na .o-lname{text-decoration:line-through;text-decoration-thickness:1px}
.o-bindmark{font-family:var(--mono);font-size:9.5px;letter-spacing:.1em;color:var(--fail);margin-left:8px}
.o-lval{font-family:var(--mono);font-size:12.5px;color:var(--paper-2);margin-top:4px;line-height:1.5}
.o-lrow.o-bind .o-lval{color:var(--paper)}
.o-lref{font-family:var(--mono);font-size:10px;letter-spacing:.05em;color:var(--paper-3);
  text-align:right;white-space:nowrap;padding-top:2px;line-height:1.5}
@media(max-width:640px){
  .o-lrow{grid-template-columns:20px 1fr}
  .o-lref{grid-column:2;text-align:left;padding-top:6px}
}
.o-subhead{font-family:var(--mono);font-size:10.5px;letter-spacing:.13em;text-transform:uppercase;
  color:var(--paper-3);margin:28px 0 4px;padding-top:4px}

.o-cite{margin-top:30px;padding-top:16px;border-top:1px solid var(--rule);font-family:var(--mono);
  font-size:10.5px;color:var(--paper-3);line-height:1.85;word-break:break-word}
.o-cite b{color:var(--paper-2);font-weight:500}
.o-disc{margin-top:18px;font-size:11.5px;color:var(--paper-3);line-height:1.65;max-width:66ch;
  border-left:1px solid var(--rule);padding-left:13px}

@keyframes o-rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
@keyframes o-settle{from{opacity:0;transform:rotate(-9deg) scale(1.1)}to{opacity:.92;transform:rotate(-2.5deg) scale(1)}}
.o-anim .o-lrow{animation:o-rise .34s cubic-bezier(.2,.7,.3,1) backwards}
.o-anim .o-stamp{animation:o-settle .42s cubic-bezier(.2,.9,.3,1) .5s backwards}
@media(prefers-reduced-motion:reduce){.o-anim .o-lrow,.o-anim .o-stamp{animation:none}}
`;

export default OracleWorkbench;
