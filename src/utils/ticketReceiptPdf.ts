import { jsPDF } from 'jspdf';
import { ServiceTicket } from '../types';

export function generateTicketReceiptPdf(ticket: ServiceTicket): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryPurple = [36, 18, 110]; // #24126E
  const accentMagenta = [215, 0, 150]; // #D70096
  const textDark = [30, 41, 59]; // slate-800
  const textMuted = [100, 116, 139]; // slate-500
  const bgLight = [247, 245, 250]; // #F7F5FA
  const borderGrey = [226, 232, 240]; // slate-200

  // 1. Top Accent Line
  doc.setFillColor(accentMagenta[0], accentMagenta[1], accentMagenta[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Header Box
  doc.setFillColor(primaryPurple[0], primaryPurple[1], primaryPurple[2]);
  doc.roundedRect(margin, 12, contentWidth, 32, 4, 4, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SUMMA PLUS', margin + 8, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(240, 230, 255);
  doc.text('Aanvraagbon Serviceteam • Blécourtstraat', margin + 8, 31);

  doc.setFontSize(9);
  doc.setTextColor(220, 200, 250);
  doc.text('Officieel bewijs van service-aanvraag', margin + 8, 38);

  // Ticket Badge in Header (Right Side)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(pageWidth - margin - 52, 18, 44, 20, 3, 3, 'F');

  doc.setTextColor(primaryPurple[0], primaryPurple[1], primaryPurple[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TICKETNUMMER', pageWidth - margin - 30, 24, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(accentMagenta[0], accentMagenta[1], accentMagenta[2]);
  doc.text(ticket.ticketNumber, pageWidth - margin - 30, 32, { align: 'center' });

  // 3. Status & Registration Info Strip
  let currentY = 50;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.roundedRect(margin, currentY, contentWidth, 14, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Status:', margin + 6, currentY + 9);

  doc.setFont('helvetica', 'normal');
  const statusLabel = 
    ticket.status === 'open' ? 'Ingediend (Wachtrij)' :
    ticket.status === 'in_behandeling' ? 'In behandeling' :
    ticket.status === 'wacht_op_onderdelen' ? 'Wacht op onderdelen' :
    ticket.status === 'afgerond' ? 'Afgerond' : 'Geannuleerd';
  doc.text(statusLabel, margin + 22, currentY + 9);

  doc.setFont('helvetica', 'bold');
  doc.text('Datum ingediend:', margin + 90, currentY + 9);
  doc.setFont('helvetica', 'normal');
  doc.text(ticket.createdAtFormatted || new Date().toLocaleString('nl-NL'), margin + 125, currentY + 9);

  // 4. Main Ticket Information Section
  currentY = 70;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryPurple[0], primaryPurple[1], primaryPurple[2]);
  doc.text('Aanvraaggegevens', margin, currentY);

  currentY += 4;
  doc.setDrawColor(accentMagenta[0], accentMagenta[1], accentMagenta[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, currentY, margin + 45, currentY);
  doc.setLineWidth(0.2);

  currentY += 6;

  // Information Grid
  const rowHeight = 11;
  const col1X = margin;
  const col1Width = 52;
  const col2X = margin + col1Width;
  const col2Width = contentWidth - col1Width;

  const details: Array<{ label: string; value: string; isBold?: boolean }> = [
    { label: 'Omschrijving klus:', value: ticket.title, isBold: true },
    { 
      label: 'Locatie:', 
      value: ticket.location.toLowerCase().includes('blécourt') || ticket.location.toLowerCase().includes('blecourt')
        ? ticket.location
        : `Blécourtstraat • ${ticket.location}`,
      isBold: true
    },
    { label: 'Aanvrager (Voornaam):', value: ticket.requesterName },
    { label: 'Team / Opleiding:', value: ticket.requesterTeam },
    { 
      label: 'Prioriteit / Urgentie:', 
      value: ticket.priority.toUpperCase() === 'SPOED' ? 'Spoed (Direct / lesverstoring)' :
             ticket.priority.toUpperCase() === 'HOOG' ? 'Hoog' :
             ticket.priority.toUpperCase() === 'LAAG' ? 'Laag' : 'Normaal' 
    },
    { 
      label: 'Gewenste datum / deadline:', 
      value: ticket.desiredDate ? formatDateDutch(ticket.desiredDate) : 'Zo spoedig mogelijk' 
    },
  ];

  if (ticket.mealOrderItems && ticket.mealOrderItems.length > 0) {
    details.push({
      label: 'Horeca Maaltijden:',
      value: ticket.mealOrderItems.map(i => `${i.portions}x ${i.name}`).join(', '),
      isBold: true
    });
    if (ticket.mealPickupTime) {
      details.push({
        label: 'Afhaaltijd Balie:',
        value: `${ticket.mealPickupTime} (DV Balie Blécourtstraat)`,
        isBold: true
      });
    }
  }

  if (ticket.assignedTeacher) {
    details.push({ label: 'Begeleidend Docent:', value: ticket.assignedTeacher });
  }
  if (ticket.assignedStudent) {
    details.push({ label: 'Toegewezen Student:', value: ticket.assignedStudent });
  }

  details.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.rect(col1X, currentY, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
    doc.rect(col1X, currentY, contentWidth, rowHeight, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(item.label, col1X + 4, currentY + 7);

    doc.setFont('helvetica', item.isBold ? 'bold' : 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(item.isBold ? primaryPurple[0] : textDark[0], item.isBold ? primaryPurple[1] : textDark[1], item.isBold ? primaryPurple[2] : textDark[2]);
    doc.text(item.value, col2X + 4, currentY + 7);

    currentY += rowHeight;
  });

  currentY += 10;

  // 5. Extended Description / Toelichting Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryPurple[0], primaryPurple[1], primaryPurple[2]);
  doc.text('Uitgebreide toelichting van de aanvraag', margin, currentY);

  currentY += 4;
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setFillColor(255, 255, 255);

  const descText = ticket.description || 'Geen nadere toelichting opgegeven.';
  const splitDesc = doc.splitTextToSize(descText, contentWidth - 12);
  const descBoxHeight = Math.max(26, splitDesc.length * 6 + 10);

  doc.roundedRect(margin, currentY, contentWidth, descBoxHeight, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(splitDesc, margin + 6, currentY + 8);

  currentY += descBoxHeight + 12;

  // 6. Photo note if any
  if (ticket.photos && ticket.photos.length > 0) {
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.roundedRect(margin, currentY, contentWidth, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`* Er zijn ${ticket.photos.length} bijlage-foto('s) digitaal gekoppeld aan dit ticket.`, margin + 6, currentY + 6.5);
    currentY += 16;
  }

  // 7. Footer Instructions Box
  const footerY = Math.max(currentY, pageHeight - 45);

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.roundedRect(margin, footerY, contentWidth, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryPurple[0], primaryPurple[1], primaryPurple[2]);
  doc.text('Summa Plus Serviceteam • Blécourtstraat', margin + 6, footerY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Bewaar deze bon als bewijs van je serviceaanvraag. Voor vragen of wijzigingen kun je refereren aan het', margin + 6, footerY + 13);
  doc.text(`ticketnummer: ${ticket.ticketNumber}. Het serviceteam gaat zo spoedig mogelijk met je klusje aan de slag.`, margin + 6, footerY + 18);

  // Bottom Magenta Accent Line
  doc.setFillColor(accentMagenta[0], accentMagenta[1], accentMagenta[2]);
  doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');

  // Trigger download
  const filename = `Aanvraagbon-${ticket.ticketNumber}.pdf`;
  doc.save(filename);
}

function formatDateDutch(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}
