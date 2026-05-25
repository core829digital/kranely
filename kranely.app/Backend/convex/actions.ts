import { action } from "./_generated/server";
import { v } from "convex/values";

const ADMIN_EMAILS = ["contact.core829@gmail.com", "info@iwhome.it"];
const COMPANY_NAME = "IwHome";
const COMPANY_ADDRESS = "Via Emilia 22/F, Reggio Emilia - 42124";
const COMPANY_PHONE_1 = "+39 389 182 0808";
const COMPANY_PHONE_2 = "+39 340 292 1052";
const COMPANY_WEBSITE = "https://iwhome.app";
const COMPANY_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/9dc587ed1_iwhomenero.png";

// ────────────────────────────────────────
// Shared HTML Components
// ────────────────────────────────────────

const emailHeader = () => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #212529, #343a40); padding: 32px 24px; border-radius: 16px 16px 0 0;">
    <tr>
      <td>
        <img src="${COMPANY_LOGO}" alt="${COMPANY_NAME}" width="120" style="display: block;" />
      </td>
      <td style="text-align: right; color: #dee2e6; font-size: 13px; font-family: 'Segoe UI', Arial, sans-serif;">
        Showroom | Materiali, Design, Casa
      </td>
    </tr>
  </table>
`;

const emailFooter = () => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #212529; padding: 28px 24px; border-radius: 0 0 16px 16px;">
    <tr>
      <td style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #adb5bd; line-height: 1.6;">
        <strong style="color: #f8f9fa;">${COMPANY_NAME} Showroom</strong><br />
        ${COMPANY_ADDRESS}<br />
        📞 ${COMPANY_PHONE_1} • ${COMPANY_PHONE_2}<br />
        ✉️ info@iwhome.it • amministrazione@iwhome.it<br />
        🌐 <a href="${COMPANY_WEBSITE}" style="color: #f8f9fa; text-decoration: none;">${COMPANY_WEBSITE}</a>
      </td>
    </tr>
    <tr>
      <td style="padding-top: 16px; border-top: 1px solid #343a40; margin-top: 16px;">
        <p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #6c757d; margin: 8px 0 0;">
          Questa email è stata generata automaticamente. P.IVA 03096130350
        </p>
      </td>
    </tr>
  </table>
`;

const emailWrapper = (content: string) => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin: 0; padding: 0; background-color: #e9ecef; font-family: 'Segoe UI', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.15);">
            <tr><td>${emailHeader()}</td></tr>
            <tr><td style="background: #ffffff; padding: 32px 24px;">${content}</td></tr>
            <tr><td>${emailFooter()}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

const formatQuoteType = (type: string) => {
  switch (type) {
    case 'finestre': return 'Solo Infissi';
    case 'chiavi_in_mano': return 'Chiavi in Mano';
    case 'completo': return 'Progetto Completo (Infissi + Ristrutturazione)';
    default: return type;
  }
};

const formatPrice = (price: number) =>
  `€${price.toLocaleString('it-IT')}`;

