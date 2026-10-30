import nodemailer from 'nodemailer';

/**
 * Send an email notification to the store owner whenever a new order is placed.
 */
export async function sendOrderNotificationEmail(order, storeInfo = {}) {
  // Check recipient email
  const recipient =
    storeInfo.notificationEmail ||
    storeInfo.email ||
    process.env.NOTIFICATION_EMAIL ||
    'contact@store-digital.ma';

  if (storeInfo.gmailEnabled === false) {
    console.log('[Email Notification] Notifications email désactivées dans les paramètres.');
    return { sent: false, reason: 'Notifications email désactivées' };
  }

  // Read Gmail / SMTP settings from environment or storeInfo
  const smtpUser = storeInfo.gmailUser || storeInfo.smtpUser || process.env.SMTP_USER;
  const smtpPass = (storeInfo.gmailAppPassword || storeInfo.smtpPass || process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const isGmail = (smtpUser || '').toLowerCase().includes('@gmail.com');
  const smtpHost = process.env.SMTP_HOST || storeInfo.smtpHost || (isGmail ? 'smtp.gmail.com' : '');
  const smtpPort = Number(process.env.SMTP_PORT || storeInfo.smtpPort || (isGmail ? 465 : 587));
  const smtpSecure =
    process.env.SMTP_SECURE === 'true' ||
    storeInfo.smtpSecure === true ||
    smtpPort === 465 ||
    (isGmail && smtpPort === 465);

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log(
      `[Email Notification] SMTP non encore configuré. Commande #${order.id} enregistrée avec succès dans le tableau de bord Admin pour ${order.fullName}. (Pour activer les emails en direct, configurez SMTP dans Paramètres Admin)`
    );
    return {
      sent: false,
      reason: 'SMTP not configured (order saved in Admin)',
    };
  }

  try {
    const transportOptions = isGmail
      ? {
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        }
      : {
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        };

    const transporter = nodemailer.createTransport(transportOptions);

    const cleanWhatsapp = (order.whatsapp || order.phone || '').replace(/[^0-9]/g, '');
    const waLink = cleanWhatsapp
      ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
          `Bonjour ${order.fullName}, nous vous contactons concernant votre commande #${order.id} pour ${order.productTitle}.`
        )}`
      : '';

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;">
        <div style="background: linear-gradient(135deg, #1E293B, #3B4FD8); padding: 26px 20px; color: #FFFFFF; text-align: center;">
          <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Nouvelle Commande</span>
          <h1 style="margin: 10px 0 0; font-size: 22px; font-weight: 800;">🛍️ ${order.productTitle}</h1>
          <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Boutique : ${storeInfo.name || 'DIGISTORE'}</p>
        </div>

        <div style="padding: 24px;">
          <!-- Order ID & Time Box -->
          <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #3B4FD8;">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748B; font-weight: 600;">Numéro de commande :</div>
            <div style="font-size: 20px; font-weight: 800; color: #0F172A; margin-top: 2px;">#${order.id}</div>
            <div style="font-size: 12px; color: #94A3B8; margin-top: 4px;">📅 Reçue le : ${new Date(order.createdAt || Date.now()).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</div>
          </div>

          <!-- Product Details -->
          <h3 style="color: #0F172A; border-bottom: 2px solid #F1F5F9; padding-bottom: 8px; margin-top: 0; font-size: 15px;">📦 Détails de la Commande</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Produit :</td>
              <td style="padding: 8px 0; font-weight: 700; color: #0F172A; text-align: right; font-size: 14px;">${order.productTitle}</td>
            </tr>
            ${order.productDuration ? `
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Durée / Validité :</td>
              <td style="padding: 8px 0; color: #0F172A; text-align: right; font-size: 14px;">${order.productDuration}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Montant Total :</td>
              <td style="padding: 8px 0; font-weight: 800; color: #2563EB; font-size: 17px; text-align: right;">${order.priceText || (order.priceMAD ? order.priceMAD + ' DH' : 'Sur devis')}</td>
            </tr>
          </table>

          <!-- Customer Details -->
          <h3 style="color: #0F172A; border-bottom: 2px solid #F1F5F9; padding-bottom: 8px; margin-top: 0; font-size: 15px;">👤 Coordonnées du Client</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Nom complet :</td>
              <td style="padding: 8px 0; font-weight: 700; color: #0F172A; text-align: right; font-size: 14px;">${order.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Téléphone d'appel :</td>
              <td style="padding: 8px 0; font-weight: 700; color: #0F172A; text-align: right; font-size: 14px;">
                <a href="tel:${order.phone}" style="color: #2563EB; text-decoration: none;">${order.phone}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Numéro WhatsApp :</td>
              <td style="padding: 8px 0; font-weight: 700; color: #16A34A; text-align: right; font-size: 14px;">
                ${order.whatsapp || order.phone}
              </td>
            </tr>
            ${order.note ? `
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Remarque client :</td>
              <td style="padding: 8px 0; color: #334155; text-align: right; font-size: 14px; font-style: italic;">« ${order.note} »</td>
            </tr>` : ''}
          </table>

          <!-- Actions -->
          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #E2E8F0;">
            ${waLink ? `
              <a href="${waLink}" style="display: inline-block; background: #25D366; color: #FFFFFF; font-weight: 700; font-size: 14px; padding: 12px 20px; border-radius: 8px; text-decoration: none; margin: 4px;">
                💬 Contacter le client sur WhatsApp
              </a>
            ` : ''}
            <a href="tel:${order.phone}" style="display: inline-block; background: #3B4FD8; color: #FFFFFF; font-weight: 700; font-size: 14px; padding: 12px 20px; border-radius: 8px; text-decoration: none; margin: 4px;">
              📞 Appeler le client (${order.phone})
            </a>
          </div>
        </div>

        <div style="background: #F8FAFC; padding: 16px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0;">
          Boutique ${storeInfo.name || 'DIGISTORE'} • Gestion des commandes dans le panneau /admin
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${storeInfo.name || 'Store Digital'}" <${smtpUser}>`,
      to: recipient,
      subject: `🚨 [NOUVELLE COMMANDE #${order.id}] ${order.fullName} - ${order.productTitle}`,
      html,
    });

    console.log('[Email Notification] Email envoyé avec succès vers:', recipient, 'MessageId:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email Notification] Erreur lors de l’envoi de l’email:', err.message);
    return { sent: false, error: err.message };
  }
}

