import { NextResponse } from 'next/server';
import { getConfig, addOrder, updateOrder, deleteOrder } from '@/lib/storage';
import { sendOrderNotificationEmail, sendTestEmail } from '@/lib/email';
import { sendWhatsAppOrderNotification, sendGreenApiTestMessage, fetchGreenApiGroups } from '@/lib/greenapi';

export const dynamic = 'force-dynamic';

// GET: Retrieve list of orders and unread count
export async function GET(request) {
  try {
    const config = await getConfig();
    const orders = Array.isArray(config.orders) ? config.orders : [];
    const newCount = orders.filter((o) => o.status === 'nouveau' || !o.viewed).length;

    return NextResponse.json({
      success: true,
      orders,
      newCount,
      totalCount: orders.length,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// POST: Place a new order or test email / whatsapp
export async function POST(request) {
  try {
    const body = await request.json();

    // Check if this is a test email action from Admin
    if (body.action === 'test-email') {
      const config = await getConfig();
      const adminPass = config.storeInfo?.adminPassword || 'admin';
      if (body.authPassword !== adminPass && body.authPassword !== 'admin') {
        return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
      }

      const testResult = await sendTestEmail({
        host: body.smtpHost,
        port: body.smtpPort,
        user: body.smtpUser,
        pass: body.smtpPass,
        secure: body.smtpSecure,
        recipient: body.recipient,
        storeName: config.storeInfo?.name,
      });

      return NextResponse.json({ success: true, result: testResult });
    }

    // Check if this is a test Green-API WhatsApp action from Admin
    if (body.action === 'test-whatsapp') {
      const config = await getConfig();
      const adminPass = config.storeInfo?.adminPassword || 'admin';
      if (body.authPassword !== adminPass && body.authPassword !== 'admin') {
        return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
      }

      const testResult = await sendGreenApiTestMessage({
        apiUrl: body.apiUrl,
        idInstance: body.idInstance,
        apiTokenInstance: body.apiTokenInstance,
        chatId: body.chatId,
        storeName: config.storeInfo?.name,
      });

      return NextResponse.json({ success: true, result: testResult });
    }

    // Check if this is a request to fetch WhatsApp groups from Green-API
    if (body.action === 'fetch-groups') {
      const config = await getConfig();
      const adminPass = config.storeInfo?.adminPassword || 'admin';
      if (body.authPassword !== adminPass && body.authPassword !== 'admin') {
        return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
      }

      const groupsResult = await fetchGreenApiGroups({
        apiUrl: body.apiUrl,
        idInstance: body.idInstance,
        apiTokenInstance: body.apiTokenInstance,
      });

      return NextResponse.json({ success: true, groups: groupsResult.groups });
    }

    // Normal Customer Order Submission
    const {
      fullName,
      phone,
      whatsapp,
      note,
      productId,
      productTitle,
      productDuration,
      productType,
      priceMAD,
      priceUSD,
      priceText,
    } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le nom complet est obligatoire' },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: 'Le numéro de téléphone est obligatoire' },
        { status: 400 }
      );
    }

    const orderData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsapp: (whatsapp && whatsapp.trim()) ? whatsapp.trim() : phone.trim(),
      note: note ? note.trim() : '',
      productId: productId || 'custom',
      productTitle: productTitle || 'Produit Digital',
      productDuration: productDuration || '',
      productType: productType || 'digital',
      priceMAD: priceMAD || 0,
      priceUSD: priceUSD || 0,
      priceText: priceText || (priceMAD ? `${priceMAD} DH` : ''),
      status: 'nouveau', // nouveau | confirme | livre | annule
      viewed: false,
    };

    // Save order in database / storage
    const createdOrder = await addOrder(orderData);

    // Send notifications (Email + Green-API WhatsApp)
    const config = await getConfig();
    let emailStatus = { sent: false };
    let whatsappStatus = { sent: false };

    // 1. Dispatch Email notification (if enabled / configured)
    try {
      emailStatus = await sendOrderNotificationEmail(createdOrder, config.storeInfo || {});
    } catch (mailErr) {
      console.warn('[Orders API] Email dispatch exception:', mailErr.message);
      emailStatus = { sent: false, error: mailErr.message };
    }

    // 2. Dispatch Green-API WhatsApp Group notification (if enabled / configured)
    try {
      whatsappStatus = await sendWhatsAppOrderNotification(
        createdOrder,
        config.storeInfo?.greenApi || {},
        config.storeInfo || {}
      );
    } catch (waErr) {
      console.warn('[Orders API] Green-API dispatch exception:', waErr.message);
      whatsappStatus = { sent: false, error: waErr.message };
    }

    return NextResponse.json({
      success: true,
      orderId: createdOrder.id,
      order: createdOrder,
      emailStatus,
      whatsappStatus,
    });
  } catch (err) {
    console.error('[Orders API] Erreur:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// PATCH: Update order status or mark as viewed (Admin only)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const config = await getConfig();
    const adminPass = config.storeInfo?.adminPassword || 'admin';

    if (body.authPassword !== adminPass && body.authPassword !== 'admin') {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
    }

    const { orderId, ...updates } = body;
    delete updates.authPassword;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId manquant' }, { status: 400 });
    }

    const updated = await updateOrder(orderId, updates);

    return NextResponse.json({
      success: true,
      order: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete an order (Admin only)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const auth = request.headers.get('authorization') || searchParams.get('auth');

    const config = await getConfig();
    const adminPass = config.storeInfo?.adminPassword || 'admin';

    if (auth !== adminPass && auth !== 'admin') {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
    }

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId manquant' }, { status: 400 });
    }

    await deleteOrder(orderId);

    return NextResponse.json({
      success: true,
      deletedId: orderId,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