const formatColor = (color: string) => {
  const map: Record<string, string> = {
    bianco_pasta: 'Bianco Pasta',
    bianco_legno: 'Bianco/Legno',
    effetto_legno: 'Effetto Legno',
    noce: 'Noce',
    grigio: 'Grigio Antracite',
    nero: 'Nero',
  };
  return map[color] || color.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatMaterial = (mat: string) => {
  const map: Record<string, string> = { pvc: 'PVC', alluminio: 'Alluminio', legno: 'Legno', legno_alluminio: 'Legno/Alluminio' };
  return map[mat] || mat;
};

const formatWindowType = (type: string) => {
  const map: Record<string, string> = { finestra: 'Finestra', portafinestra: 'Porta-finestra', scorrevole: 'Scorrevole' };
  return map[type] || type;
};

const formatGlass = (glass: string) => {
  const map: Record<string, string> = { doppio: 'Doppio Vetro', triplo: 'Triplo Vetro' };
  return map[glass] || glass;
};

const formatService = (svc: string) => {
  const map: Record<string, string> = {
    tinteggiatura: 'Tinteggiatura',
    riscaldamento: 'Riscaldamento',
    impianto_idraulico: 'Impianto Idraulico',
    impianto_elettrico: 'Impianto Elettrico',
    demolizioni: 'Demolizioni',
    climatizzazione: 'Climatizzazione',
    pavimentazione: 'Pavimentazione',
    coibentazione: 'Coibentazione',
    infissi: 'Infissi',
  };
  return map[svc] || svc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatPropertyType = (type: string) => {
  const map: Record<string, string> = { appartamento: 'Appartamento', villa: 'Villa', casa_indipendente: 'Casa Indipendente', attico: 'Attico', loft: 'Loft' };
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatQuality = (q: string) => {
  const map: Record<string, string> = { standard: 'Standard', premium: 'Premium', luxury: 'Luxury' };
  return map[q] || q;
};

const renderWindowConfigHtml = (config: any): string => {
  if (!config) return '';
  const windows = config.windows || [];
  if (windows.length === 0) return '';

  const headerStyle = 'padding: 8px 10px; text-align: left; font-size: 11px; color: #6c757d; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #dee2e6;';
  const cellStyle = 'padding: 10px; font-size: 13px; color: #212529; border-bottom: 1px solid #f0f0f0;';
  const priceCell = 'padding: 10px; font-size: 13px; color: #212529; font-weight: 700; border-bottom: 1px solid #f0f0f0; text-align: right;';

  let rows = windows.map((w: any, i: number) => `
    <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
      <td style="${cellStyle}">${i + 1}</td>
      <td style="${cellStyle}"><strong>${formatWindowType(w.windowType)}</strong><br/><span style="color: #6c757d; font-size: 11px;">${w.ante} ant${w.ante === '1' ? 'a' : 'e'}</span></td>
      <td style="${cellStyle}">${w.width}×${w.height} cm</td>
      <td style="${cellStyle}">${formatMaterial(w.material)}</td>
      <td style="${cellStyle}">${formatColor(w.color)}</td>
      <td style="${cellStyle}">${formatGlass(w.glassType)}</td>
      <td style="${cellStyle} text-align: center;">${w.quantity}</td>
      <td style="${priceCell}">${formatPrice(w.price)}</td>
    </tr>
  `).join('');

  const total = windows.reduce((sum: number, w: any) => sum + (w.price || 0) * (w.quantity || 1), 0);

  return `
    <div style="margin-bottom: 20px;">
      <p style="color: #212529; font-weight: 600; font-size: 15px; margin: 0 0 12px;">🪟 Configurazione Infissi — ${windows.length} element${windows.length === 1 ? 'o' : 'i'}</p>
      <div style="border-radius: 12px; overflow: hidden; border: 1px solid #dee2e6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background: #e9ecef;">
              <th style="${headerStyle}">#</th>
              <th style="${headerStyle}">Tipo</th>
              <th style="${headerStyle}">Misure</th>
              <th style="${headerStyle}">Materiale</th>
              <th style="${headerStyle}">Colore</th>
              <th style="${headerStyle}">Vetro</th>
              <th style="${headerStyle} text-align: center;">Qtà</th>
              <th style="${headerStyle} text-align: right;">Prezzo</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="background: #212529;">
              <td colspan="7" style="padding: 12px; color: #f8f9fa; font-weight: 600; font-size: 14px;">Totale Infissi</td>
              <td style="padding: 12px; color: #f8f9fa; font-weight: 700; font-size: 16px; text-align: right;">${formatPrice(config.estimatedPrice || total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
};

const renderProjectConfigHtml = (config: any): string => {
  if (!config) return '';

  const cellLabel = 'padding: 8px 12px; color: #6c757d; font-size: 13px; border-bottom: 1px solid #f0f0f0;';
  const cellValue = 'padding: 8px 12px; color: #212529; font-weight: 600; font-size: 13px; text-align: right; border-bottom: 1px solid #f0f0f0;';

  // Property details
  const propertyRows = `
    <tr><td style="${cellLabel}">Tipo Immobile</td><td style="${cellValue}">${formatPropertyType(config.propertyType || '')}</td></tr>
    <tr><td style="${cellLabel}">Superficie</td><td style="${cellValue}">${config.squareMeters || 0} mq</td></tr>
    <tr><td style="${cellLabel}">Stanze</td><td style="${cellValue}">${config.rooms || 0}</td></tr>
    <tr><td style="${cellLabel}">Bagni</td><td style="${cellValue}">${config.bathrooms || 0}</td></tr>
    <tr><td style="${cellLabel}">Livello Qualità</td><td style="${cellValue}">${formatQuality(config.qualityLevel || 'standard')}</td></tr>
  `;

  // Service breakdown
  const breakdown = config.breakdown || {};
  const servicesDetail = breakdown.servicesDetail || {};

  let serviceRows = '';
  for (const [key, value] of Object.entries(servicesDetail)) {
    serviceRows += `<tr style="background: #ffffff;">
      <td style="${cellLabel} padding-left: 24px;">• ${formatService(key)}</td>
      <td style="${cellValue}">${formatPrice(value as number)}</td>
    </tr>`;
  }

  // Summary rows
  const summaryHeaderStyle = 'padding: 10px 12px; color: #6c757d; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #dee2e6;';
  const summaryRows = `
    ${breakdown.base ? `<tr style="background: #f8f9fa;"><td style="${cellLabel}">Ristrutturazione Base</td><td style="${cellValue}">${formatPrice(breakdown.base)}</td></tr>` : ''}
    ${breakdown.services ? `<tr style="background: #f8f9fa;"><td style="padding: 10px 12px; color: #212529; font-weight: 600; font-size: 13px; border-bottom: 1px solid #dee2e6;">Servizi Aggiuntivi</td><td style="${cellValue}">${formatPrice(breakdown.services)}</td></tr>` : ''}
    ${serviceRows}
    ${breakdown.bathrooms ? `<tr style="background: #f8f9fa;"><td style="${cellLabel}">Bagni (${config.bathrooms || 0})</td><td style="${cellValue}">${formatPrice(breakdown.bathrooms)}</td></tr>` : ''}
    ${breakdown.windows ? `<tr style="background: #f8f9fa;"><td style="${cellLabel}">Infissi</td><td style="${cellValue}">${formatPrice(breakdown.windows)}</td></tr>` : ''}
  `;

  return `
    <div style="margin-bottom: 20px;">
      <p style="color: #212529; font-weight: 600; font-size: 15px; margin: 0 0 12px;">🏠 Configurazione Progetto</p>
      <div style="border-radius: 12px; overflow: hidden; border: 1px solid #dee2e6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr style="background: #e9ecef;">
              <th colspan="2" style="${summaryHeaderStyle}">Dettagli Immobile</th>
            </tr>
          </thead>
          <tbody>
            ${propertyRows}
          </tbody>
          <thead>
            <tr style="background: #e9ecef;">
              <th colspan="2" style="${summaryHeaderStyle}">Voci di Spesa</th>
            </tr>
          </thead>
          <tbody>
            ${summaryRows}
          </tbody>
          <tfoot>
            <tr style="background: #212529;">
              <td style="padding: 12px; color: #f8f9fa; font-weight: 600; font-size: 14px;">Stima Totale Progetto</td>
              <td style="padding: 12px; color: #f8f9fa; font-weight: 700; font-size: 16px; text-align: right;">${formatPrice(config.estimatedPrice || 0)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;
};

// ────────────────────────────────────────
// Generic Email Action
// ────────────────────────────────────────

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: args.to,
          subject: args.subject,
          html: args.html
        })
      });

      if (!res.ok) {
        const error = await res.text();
        console.error("Resend error:", error);
        return { success: false, message: error };
      }

      return { success: true, message: "Email sent successfully" };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, message: "Operazione non riuscita. Riprova tra qualche istante." };
    }
  },
});

