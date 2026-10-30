/**
 * Green-API WhatsApp integration for DIGISTORE
 * Sends real-time notifications to a WhatsApp Group or Chat when new orders arrive.
 */

export async function sendWhatsAppOrderNotification(order, greenApiConfig = {}, storeInfo = {}) {
  const apiUrl = (greenApiConfig.apiUrl || 'https://7107.api.greenapi.com').replace(/\/+$/, '');
  const idInstance = greenApiConfig.idInstance || '710722785894';
  const apiToken = greenApiConfig.apiTokenInstance || '67bfe5f4eb344f108e09fb48f55e1f41390adb019b3240fcbf';
  const chatId = greenApiConfig.chatId || '120363429062857929@g.us'; // Default to "news orders" group

  if (!greenApiConfig.enabled && greenApiConfig.enabled !== undefined) {
    console.log('[Green-API] Notifications WhatsApp désactivées dans les paramètres.');
    return { sent: false, reason: 'Notifications WhatsApp désactivées' };
  }

  if (!idInstance || !apiToken || !chatId) {
    console.warn('[Green-API] Configuration incomplète (idInstance, apiTokenInstance ou chatId manquant).');
    return { sent: false, reason: 'Configuration incomplète' };
  }

  const cleanWhatsapp = (order.whatsapp || order.phone || '').replace(/[^0-9]/g, '');
  const waContactLink = cleanWhatsapp ? `https://wa.me/${cleanWhatsapp}` : '';

  const message =
    `🛍️ *NOUVELLE COMMANDE REÇUE !*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 *Produit :* ${order.productTitle}\n` +
    (order.productDuration ? `⏳ *Durée :* ${order.productDuration}\n` : '') +
    `💰 *Prix :* ${order.priceText || (order.priceMAD ? order.priceMAD + ' DH' : 'Non spécifié')}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Client :* ${order.fullName}\n` +
    `📞 *Téléphone :* ${order.phone}\n` +
    `💬 *WhatsApp :* ${order.whatsapp || order.phone}\n` +
    (order.note ? `📝 *Note client :* « ${order.note} »\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🆔 *N° Commande :* #${order.id}\n` +
    `📅 *Date :* ${new Date(order.createdAt || Date.now()).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}\n` +
    (waContactLink ? `\n👉 *Écrire au client sur WhatsApp :*\n${waContactLink}` : '');

  try {
    const endpoint = `${apiUrl}/waInstance${idInstance}/sendMessage/${apiToken}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: chatId.trim(),
        message: message,
      }),
    });

    const data = await res.json();
    if (res.ok && data.idMessage) {
      console.log('[Green-API] Notification envoyée avec succès au groupe WhatsApp ! idMessage:', data.idMessage);
      return { sent: true, idMessage: data.idMessage };
    } else {
      console.error('[Green-API] Échec de l’envoi WhatsApp:', data);
      return { sent: false, error: data };
    }
  } catch (err) {
    console.error('[Green-API] Erreur réseau lors de l’envoi:', err.message);
    return { sent: false, error: err.message };
  }
}

/**
 * Send a test message to verify Green-API group settings
 */
export async function sendGreenApiTestMessage({ apiUrl, idInstance, apiTokenInstance, chatId, storeName }) {
  const url = (apiUrl || 'https://7107.api.greenapi.com').replace(/\/+$/, '');
  const endpoint = `${url}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;

  const message =
    `✅ *TEST DE CONNEXION GREEN-API RÉUSSI !*\n\n` +
    `Ce message confirme que votre boutique *${storeName || 'DIGISTORE'}* est connectée à ce groupe WhatsApp.\n` +
    `Vous recevrez ici une alerte instantanée pour chaque nouvelle commande passée par vos clients ! 🚀\n\n` +
    `⏰ *Date du test :* ${new Date().toLocaleString('fr-FR')}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chatId: (chatId || '120363429062857929@g.us').trim(),
      message: message,
    }),
  });

  const data = await res.json();
  if (res.ok && data.idMessage) {
    return { success: true, idMessage: data.idMessage };
  }
  throw new Error(data.message || JSON.stringify(data));
}

/**
 * Fetch list of WhatsApp groups available in this Green-API instance
 */
export async function fetchGreenApiGroups({ apiUrl, idInstance, apiTokenInstance }) {
  const url = (apiUrl || 'https://7107.api.greenapi.com').replace(/\/+$/, '');
  const endpoint = `${url}/waInstance${idInstance}/getChats/${apiTokenInstance}`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`Erreur Green-API (${res.status}): Impossible de récupérer les conversations`);
  }

  const chats = await res.json();
  if (!Array.isArray(chats)) {
    throw new Error('Format de réponse invalide reçu de Green-API');
  }

  // Filter for groups
  const groups = chats
    .filter((c) => c.type === 'group' || (c.id && c.id.endsWith('@g.us')))
    .map((g) => ({
      id: g.id,
      name: g.name || 'Groupe sans nom',
    }));

  return { success: true, groups };
}

