'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { translations } from '@/lib/translations';
import * as fpixel from '@/lib/fpixel';

export default function OrderForm({ product, storeInfo, lang = 'ar' }) {
  const router = useRouter();
  const t = translations[lang] || translations.ar;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Auto-sync whatsapp if sameAsPhone is true
  const handlePhoneChange = (val) => {
    setPhone(val);
    if (sameAsPhone) {
      setWhatsapp(val);
    }
  };

  const handleToggleSame = () => {
    const nextState = !sameAsPhone;
    setSameAsPhone(nextState);
    if (nextState) {
      setWhatsapp(phone);
    }
  };

  const formatPrice = (priceMAD) => `${priceMAD || 0}\u00A0DH`;

  const prodTitle = lang === 'ar' && product.titleAr ? product.titleAr : product.title;
  const prodDuration = lang === 'ar' && product.durationAr ? product.durationAr : (product.duration || 'Standard');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert(lang === 'ar' ? 'يرجى إدخال اسمك الكامل ورقم الهاتف.' : 'Veuillez remplir votre nom et votre numéro de téléphone.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const finalWhatsapp = sameAsPhone ? phone : (whatsapp.trim() || phone);
    const priceFormatted = formatPrice(product.priceMAD);

    // Track checkout initiation in Meta Pixel
    fpixel.event('InitiateCheckout', {
      content_name: prodTitle,
      content_ids: [product.id],
      content_type: 'product',
      value: product.priceMAD || 0,
      currency: 'MAD',
    });

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          whatsapp: finalWhatsapp.trim(),
          note: note ? note.trim() : '',
          productId: product.id,
          productTitle: prodTitle,
          productDuration: prodDuration,
          productType: product.type || 'digital',
          priceMAD: product.priceMAD,
          priceUSD: product.purchasePriceUSD,
          priceText: priceFormatted,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const orderId = data.orderId || data.order?.id || `CMD-${Date.now().toString(36).toUpperCase()}`;

        // Redirect directly to the dedicated confirmation page
        const query = new URLSearchParams({
          id: orderId,
          product: prodTitle,
          name: fullName.trim(),
          phone: phone.trim(),
          whatsapp: finalWhatsapp.trim(),
          price: priceFormatted,
          duration: prodDuration,
          lang: lang,
        });

        router.push(`/order-confirmation?${query.toString()}`);
      } else {
        setSubmitError(data.error || (lang === 'ar' ? 'حدث خطأ أثناء تأكيد الطلب. يرجى المحاولة ثانية.' : 'Erreur lors de la validation. Veuillez réessayer.'));
        setIsSubmitting(false);
      }
    } catch (err) {
      setSubmitError(`${lang === 'ar' ? 'خطأ في الاتصال' : 'Erreur réseau'}: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="order-form-card" id="formulaire-commande">
      <div className="order-form-header">
        <span className="form-tag-badge">
          <i className="fa-solid fa-bolt"></i> {t.fastOrder}
        </span>
        <h3 className="form-title">{t.fillFormBelow}</h3>
        <p className="form-subtitle">{t.paymentNote}</p>
      </div>

      <form onSubmit={handleSubmit} className="order-form-body">
        {submitError && (
          <div className="order-form-error-msg">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{submitError}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="order-form-group">
          <label htmlFor="order-fullname">
            <i className="fa-solid fa-user"></i> {t.fullName}
          </label>
          <input
            id="order-fullname"
            type="text"
            required
            disabled={isSubmitting}
            placeholder={t.fullNamePlaceholder}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="order-form-input"
          />
        </div>

        {/* Phone Number */}
        <div className="order-form-group">
          <label htmlFor="order-phone">
            <i className="fa-solid fa-phone"></i> {t.phoneNumber}
          </label>
          <input
            id="order-phone"
            type="tel"
            required
            disabled={isSubmitting}
            placeholder={t.phonePlaceholder}
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="order-form-input"
          />
        </div>

        {/* WhatsApp Same As Phone Toggle */}
        <div className="order-same-toggle-row">
          <label className="same-checkbox-label">
            <input
              type="checkbox"
              checked={sameAsPhone}
              disabled={isSubmitting}
              onChange={handleToggleSame}
              className="same-checkbox-input"
            />
            <span className="same-checkbox-custom">
              {sameAsPhone && <i className="fa-solid fa-check"></i>}
            </span>
            <span className="same-checkbox-text">
              {t.sameAsPhone}
            </span>
          </label>
        </div>

        {/* WhatsApp Number (Only shown / enabled if different) */}
        {!sameAsPhone && (
          <div className="order-form-group whatsapp-different-field">
            <label htmlFor="order-whatsapp">
              <i className="fa-brands fa-whatsapp"></i> {t.whatsappNumber}
            </label>
            <input
              id="order-whatsapp"
              type="tel"
              required
              disabled={isSubmitting}
              placeholder="06..."
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="order-form-input"
            />
          </div>
        )}

        {/* Optional Note */}
        <div className="order-form-group">
          <label htmlFor="order-note">
            <i className="fa-solid fa-comment-dots"></i> {t.orderNotes}
          </label>
          <input
            id="order-note"
            type="text"
            disabled={isSubmitting}
            placeholder={t.orderNotesPlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="order-form-input"
          />
        </div>

        {/* Price Summary Banner */}
        <div className="order-summary-strip">
          <div className="strip-left">
            <span className="strip-prod">{prodTitle}</span>
            <span className="strip-duration">
              <i className="fa-regular fa-clock"></i> {prodDuration}
            </span>
          </div>
          <div className="strip-right">
            <span className="strip-total-label">{t.total}</span>
            <span className="strip-total-val">
              {formatPrice(product.priceMAD)}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-submit-order-direct"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              <span>{t.submitting}</span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-cart-shopping"></i>
              <span>{t.confirmOrderBtn}</span>
              <i className="fa-solid fa-arrow-right"></i>
            </>
          )}
        </button>

        <div className="order-security-notice">
          <i className="fa-solid fa-shield-check"></i>
          <span>
            {lang === 'ar'
              ? 'بياناتك الشخصية سرية ومحمية 100% • الرد والتفعيل في أقل من 10 دقائق'
              : 'Vos coordonnées sont 100% sécurisées • Réponse garantie sous 10 minutes'}
          </span>
        </div>
      </form>
    </div>
  );
}