// ────────────────────────────────────────
// Calculator / Quote Email
// ────────────────────────────────────────

export const sendCalculatorEmail = action({
  args: {
    to: v.string(),
    quoteDetails: v.any(),
  },
  handler: async (ctx, args) => {
    const q = args.quoteDetails;
    const quoteType = formatQuoteType(q.quote_type || '');
    const price = formatPrice(q.estimated_price || 0);

    // ── User Email ──
    const userContent = `
      <h2 style="color: #212529; font-size: 22px; margin: 0 0 8px; font-weight: 600;">
        Conferma Richiesta Preventivo
      </h2>
      <p style="color: #6c757d; font-size: 14px; margin: 0 0 24px;">
        Grazie${q.full_name ? `, ${q.full_name}` : ''}! Abbiamo ricevuto la tua richiesta di preventivo.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <tr>
          <td>
            <p style="color: #212529; font-weight: 600; font-size: 15px; margin: 0 0 12px;">Riepilogo</p>
            <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px;">
              <tr>
                <td style="color: #6c757d; padding: 4px 0;">Tipo di Preventivo</td>
                <td style="color: #212529; font-weight: 600; text-align: right;">${quoteType}</td>
              </tr>
              <tr>
                <td style="color: #6c757d; padding: 4px 0;">Stima Indicativa</td>
                <td style="color: #212529; font-weight: 700; font-size: 18px; text-align: right;">${price}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <div style="background: linear-gradient(135deg, #212529, #343a40); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #f8f9fa; font-weight: 600; font-size: 15px; margin: 0 0 8px;">📋 Prossimi Passi</p>
        <ol style="color: #dee2e6; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Un nostro esperto analizzerà la tua richiesta</li>
          <li>Ti contatteremo per discussione dettagli e sopralluogo</li>
          <li>Riceverai il preventivo definitivo personalizzato</li>
        </ol>
      </div>

      ${q.notes ? `
        <div style="border-left: 3px solid #212529; padding-left: 16px; margin-bottom: 24px;">
          <p style="color: #6c757d; font-size: 12px; margin: 0 0 4px;">NOTE AGGIUNTIVE</p>
          <p style="color: #212529; font-size: 14px; margin: 0;">${q.notes}</p>
        </div>
      ` : ''}

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${COMPANY_WEBSITE}/MyAppointments" style="display: inline-block; background: linear-gradient(135deg, #212529, #343a40); color: #f8f9fa; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 14px;">
              📅 Prenota Appuntamento
            </a>
          </td>
        </tr>
      </table>

      <p style="color: #adb5bd; font-size: 12px; text-align: center; margin: 24px 0 0;">
        ⚠️ I prezzi indicati sono stime e non rappresentano il costo reale. Il preventivo definitivo sarà comunicato dopo un sopralluogo.
      </p>
    `;

    // ── Admin Email ──
    const windowDetails = renderWindowConfigHtml(q.window_config);
    const projectDetails = renderProjectConfigHtml(q.project_config);

    const adminContent = `
      <div style="background: #fff3cd; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #ffc107;">
        <p style="color: #664d03; font-weight: 600; font-size: 16px; margin: 0;">
          🔔 Nuova Richiesta di Preventivo
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <tr><td>
          <p style="color: #6c757d; font-size: 12px; margin: 0;">DATI CLIENTE</p>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px; margin-top: 8px;">
            <tr>
              <td style="color: #6c757d;">Nome</td>
              <td style="color: #212529; font-weight: 600;">${q.full_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="color: #6c757d;">Email</td>
              <td style="color: #212529; font-weight: 600;">${args.to}</td>
            </tr>
            <tr>
              <td style="color: #6c757d;">Telefono</td>
              <td style="color: #212529; font-weight: 600;">${q.phone || 'Non specificato'}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <tr><td>
          <p style="color: #6c757d; font-size: 12px; margin: 0;">DETTAGLI PREVENTIVO</p>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px; margin-top: 8px;">
            <tr>
              <td style="color: #6c757d;">Tipo</td>
              <td style="color: #212529; font-weight: 600;">${quoteType}</td>
            </tr>
            <tr>
              <td style="color: #6c757d;">Stima Totale</td>
              <td style="color: #212529; font-weight: 700; font-size: 20px;">${price}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      ${windowDetails}
      ${projectDetails}

      ${q.notes ? `
        <div style="border-left: 3px solid #6c757d; padding-left: 16px; margin-bottom: 20px;">
          <p style="color: #6c757d; font-size: 12px; margin: 0 0 4px;">NOTE DEL CLIENTE</p>
          <p style="color: #212529; font-size: 14px; margin: 0;">${q.notes}</p>
        </div>
      ` : ''}

      <div style="background: #d1ecf1; border-radius: 12px; padding: 16px; border-left: 4px solid #0dcaf0;">
        <p style="color: #0c5460; font-size: 13px; margin: 0;">
          <strong>Azione richiesta:</strong> Contattare il cliente per fissare un sopralluogo e discutere i dettagli del progetto.
        </p>
      </div>
    `;

    try {
      // Send to user
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: args.to,
          subject: "✅ Conferma Richiesta Preventivo - IwHome",
          html: emailWrapper(userContent)
        })
      });

      // Send to admin
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: ADMIN_EMAILS,
          subject: `🔔 Nuova Richiesta Preventivo: ${q.full_name || args.to} • ${quoteType} • ${price}`,
          html: emailWrapper(adminContent)
        })
      });

      return { success: true };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, message: "Operazione non riuscita. Riprova tra qualche istante." };
    }
  },
});