/**
 * Send a test email to verify SMTP configuration
 */
export async function sendTestEmail({ host, port, user, pass, secure, recipient, storeName }) {
  const cleanPass = (pass || '').replace(/\s+/g, '');
  const isGmail = (user || '').toLowerCase().includes('@gmail.com');

  const transportOptions = isGmail
    ? {
        service: 'gmail',
        auth: { user, pass: cleanPass },
      }
    : {
        host: host || 'smtp.gmail.com',
        port: Number(port || 587),
        secure: Boolean(secure || Number(port) === 465),
        auth: { user, pass: cleanPass },
      };

  const transporter = nodemailer.createTransport(transportOptions);

  const info = await transporter.sendMail({
    from: `"${storeName || 'DIGISTORE'}" <${user}>`,
    to: recipient || user,
    subject: `✅ Test de configuration Email - ${storeName || 'DIGISTORE'}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1E293B;">
        <h2 style="color: #16A34A;">✅ Félicitations ! Votre configuration SMTP fonctionne parfaitement.</h2>
        <p>Ce message confirme que votre boutique est prête à recevoir les notifications automatiques par email lors de chaque nouvelle commande.</p>
        <p style="color: #64748B; font-size: 12px;">Date du test : ${new Date().toLocaleString('fr-FR')}</p>
      </div>
    `,
  });

  return { success: true, messageId: info.messageId };
}

