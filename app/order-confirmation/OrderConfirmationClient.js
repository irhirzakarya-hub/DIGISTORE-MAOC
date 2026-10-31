'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';
import * as fpixel from '@/lib/fpixel';

export default function OrderConfirmationClient({ storeInfo }) {
  const searchParams = useSearchParams();

  const lang = searchParams.get('lang') || 'ar';
  const orderId = searchParams.get('id') || searchParams.get('orderId') || 'CMD-NOUVEAU';
  const productName = searchParams.get('product') || 'Produit Numérique';
  const customerName = searchParams.get('name') || (lang === 'ar' ? 'عميلنا العزيز' : 'Cher client');
  const phone = searchParams.get('phone') || '';
  const whatsapp = searchParams.get('whatsapp') || phone;
  const price = searchParams.get('price') || '';
  const duration = searchParams.get('duration') || '';

  const isAr = lang === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang, isAr]);

  useEffect(() => {
    const numericPrice = parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0;
    fpixel.event('Purchase', {
      content_name: productName,
      value: numericPrice,
      currency: 'MAD',
      order_id: orderId,
    });
  }, [orderId, productName, price]);

  const cleanStoreWa = (storeInfo?.whatsapp || '+212661000000').replace(/[^0-9]/g, '');
  const urgentWaText = encodeURIComponent(
    isAr
      ? `السلام عليكم ! قمت للتو بتأكيد الطلب #${orderId} للمنتج "${productName}". الاسم: ${customerName}. أرجو تأكيد التسليم وشكراً.`
      : `Bonjour ! Je viens de passer la commande #${orderId} pour "${productName}". Mon nom est ${customerName}. Pourriez-vous me confirmer la livraison ?`
  );

  const storeName = isAr && storeInfo?.nameAr ? storeInfo.nameAr : (storeInfo?.name || 'DIGISTORE');

  return (
    <div className="order-confirmation-root">
      {/* Header bar */}
      <header className="store-header">
        <div className="store-container header-inner" style={{ justifyContent: 'center' }}>
          <Link href="/" className="store-brand">
            <span className="brand-icon-box">
              <i className="fa-solid fa-bolt"></i>
            </span>
            <div>
              <h1 className="brand-title">{storeName}</h1>
              <span className="brand-subtitle">{isAr ? 'تأكيد استلام الطلب' : 'Confirmation de Commande'}</span>
            </div>
          </Link>
        </div>
      </header>

      <main className="store-container confirmation-main">
        <div className="confirmation-card">
          {/* Success Check Ring */}
          <div className="confirmation-icon-ring">
            <i className="fa-solid fa-check"></i>
          </div>

          <span className="confirmation-badge">
            <i className="fa-solid fa-shield-check"></i> {isAr ? 'تم تسجيل طلبك بنجاح' : 'Commande Enregistrée'}
          </span>

          <h2 className="confirmation-title">
            {isAr
              ? `شكراً لك ${customerName} ! تم استلام طلبك بنجاح`
              : `Merci ${customerName} ! Votre commande a été reçue avec succès`}
          </h2>

          <div className="confirmation-reassurance-box">
            <i className="fa-solid fa-phone-volume text-accent"></i>
            <div>
              <strong>{isAr ? 'فريقنا سيتواصل معك فوراً !' : 'Notre équipe va vous contacter sous peu !'}</strong>
              <p>
                {isAr ? (
                  <>
                    سيقوم ممثل خدمة العملاء بالاتصال بك أو إرسال رسالة واتساب على رقمك{' '}
                    <span className="highlight-number">{whatsapp || phone}</span> خلال دقائق قليلة لتسليمك وتفعيل منتجك.
                  </>
                ) : (
                  <>
                    Un conseiller va vous appeler ou vous envoyer un message WhatsApp sur votre numéro{' '}
                    <span className="highlight-number">{whatsapp || phone}</span> dans quelques instants pour vous livrer et activer votre produit.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="confirmation-details-box">
            <div className="conf-row header-row">
              <span className="conf-label">{isAr ? 'رقم الطلب' : 'Numéro de Commande'}</span>
              <span className="conf-value order-id-highlight">#{orderId}</span>
            </div>

            <div className="conf-divider"></div>

            <div className="conf-row">
              <span className="conf-label">{isAr ? 'المنتج المطلوب' : 'Produit commandé'}</span>
              <span className="conf-value font-bold">{productName}</span>
            </div>

            {duration && (
              <div className="conf-row">
                <span className="conf-label">{isAr ? 'المدة / الصلاحية' : 'Durée / Validité'}</span>
                <span className="conf-value">{duration}</span>
              </div>
            )}

            {price && (
              <div className="conf-row">
                <span className="conf-label">{isAr ? 'المبلغ المطلوب للدفع' : 'Montant à régler'}</span>
                <span className="conf-value price-highlight">{price}</span>
              </div>
            )}

            <div className="conf-row">
              <span className="conf-label">{isAr ? 'رقم الهاتف' : 'Téléphone d\'appel'}</span>
              <span className="conf-value">{phone}</span>
            </div>

            <div className="conf-row">
              <span className="conf-label">{isAr ? 'رقم الواتساب للتسليم' : 'Numéro WhatsApp'}</span>
              <span className="conf-value">{whatsapp}</span>
            </div>
          </div>

          {/* Direct WhatsApp acceleration button */}
          <div className="confirmation-actions-group conf-actions">
            <a
              href={`https://wa.me/${cleanStoreWa}?text=${urgentWaText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-urgent-whatsapp btn-conf-whatsapp"
            >
              <i className="fa-brands fa-whatsapp"></i>
              <span>{isAr ? 'تأكيد فوري عبر الواتساب (أسرع)' : 'Accélérer sur WhatsApp (Optionnel)'}</span>
            </a>

            <Link href="/" className="btn-return-home btn-conf-back">
              <i className="fa-solid fa-arrow-left"></i>
              <span>{isAr ? 'العودة للمتجر وتصفح باقي المنتجات' : 'Retourner à l\'accueil du magasin'}</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