// ────────────────────────────────────────
// Appointment Request Email
// ────────────────────────────────────────

export const sendAppointmentEmail = action({
  args: {
    to: v.string(),
    appointmentDetails: v.any(),
  },
  handler: async (ctx, args) => {
    const { full_name, appointment_date, appointment_time, project_type, notes } = args.appointmentDetails;

    const userContent = `
      <h2 style="color: #212529; font-size: 22px; margin: 0 0 8px; font-weight: 600;">
        Richiesta Appuntamento Ricevuta
      </h2>
      <p style="color: #6c757d; font-size: 14px; margin: 0 0 24px;">
        Gentile ${full_name || 'Cliente'}, abbiamo ricevuto la tua richiesta. Ti confermeremo la disponibilità a breve.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <tr><td>
          <p style="color: #212529; font-weight: 600; font-size: 15px; margin: 0 0 12px;">📅 Dettagli Appuntamento</p>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px;">
            <tr>
              <td style="color: #6c757d; padding: 4px 0;">Data Richiesta</td>
              <td style="color: #212529; font-weight: 600; text-align: right;">${appointment_date}</td>
            </tr>
            <tr>
              <td style="color: #6c757d; padding: 4px 0;">Ora</td>
              <td style="color: #212529; font-weight: 600; text-align: right;">${appointment_time}</td>
            </tr>
            <tr>
              <td style="color: #6c757d; padding: 4px 0;">Tipo Progetto</td>
              <td style="color: #212529; font-weight: 600; text-align: right;">${project_type}</td>
            </tr>
            ${notes ? `
            <tr>
              <td style="color: #6c757d; padding: 4px 0;">Note</td>
              <td style="color: #212529; text-align: right;">${notes}</td>
            </tr>
            ` : ''}
          </table>
        </td></tr>
      </table>

      <div style="background: linear-gradient(135deg, #212529, #343a40); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #f8f9fa; font-size: 14px; margin: 0; line-height: 1.6;">
          📍 <strong>Indirizzo Showroom</strong><br />
          ${COMPANY_ADDRESS}<br />
          📞 ${COMPANY_PHONE_1} • ${COMPANY_PHONE_2}
        </p>
      </div>

      <p style="color: #6c757d; font-size: 13px; margin: 0; text-align: center;">
        Riceverai un'email di conferma definitiva una volta verificata la disponibilità.
      </p>
    `;

    const adminContent = `
      <div style="background: #cfe2ff; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #0d6efd;">
        <p style="color: #084298; font-weight: 600; font-size: 16px; margin: 0;">
          📅 Nuova Richiesta di Appuntamento
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <tr><td>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px;">
            <tr>
              <td style="color: #6c757d;">Cliente</td>
              <td style="color: #212529; font-weight: 600;">${full_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="color: #6c757d;">Email</td>
              <td style="color: #212529; font-weight: 600;">${args.to}</td>
            </tr>
            <tr>
              <td style="color: #6c757d;">Data</td>
              <td style="color: #212529; font-weight: 600;">${appointment_date}</td>
            </tr>
            <tr>
              <td style="color: #6c757d;">Ora</td>
              <td style="color: #212529; font-weight: 600;">${appointment_time}</td>
            </tr>
            <tr>
              <td style="color: #6c757d;">Tipo Progetto</td>
              <td style="color: #212529; font-weight: 600;">${project_type}</td>
            </tr>
            ${notes ? `
            <tr>
              <td style="color: #6c757d;">Note</td>
              <td style="color: #212529;">${notes}</td>
            </tr>
            ` : ''}
          </table>
        </td></tr>
      </table>

      <div style="background: #fff3cd; border-radius: 12px; padding: 16px; border-left: 4px solid #ffc107;">
        <p style="color: #664d03; font-size: 13px; margin: 0;">
          <strong>⚡ Azione richiesta:</strong> Confermare o rifiutare l'appuntamento nel pannello admin.
        </p>
      </div>
    `;

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: args.to,
          subject: "📅 Richiesta Appuntamento Ricevuta - IwHome",
          html: emailWrapper(userContent)
        })
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: ADMIN_EMAILS,
          subject: `📅 Nuova Richiesta Appuntamento - ${full_name || args.to} (${appointment_date} ${appointment_time})`,
          html: emailWrapper(adminContent)
        })
      });

      return { success: true };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, message: "Operazione non riuscita. Riprova tra qualche istante." };
    }
  },
});

