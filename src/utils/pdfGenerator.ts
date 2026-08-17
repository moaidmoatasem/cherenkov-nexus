import jsPDF from 'jspdf';
import { MasterProfile, SynthesizedResult } from '../types';

export interface GeneratePdfOptions {
  masterProfile: MasterProfile;
  synthesizedData?: SynthesizedResult | null;
  companyName?: string;
  jobTitle?: string;
}

/**
 * Generates a clean, modern, ATS-friendly PDF resume for the candidate tailored to the target role.
 */
export function generateAtsPdfResume({
  masterProfile,
  synthesizedData,
  companyName = 'Target Employer',
  jobTitle = 'Senior Quality Assurance Lead'
}: GeneratePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Helper to ensure text doesn't overflow page
  const checkPageBreak = (spaceNeeded: number) => {
    if (cursorY + spaceNeeded > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  };

  // 1. CANDIDATE HEADER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(masterProfile.name, margin, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text(masterProfile.title.toUpperCase(), margin, cursorY);
  cursorY += 5;

  // Contact info bar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const contactText = `${masterProfile.location}  |  Target: UK & EU Visa Sponsorship / Remote  |  Cherenkov-QA Ecosystem`;
  doc.text(contactText, margin, cursorY);
  cursorY += 4;

  // Decorative Accent Rule
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 6;

  // 2. TARGET ROLE & VISA SPONSORSHIP BADGE
  checkPageBreak(16);
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, cursorY, contentWidth, 12, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`TARGET APPLICATION: ${jobTitle.toUpperCase()} @ ${companyName.toUpperCase()}`, margin + 3, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129); // emerald-600
  const sponsorTag = synthesizedData?.isLicensedSponsor
    ? 'Status: Verified A-Rated UK/EU Visa Sponsor (Compliant with 2026 £41,700 Threshold)'
    : 'Status: Standard Technical Lead Alignment & Remote Authorization';
  doc.text(sponsorTag, margin + 3, cursorY + 9.5);
  cursorY += 16;

  // 3. EXECUTIVE TAILORED SUMMARY
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE PROFILE & STRATEGIC VALUE', margin, cursorY);
  cursorY += 4.5;

  const summaryText =
    synthesizedData?.tailored_summary ||
    `${masterProfile.title} based in ${masterProfile.location} specializing in enterprise-scale automated testing, distributed performance engineering (k6), and continuous quality gates across mission-critical systems.`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85); // slate-700
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(splitSummary, margin, cursorY, { lineHeightFactor: 1.35 });
  cursorY += splitSummary.length * 4.8 + 5;

  // 4. CORE TECHNICAL COMPETENCIES (Categorized ATS Keywords)
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('CORE TECHNICAL COMPETENCIES & INFRASTRUCTURE', margin, cursorY);
  cursorY += 4.5;

  const techRows = [
    { label: 'QA & Test Automation:', items: 'Playwright, Cypress, Selenium, Appium, Cucumber/BDD, Invariant Assertions' },
    { label: 'Performance & Load Profiling:', items: 'k6 Dynamic Scripting, JMeter, Distributed Chaos Engineering' },
    { label: 'Security & Static Analysis:', items: 'GitHub CodeQL Semantic Security, OWASP Top 10, SonarQube, Snyk' },
    { label: 'CI/CD & DevOps Engineering:', items: 'GitHub Actions, GitLab CI, Docker, Kubernetes, Test Matrix Sharding' },
    { label: 'Agentic AI & LLM Systems:', items: 'Cherenkov-QA Agent Swarms, AnythingLLM, Qwen, Gemini 2.5 Flash, MCP Stdio' }
  ];

  doc.setFontSize(9);
  techRows.forEach((row) => {
    checkPageBreak(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`• ${row.label}`, margin, cursorY);

    const labelWidth = doc.getTextWidth(`• ${row.label} `);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const splitTech = doc.splitTextToSize(row.items, contentWidth - labelWidth);
    doc.text(splitTech, margin + labelWidth, cursorY);
    cursorY += Math.max(splitTech.length * 4.2, 4.8);
  });
  cursorY += 4;

  // 5. TAILORED HIGH-IMPACT DELIVERABLES & STAR EVIDENCE
  if (synthesizedData?.ats_answers && synthesizedData.ats_answers.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('ATS & TECHNICAL LEADERSHIP HIGHLIGHTS', margin, cursorY);
    cursorY += 4.5;

    synthesizedData.ats_answers.slice(0, 3).forEach((qa) => {
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229); // indigo
      const qText = doc.splitTextToSize(`Q: ${qa.question}`, contentWidth);
      doc.text(qText, margin, cursorY);
      cursorY += qText.length * 4.2 + 1;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const aText = doc.splitTextToSize(qa.answer, contentWidth);
      doc.text(aText, margin, cursorY, { lineHeightFactor: 1.3 });
      cursorY += aText.length * 3.8 + 4;
    });
  }

  // 6. CONTINUOUS LEARNING & CERTIFICATIONS
  if (masterProfile.learning_certs && masterProfile.learning_certs.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('VERIFIED CERTIFICATIONS & XAPI CONTINUOUS LEARNING', margin, cursorY);
    cursorY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);

    masterProfile.learning_certs.forEach((cert) => {
      checkPageBreak(7);
      doc.text(`✓ ${cert}`, margin, cursorY);
      cursorY += 4.2;
    });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Cherenkov-Nexus Tailored ATS Dossier  |  Candidate: ${masterProfile.name}  |  Page ${i} of ${totalPages}`,
      margin,
      pageHeight - 8
    );
  }

  return doc;
}

/**
 * Convenience helper to download the PDF file directly in the browser.
 */
export function downloadAtsPdfResume(options: GeneratePdfOptions, filename?: string) {
  const doc = generateAtsPdfResume(options);
  const safeCompany = (options.companyName || 'Job').replace(/[^a-zA-Z0-9_-]/g, '_');
  const finalFilename = filename || `Moayed_Badawy_Resume_${safeCompany}.pdf`;
  doc.save(finalFilename);
}
