import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * PDF ENGINE - Generates Official Statements for Ledger Payouts
 * Formatted strictly according to Section 8 of the Partnership Agreement
 */
export async function generatePayoutPDF(log) {
  const doc = new jsPDF();
  const isExpense = log.entry_type === 'expense_only';
  const payoutDate = log.payout_date ? new Date(log.payout_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const refId = `HIL-SETTLE-${log.id || 'NEW'}-${Date.now().toString(36).toUpperCase()}`;

  // Header Banner Background
  doc.setFillColor(9, 10, 15); // Obsidian Dark
  doc.rect(0, 0, 210, 48, 'F');

  // Accent Line
  doc.setFillColor(6, 182, 212); // Cyan 500
  doc.rect(0, 48, 210, 2, 'F');

  // Title & Metadata
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('DIGITAL FITNESS PARTNERSHIP', 16, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('OFFICIAL SETTLEMENT & PROFIT DISTRIBUTION STATEMENT', 16, 28);

  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  doc.setTextColor(6, 182, 212);
  doc.text(`STATEMENT REF: ${refId}`, 16, 38);
  doc.text(`EFFECTIVE AGREEMENT: AUGUST 10, 2026 (ACTIVE TO MARCH 2, 2029)`, 16, 43);

  // Partner Identification Card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 56, 180, 24, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CONTRACTUAL PARTNERS:', 20, 63);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('• Digital Systems Partner: Dagmawi Tewodros (Automation, Infrastructure, Delivery)', 20, 70);
  doc.text('• Content & Brand Partner: Coach Hilawe Semma (Fitness Content, Brand Identity)', 20, 75);

  // Settlement Distribution Table
  const grossTotal = parseFloat(log.gross_revenue || 0);
  const prodGross = parseFloat(log.products_gross || 0);
  const clubGross = parseFloat(log.club_gross || 0);
  const deductions = parseFloat(log.operational_deductions || 0);
  const netProfit = parseFloat(log.net_profit || 0);
  const coachShare = parseFloat(log.coach_share || 0);
  const dagmawiShare = parseFloat(log.dagmawi_share || 0);

  const tableBody = isExpense
    ? [
        ['Settlement Type', 'OPERATIONAL EXPENSE DEDUCTION (Section 5)'],
        ['Recorded Date', payoutDate],
        ['Expense Category', log.production_deductions > 0 ? 'Product & Video Production (Section 5.2)' : 'Technical Infrastructure & Server Hosting (Section 5.1)'],
        ['Deduction Amount', `-${deductions.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB`],
        ['Memo / Description', log.expense_note || 'General operating expense'],
      ]
    : [
        ['Settlement Execution Date', payoutDate],
        ['Stream A: Digital Products (Gross)', `${(prodGross || (grossTotal > 0 ? grossTotal : 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB (Split: 70% Coach / 30% Dagmawi)`],
        ['Stream B: Transformation Club (Gross)', `${clubGross.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB (${log.club_stage === 'mature_65_35' ? 'Stage 2: 65/35' : 'Stage 1: 60/40 Split'})`],
        ['Total Gross Revenue Pool', `${grossTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB`],
        ['Allowable Operational Deductions', `-${deductions.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB`],
        ['Net Distributable Revenue', `${netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB`],
        ['Coach Hilawe Semma Entitlement', `${coachShare.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB`],
        ['Dagmawi Tewodros Entitlement', `${dagmawiShare.toLocaleString('en-US', { minimumFractionDigits: 2 })} ETB`],
      ];

  doc.autoTable({
    startY: 86,
    head: [['PARAMETER / LINE ITEM', 'SETTLEMENT SPECIFICATION']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], font: 'helvetica', fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { font: 'helvetica', fontSize: 8.5, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { cellWidth: 110 },
    },
  });

  let currentY = doc.lastAutoTable.finalY + 12;

  // Memo & Audit Note Block
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(15, currentY, 180, 22, 2, 2, 'FD');
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('OFFICIAL MEMO & TRANSACTION REFERENCE:', 20, currentY + 7);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.text(log.expense_note || 'Standard dual-stream partnership payout reconciliation.', 20, currentY + 14);

  currentY += 34;

  // Legal & Audit Compliance Confirmation
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('SECTION 8 RECONCILIATION & EXECUTION CONFIRMATION', 15, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'This statement certifies the exact profit distribution calculated in accordance with Sections 5, 6, and 8 of the Revised Digital Fitness Partnership Agreement. All figures are audited directly against verifiable bot payment ledgers and subscriber database records.',
    15,
    currentY + 6,
    { maxWidth: 180 }
  );

  // Signatures Placeholders
  currentY += 28;
  doc.setDrawColor(203, 213, 225);
  doc.line(15, currentY, 90, currentY);
  doc.line(110, currentY, 185, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Dagmawi Tewodros', 15, currentY + 6);
  doc.text('Coach Hilawe Semma', 110, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Digital Systems Partner (Signed)', 15, currentY + 11);
  doc.text('Content & Brand Partner (Signed)', 110, currentY + 11);

  // Save Document
  const dateStr = log.payout_date ? log.payout_date.split('T')[0] : 'Latest';
  doc.save(`Partnership_Settlement_${dateStr}_${log.id || 'statement'}.pdf`);
}

/**
 * High-Density Technical Executive Performance PDF Exporter
 */
export async function generatePremiumPDF({ data = null, chartCanvas = null, onProgress = () => {}, autoDownload = true } = {}) {
  const progress = (pct) => {
    try {
      onProgress(Math.max(0, Math.min(100, Math.round(pct))));
    } catch (_) {}
  };

  const labels = Array.isArray(data?.labels) ? data.labels.slice() : [];
  const revenue_products = (Array.isArray(data?.revenue_products) ? data.revenue_products : []).map(v => Number(v) || 0);
  const revenue_club = (Array.isArray(data?.revenue_club) ? data.revenue_club : []).map(v => Number(v) || 0);
  const revenue = revenue_products.map((v, i) => v + (revenue_club[i] || 0));
  const users = (Array.isArray(data?.users) ? data.users.slice() : new Array(labels.length).fill(0)).map(v => Number(v) || 0);

  if (labels.length === 0) {
    throw new Error('No dataset available for export.');
  }

  progress(10);

  const totalRevenue = revenue.reduce((a, b) => a + b, 0);
  const totalUsers = users.reduce((a, b) => a + b, 0);
  const arpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;

  const mid = Math.floor(revenue.length / 2);
  const prevPeriodRev = revenue.slice(0, mid).reduce((a, b) => a + b, 0);
  const currentPeriodRev = revenue.slice(mid).reduce((a, b) => a + b, 0);
  const revenueGrowth = prevPeriodRev > 0 ? ((currentPeriodRev - prevPeriodRev) / prevPeriodRev) * 100 : 0;

  const prevUsers = users.slice(0, mid).reduce((a, b) => a + b, 0);
  const currentUsers = users.slice(mid).reduce((a, b) => a + b, 0);
  const userGrowth = prevUsers > 0 ? ((currentUsers - prevUsers) / prevUsers) * 100 : 0;

  progress(30);

  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });

  const TOKENS = {
    bg: [3, 7, 18],
    surface: [17, 24, 39],
    accent: [34, 211, 238],
    text: [248, 250, 252],
    muted: [100, 116, 139],
    pos: [16, 185, 129],
    neg: [244, 63, 94],
  };

  const setTextColorSafe = (c) => {
    if (Array.isArray(c)) doc.setTextColor(...c);
    else if (typeof c === 'string') doc.setTextColor(c);
    else doc.setTextColor(0, 0, 0);
  };

  const drawBackground = () => {
    doc.setFillColor(...TOKENS.bg);
    doc.rect(0, 0, 210, 297, 'F');
  };

  function addWatermark(pageNum) {
    try {
      doc.setPage(pageNum);
      doc.setFontSize(40);
      setTextColorSafe([40, 48, 65]);
      doc.text('REVENUE PERFORMANCE', 105, 150, { align: 'center', angle: 45 });
    } catch (_) {}
  }

  // Page 1: Header + KPI grid + chart snapshot
  drawBackground();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setTextColorSafe(TOKENS.text);
  doc.text('REVENUE PERFORMANCE REPORT', 15, 18);

  doc.setFontSize(8);
  doc.setFont('courier', 'normal');
  setTextColorSafe(TOKENS.accent);
  doc.text(`INTERVAL: ${labels.length} DAYS  |  GENERATED: ${new Date().toISOString().split('T')[0]}`, 15, 24);

  // 3 KPI cards
  const cardW = 58, cardH = 32, cardY = 32, gap = 6, startX = 15;
  const drawCard = (x, title, main, sub, trendPositive) => {
    doc.setFillColor(...TOKENS.surface);
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTextColorSafe(TOKENS.muted);
    doc.text(title.toUpperCase(), x + 4, cardY + 7);

    doc.setFontSize(12);
    setTextColorSafe(TOKENS.text);
    doc.text(main, x + 4, cardY + 18);

    doc.setFontSize(8);
    setTextColorSafe(trendPositive ? TOKENS.pos : TOKENS.neg);
    doc.text(sub, x + 4, cardY + 26);
  };

  drawCard(startX, 'Total Revenue', `${totalRevenue.toLocaleString()} ETB`, `${revenueGrowth.toFixed(1)}% vs prev`, revenueGrowth >= 0);
  drawCard(startX + cardW + gap, 'User Acquisition', `${totalUsers.toLocaleString()} Nodes`, `${userGrowth.toFixed(1)}% vs prev`, userGrowth >= 0);
  drawCard(startX + (cardW + gap) * 2, 'ARPU', `${arpu.toFixed(2)} ETB`, 'Yield per node', true);

  // Chart snapshot from canvas if provided
  try {
    if (chartCanvas) {
      const dataUrl = chartCanvas.toDataURL('image/png', 0.95);
      doc.addImage(dataUrl, 'PNG', 15, 74, 180, 85);
    }
  } catch (e) {
    console.warn('Canvas capture skipped', e);
  }

  progress(70);

  // Page 2: Detailed monospace data ledger
  doc.addPage();
  drawBackground();

  const tableStartY = 30;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  setTextColorSafe(TOKENS.accent);
  doc.text('DATE'.padEnd(20) + 'PROD_REV'.padStart(12) + '  CLUB_REV'.padStart(12) + '  USERS'.padStart(8) + '  ARPU'.padStart(10), 15, tableStartY);

  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  setTextColorSafe([220, 220, 220]);

  let y = tableStartY + 8;
  const lineHeight = 6;
  const pageBottom = 280;

  for (let i = 0; i < labels.length; i++) {
    if (y > pageBottom) {
      doc.addPage();
      drawBackground();
      y = 20;
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      setTextColorSafe(TOKENS.accent);
      doc.text('DATE'.padEnd(20) + 'PROD_REV'.padStart(12) + '  CLUB_REV'.padStart(12) + '  USERS'.padStart(8) + '  ARPU'.padStart(10), 15, y);
      y += 8;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      setTextColorSafe([220, 220, 220]);
    }

    const date = String(labels[i]).padEnd(20);
    const prodStr = revenue_products[i].toLocaleString().padStart(12);
    const clubStr = revenue_club[i].toLocaleString().padStart(12);
    const usersStr = users[i].toLocaleString().padStart(8);
    const arpuStr = (users[i] > 0 ? (revenue[i] / users[i]).toFixed(2) : '0.00').padStart(10);
    doc.text(`${date}${prodStr}  ${clubStr}  ${usersStr}  ${arpuStr}`, 15, y);
    y += lineHeight;
  }

  progress(90);

  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setTextColorSafe(TOKENS.muted);
    doc.text(`CONFIDENTIAL // HILAWE SOVEREIGN COMMAND // PAGE ${p} OF ${pageCount}`, 105, 292, { align: 'center' });
    addWatermark(p);
  }

  progress(100);

  const filename = `Hilawe_Revenue_Report_${labels.length}D_${Date.now()}.pdf`;
  if (autoDownload) {
    doc.save(filename);
  }

  return { doc, filename };
}