// ────────────────────────────────────────
// Appointment Status (Confirm / Reject)
// ────────────────────────────────────────

export const sendAppointmentStatusEmail = action({
  args: {
    to: v.string(),
    status: v.string(),
    full_name: v.string(),
    appointment_date: v.string(),
    appointment_time: v.string(),
  },
  handler: async (ctx, args) => {
    const isConfirmed = args.status === 'confirmed';

    const confirmedContent = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #d4edda; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 28px; margin-bottom: 12px;">✓</div>
        <h2 style="color: #155724; font-size: 22px; margin: 0;">Appuntamento Confermato!</h2>
      </div>

      <p style="color: #495057; font-size: 14px; margin: 0 0 24px; text-align: center;">
        Gentile ${args.full_name}, siamo lieti di confermare il tuo appuntamento.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #d4edda; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #28a745;">
        <tr><td>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px;">
            <tr>
              <td style="color: #155724;">📅 Data</td>
              <td style="color: #155724; font-weight: 700; text-align: right; font-size: 16px;">${args.appointment_date}</td>
            </tr>
            <tr>
              <td style="color: #155724;">🕐 Ora</td>
              <td style="color: #155724; font-weight: 700; text-align: right; font-size: 16px;">${args.appointment_time}</td>
            </tr>
            <tr>
              <td style="color: #155724;">📍 Luogo</td>
              <td style="color: #155724; font-weight: 600; text-align: right;">${COMPANY_ADDRESS}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #212529; font-weight: 600; font-size: 14px; margin: 0 0 8px;">Come raggiungere lo showroom</p>
        <p style="color: #6c757d; font-size: 13px; margin: 0; line-height: 1.6;">
          Lo showroom IwHome si trova in ${COMPANY_ADDRESS}.<br />
          Per qualsiasi necessità, contattaci al <strong>${COMPANY_PHONE_1}</strong> o <strong>${COMPANY_PHONE_2}</strong>.
        </p>
      </div>

      <p style="color: #495057; font-size: 14px; text-align: center; margin: 0;">Ti aspettiamo!</p>
    `;

    const rejectedContent = `
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: #f8d7da; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 28px; margin-bottom: 12px;">✕</div>
        <h2 style="color: #842029; font-size: 22px; margin: 0;">Appuntamento Non Disponibile</h2>
      </div>

      <p style="color: #495057; font-size: 14px; margin: 0 0 24px; text-align: center;">
        Gentile ${args.full_name}, ci dispiace ma l'appuntamento richiesto non è disponibile.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8d7da; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #dc3545;">
        <tr><td>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px;">
            <tr>
              <td style="color: #842029;">Data Richiesta</td>
              <td style="color: #842029; font-weight: 600; text-align: right;">${args.appointment_date}</td>
            </tr>
            <tr>
              <td style="color: #842029;">Ora Richiesta</td>
              <td style="color: #842029; font-weight: 600; text-align: right;">${args.appointment_time}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${COMPANY_WEBSITE}/MyAppointments" style="display: inline-block; background: linear-gradient(135deg, #212529, #343a40); color: #f8f9fa; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 14px;">
              📅 Prenota un Altro Appuntamento
            </a>
          </td>
        </tr>
      </table>

      <p style="color: #6c757d; font-size: 13px; text-align: center; margin: 16px 0 0;">
        Puoi anche contattarci al <strong>${COMPANY_PHONE_1}</strong> per concordare un orario alternativo.
      </p>
    `;

    const html = emailWrapper(isConfirmed ? confirmedContent : rejectedContent);

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: args.to,
          subject: isConfirmed
            ? `✅ Appuntamento Confermato ${args.appointment_date} - IwHome`
            : `❌ Appuntamento Non Disponibile - IwHome`,
          html: html
        })
      });

      return { success: true };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, message: "Operazione non riuscita. Riprova tra qualche istante." };
    }
  },
});

// ────────────────────────────────────────
// Edilizia Quote Request Email
// ────────────────────────────────────────

const formatEdiliziaField = (key: string, value: any): string => {
  const labels: Record<string, string> = {
    tipo_immobile: 'Tipo Immobile',
    ubicazione: 'Ubicazione',
    stato_conservazione: 'Stato di Conservazione',
    spostamento_tramezzi: 'Spostamento Tramezzi',
    impianto_elettrico: 'Impianto Elettrico',
    riscaldamento: 'Riscaldamento',
    finiture: 'Finiture e Materiali',
    controsoffittature_mq: 'Controsoffittature (MQ)',
    porte_num: 'Porte da Sostituire',
    finestre_num: 'Finestre da Sostituire',
    parquet_mq: 'Parquet (MQ)',
    marmo_mq: 'Pavimento in Marmo (MQ)',
    monocottura_mq: 'Monocottura (MQ)',
    resina_mq: 'Resina (MQ)',
    bagni_num: 'Bagni',
    pittura: 'Opere di Pittura',
  };
  const valueLabels: Record<string, string> = {
    villa_unifamiliare: 'Villa Unifamiliare', casale: 'Casale', appartamento: 'Appartamento',
    nord: 'Nord Italia', centro: 'Centro Italia', sud: 'Sud Italia',
    media: 'Nella media', degradato: 'Degradato',
    '20pct': 'Variazione del 20%', '50pct': 'Variazione del 50%', '100pct': 'Variazione del 100%',
    piccole: 'Piccole modifiche', standard: 'Nuovo impianto standard', domotico: 'Nuovo impianto domotico',
    incluso: 'Incluso', escluso: 'Escluso', adeguamento: 'Lavori di adeguamento',
    standard_q: 'Standard', alta_qualita: 'Alta qualità',
    incluse: 'Incluse', escluse: 'Escluse',
  };
  const label = labels[key] || key;
  const displayValue = valueLabels[String(value)] || String(value);
  return `<tr><td style="color: #6c757d; padding: 4px 0; font-size: 13px;">${label}</td><td style="color: #212529; font-weight: 600; text-align: right; font-size: 13px;">${displayValue}</td></tr>`;
};

export const sendEdiliziaEmail = action({
  args: {
    to: v.string(),
    quoteDetails: v.any(),
  },
  handler: async (ctx, args) => {
    const q = args.quoteDetails;
    const ec = q.edilizia_config || {};
    const price = formatPrice(q.estimated_price || 0);
    const name = q.full_name || 'Cliente';

    // Build the config detail rows for the email
    const configFields = ['tipo_immobile', 'ubicazione', 'stato_conservazione',
      'spostamento_tramezzi', 'impianto_elettrico', 'riscaldamento', 'finiture',
      'controsoffittature_mq', 'porte_num', 'finestre_num', 'parquet_mq',
      'marmo_mq', 'monocottura_mq', 'resina_mq', 'bagni_num', 'pittura'];

    const configRows = configFields
      .filter(k => ec[k] !== undefined && ec[k] !== '' && ec[k] !== null && ec[k] !== 0)
      .map(k => formatEdiliziaField(k, ec[k]))
      .join('');

    // ── User Email ──
    const userContent = `
      <h2 style="color: #212529; font-size: 22px; margin: 0 0 8px; font-weight: 600;">
        Conferma Richiesta Preventivo Ristrutturazione
      </h2>
      <p style="color: #6c757d; font-size: 14px; margin: 0 0 24px;">
        Grazie ${name}! Abbiamo ricevuto la tua richiesta di preventivo per la ristrutturazione.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <tr><td>
          <p style="color: #212529; font-weight: 600; font-size: 15px; margin: 0 0 12px;">📋 Riepilogo Richiesta</p>
          <table width="100%" cellpadding="4" cellspacing="0">
            <tr>
              <td style="color: #6c757d; font-size: 13px;">Superficie</td>
              <td style="color: #212529; font-weight: 700; text-align: right; font-size: 16px;">${ec.mq || 0} MQ</td>
            </tr>
            ${configRows}
            <tr>
              <td colspan="2" style="border-top: 1px solid #dee2e6; padding-top: 12px; margin-top: 12px;"></td>
            </tr>
            <tr>
              <td style="color: #6c757d; font-size: 13px;">Stima Preventivo</td>
              <td style="color: #212529; font-weight: 800; text-align: right; font-size: 20px;">${price}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      <div style="background: #fff3cd; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #ffc107;">
        <p style="color: #664d03; font-size: 13px; margin: 0; line-height: 1.6;">
          ⚠️ <strong>Nota:</strong> La stima indicata è puramente orientativa. Il preventivo definitivo verrà concordato dopo un sopralluogo gratuito con il nostro team.
        </p>
      </div>

      <div style="background: linear-gradient(135deg, #212529, #343a40); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #f8f9fa; font-weight: 600; font-size: 15px; margin: 0 0 8px;">📌 Prossimi Passi</p>
        <ol style="color: #dee2e6; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Il nostro team ha ricevuto la tua richiesta e la analizzerà</li>
          <li>Ti contatteremo entro 24/48h per fissare un sopralluogo gratuito</li>
          <li>Riceverai un preventivo definitivo personalizzato</li>
        </ol>
      </div>

      ${q.notes ? `<div style="border-left: 3px solid #212529; padding-left: 16px; margin-bottom: 24px;"><p style="color: #6c757d; font-size: 12px; margin: 0 0 4px;">NOTE</p><p style="color: #212529; font-size: 14px; margin: 0;">${q.notes}</p></div>` : ''}

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${COMPANY_WEBSITE}/MyAppointments" style="display: inline-block; background: linear-gradient(135deg, #212529, #343a40); color: #f8f9fa; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 14px;">
              📅 Prenota Sopralluogo
            </a>
          </td>
        </tr>
      </table>
    `;

    // ── Admin Email ──
    const adminContent = `
      <div style="background: #fff3cd; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #ffc107;">
        <p style="color: #664d03; font-weight: 600; font-size: 16px; margin: 0;">
          🔔 Nuova Richiesta Preventivo Edilizia
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <tr><td>
          <p style="color: #6c757d; font-size: 12px; margin: 0;">DATI CLIENTE</p>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px; margin-top: 8px;">
            <tr><td style="color: #6c757d;">Nome</td><td style="color: #212529; font-weight: 600;">${name}</td></tr>
            <tr><td style="color: #6c757d;">Email</td><td style="color: #212529; font-weight: 600;">${args.to}</td></tr>
          </table>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <tr><td>
          <p style="color: #6c757d; font-size: 12px; margin: 0;">DETTAGLI IMMOBILE E LAVORI</p>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px; margin-top: 8px;">
            <tr>
              <td style="color: #6c757d;">Superficie</td>
              <td style="color: #212529; font-weight: 700; text-align: right; font-size: 16px;">${ec.mq || 0} MQ</td>
            </tr>
            ${configRows}
          </table>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #212529; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <tr><td>
          <table width="100%" cellpadding="4" cellspacing="0">
            <tr>
              <td style="color: #dee2e6; font-size: 14px;">Stima Calcolata</td>
              <td style="color: #f8f9fa; font-weight: 800; text-align: right; font-size: 22px;">${price}</td>
            </tr>
          </table>
        </td></tr>
      </table>

      ${q.notes ? `<div style="border-left: 3px solid #6c757d; padding-left: 16px; margin-bottom: 20px;"><p style="color: #6c757d; font-size: 12px; margin: 0 0 4px;">NOTE DEL CLIENTE</p><p style="color: #212529; font-size: 14px; margin: 0;">${q.notes}</p></div>` : ''}

      <div style="background: #d1ecf1; border-radius: 12px; padding: 16px; border-left: 4px solid #0dcaf0;">
        <p style="color: #0c5460; font-size: 13px; margin: 0;">
          <strong>Azione richiesta:</strong> Contattare il cliente per fissare un sopralluogo. La richiesta è visibile in <a href="${COMPANY_WEBSITE}/Preventivi" style="color: #0c5460;">Preventivi</a>.
        </p>
      </div>
    `;

    try {
      // Send to user
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: "onboarding@resend.dev", to: args.to, subject: "✅ Richiesta Preventivo Ristrutturazione Ricevuta - IwHome", html: emailWrapper(userContent) })
      });

      // Send to admin
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: "onboarding@resend.dev", to: ADMIN_EMAILS, subject: `🔔 Nuova Richiesta Edilizia: ${name} • ${ec.mq || 0} MQ • ${price}`, html: emailWrapper(adminContent) })
      });

      return { success: true };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, message: "Operazione non riuscita. Riprova tra qualche istante." };
    }
  },
});

// ────────────────────────────────────────
// Render 3D Request Email
// ────────────────────────────────────────

export const sendRender3DEmail = action({
  args: {
    to: v.string(),
    requestDetails: v.any(),
  },
  handler: async (ctx, args) => {
    const r = args.requestDetails;
    const name = r.full_name || 'Cliente';
    const modeLabel = r.mode === 'per_stanza' ? 'Per Stanza' : 'Appartamento Intero';

    const roomRows = (r.rooms || []).map((room: any) =>
      `<tr><td style="color: #6c757d; font-size: 13px; padding: 4px 0;">${room.room_label}</td><td style="color: #212529; font-weight: 600; text-align: right; font-size: 13px;">${room.mq} MQ</td></tr>`
    ).join('');

    // ── User Email ──
    const userContent = `
      <h2 style="color: #212529; font-size: 22px; margin: 0 0 8px; font-weight: 600;">
        Richiesta Render 3D Ricevuta
      </h2>
      <p style="color: #6c757d; font-size: 14px; margin: 0 0 24px;">
        Grazie ${name}! Abbiamo ricevuto la tua richiesta di Render 3D.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <tr><td>
          <p style="color: #212529; font-weight: 600; font-size: 15px; margin: 0 0 12px;">🎨 Dettagli Richiesta</p>
          <table width="100%" cellpadding="4" cellspacing="0">
            <tr>
              <td style="color: #6c757d; font-size: 13px; padding: 4px 0;">Modalità</td>
              <td style="color: #212529; font-weight: 600; text-align: right; font-size: 13px;">${modeLabel}</td>
            </tr>
            <tr>
              <td style="color: #6c757d; font-size: 13px; padding: 4px 0;">Totale superficie</td>
              <td style="color: #212529; font-weight: 700; text-align: right; font-size: 16px;">${r.total_mq} MQ</td>
            </tr>
            <tr><td colspan="2" style="border-top: 1px solid #dee2e6; padding-top: 8px; padding-bottom: 4px;"><strong style="color: #495057; font-size: 12px;">STANZE RICHIESTE</strong></td></tr>
            ${roomRows}
          </table>
        </td></tr>
      </table>

      <div style="background: #cfe2ff; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #0d6efd;">
        <p style="color: #084298; font-size: 13px; margin: 0; line-height: 1.6;">
          📩 <strong>Il preventivo del Render 3D</strong> verrà elaborato dal nostro team e ti sarà inviato via email con il dettaglio dei costi per ogni stanza e il totale.
        </p>
      </div>

      ${r.notes ? `<div style="border-left: 3px solid #212529; padding-left: 16px; margin-bottom: 24px;"><p style="color: #6c757d; font-size: 12px; margin: 0 0 4px;">NOTE</p><p style="color: #212529; font-size: 14px; margin: 0;">${r.notes}</p></div>` : ''}

      <p style="color: #6c757d; font-size: 13px; text-align: center; margin: 0;">
        Per qualsiasi domanda contattaci al <strong>${COMPANY_PHONE_1}</strong>
      </p>
    `;

    // ── Admin Email ──
    const adminContent = `
      <div style="background: #cfe2ff; border-radius: 12px; padding: 16px; margin-bottom: 24px; border-left: 4px solid #0d6efd;">
        <p style="color: #084298; font-weight: 600; font-size: 16px; margin: 0;">
          🎨 Nuova Richiesta Render 3D
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <tr><td>
          <p style="color: #6c757d; font-size: 12px; margin: 0;">CLIENTE</p>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px; margin-top: 8px;">
            <tr><td style="color: #6c757d;">Nome</td><td style="color: #212529; font-weight: 600;">${name}</td></tr>
            <tr><td style="color: #6c757d;">Email</td><td style="color: #212529; font-weight: 600;">${args.to}</td></tr>
            <tr><td style="color: #6c757d;">Modalità</td><td style="color: #212529; font-weight: 600;">${modeLabel}</td></tr>
            <tr><td style="color: #6c757d;">MQ Totali</td><td style="color: #212529; font-weight: 700; font-size: 18px;">${r.total_mq} MQ</td></tr>
          </table>
        </td></tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <tr><td>
          <p style="color: #6c757d; font-size: 12px; margin: 0 0 8px;">STANZE RICHIESTE</p>
          <table width="100%" cellpadding="4" cellspacing="0" style="font-size: 14px;">
            ${roomRows}
          </table>
        </td></tr>
      </table>

      ${r.notes ? `<div style="border-left: 3px solid #6c757d; padding-left: 16px; margin-bottom: 20px;"><p style="color: #6c757d; font-size: 12px; margin: 0 0 4px;">NOTE</p><p style="color: #212529; font-size: 14px; margin: 0;">${r.notes}</p></div>` : ''}

      <div style="background: #fff3cd; border-radius: 12px; padding: 16px; border-left: 4px solid #ffc107;">
        <p style="color: #664d03; font-size: 13px; margin: 0;">
          <strong>⚡ Azione richiesta:</strong> Calcola il preventivo Render 3D per ogni stanza e invia email al cliente. La richiesta è visibile in <a href="${COMPANY_WEBSITE}/Preventivi" style="color: #664d03;">Preventivi</a>.
        </p>
      </div>
    `;

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: "onboarding@resend.dev", to: args.to, subject: "🎨 Richiesta Render 3D Ricevuta - IwHome", html: emailWrapper(userContent) })
      });

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({ from: "onboarding@resend.dev", to: ADMIN_EMAILS, subject: `🎨 Nuova Richiesta Render 3D: ${name} • ${r.rooms?.length || 0} stanze • ${r.total_mq} MQ`, html: emailWrapper(adminContent) })
      });

      return { success: true };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, message: "Operazione non riuscita. Riprova tra qualche istante." };
    }
  },
});

// ────────────────────────────────────────
// Team Invite Email
// ────────────────────────────────────────

export const sendTeamInviteEmail = action({
  args: {
    to: v.string(),
    cantiereNome: v.string(),
    inviterName: v.string(),
    inviterEmail: v.string(),
  },
  handler: async (ctx, args) => {
    const content = `
      <h2 style="color: #212529; font-size: 22px; margin: 0 0 8px; font-weight: 600;">
        Invito a Collaborare
      </h2>
      <p style="color: #6c757d; font-size: 14px; margin: 0 0 24px;">
        <strong>${args.inviterName}</strong> (${args.inviterEmail}) ti ha invitato a collaborare su un cantiere.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0" style="background: #cfe2ff; border-radius: 12px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #0d6efd;">
        <tr><td>
          <p style="color: #084298; font-weight: 700; font-size: 18px; margin: 0;">🏗️ ${args.cantiereNome}</p>
        </td></tr>
      </table>

      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #212529; font-weight: 600; font-size: 14px; margin: 0 0 12px;">Come membro del team potrai:</p>
        <table cellpadding="4" cellspacing="0" style="font-size: 14px; color: #495057;">
          <tr><td>✅</td><td>Visualizzare i dettagli del cantiere</td></tr>
          <tr><td>✅</td><td>Aggiornare l'avanzamento dei lavori</td></tr>
          <tr><td>✅</td><td>Comunicare con il team via chat integrata</td></tr>
          <tr><td>✅</td><td>Condividere documenti e immagini</td></tr>
        </table>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${COMPANY_WEBSITE}/Dashboard" style="display: inline-block; background: linear-gradient(135deg, #0d6efd, #0b5ed7); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 14px;">
              🚀 Accedi alla Piattaforma
            </a>
          </td>
        </tr>
      </table>
    `;

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: args.to,
          subject: `🏗️ Invito a collaborare su "${args.cantiereNome}" - IwHome`,
          html: emailWrapper(content)
        })
      });

      // Notify admin
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: ADMIN_EMAILS,
          subject: `Team Invite: ${args.to} → "${args.cantiereNome}"`,
          html: emailWrapper(`<p>${args.inviterName} ha invitato <strong>${args.to}</strong> a collaborare sul cantiere <strong>"${args.cantiereNome}"</strong>.</p>`)
        })
      });

      return { success: true };
    } catch (error) {
      console.error("Email sending failed:", error);
      return { success: false, message: "Operazione non riuscita. Riprova tra qualche istante." };
    }
  },
});
