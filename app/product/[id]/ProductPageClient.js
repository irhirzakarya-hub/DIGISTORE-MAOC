'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OrderForm from '@/app/components/OrderForm';
import { translations } from '@/lib/translations';
import * as fpixel from '@/lib/fpixel';

export default function ProductPageClient({ product, storeInfo, relatedProducts }) {
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('ar');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('store_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedLang = localStorage.getItem('store_lang') || 'ar';
    setLang(savedLang);
    document.documentElement.setAttribute('data-lang', savedLang);
    document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', savedLang);
  }, []);

  useEffect(() => {
    if (product) {
      fpixel.event('ViewContent', {
        content_name: product.title,
        content_category: product.category,
        content_ids: [product.id],
        content_type: 'product',
        value: product.priceMAD || 0,
        currency: 'MAD',
      });
    }
  }, [product]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('store_theme', newTheme);
  };

  const toggleLang = () => {
    const nextLang = lang === 'ar' ? 'fr' : 'ar';
    changeLang(nextLang);
  };

  const changeLang = (targetLang) => {
    setLang(targetLang);
    localStorage.setItem('store_lang', targetLang);
    document.documentElement.setAttribute('data-lang', targetLang);
    document.documentElement.setAttribute('dir', targetLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', targetLang);
  };

  const t = translations[lang] || translations.ar;
  const storeName = lang === 'ar' && storeInfo?.nameAr ? storeInfo.nameAr : (storeInfo?.name || 'DIGISTORE');
  const storeBadge = lang === 'ar' && storeInfo?.badgeTextAr ? storeInfo.badgeTextAr : (storeInfo?.badgeText || t.officialProduct);
  const storeAnnouncement = lang === 'ar' && storeInfo?.announcementAr ? storeInfo.announcementAr : storeInfo?.announcement;

  const prodTitle = lang === 'ar' && product.titleAr ? product.titleAr : product.title;
  const prodDesc = lang === 'ar' && product.descriptionAr ? product.descriptionAr : product.description;
  const prodDuration = lang === 'ar' && product.durationAr ? product.durationAr : (product.duration || 'Standard');
  const prodBadge = lang === 'ar' && product.badgeAr ? product.badgeAr : product.badge;

  const formatPrice = (priceMAD) => `${priceMAD || 0}\u00A0DH`;

  const scrollToForm = () => {
    const formEl = document.getElementById('formulaire-commande');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: prodTitle,
        text: `Découvrez ${prodTitle} sur ${storeName}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const hasImage = Boolean(product.imageUrl && product.imageUrl.trim());
  const waTarget = (storeInfo?.whatsapp || '+212661000000').replace(/[^0-9]/g, '');

  return (
    <div className="product-landing-root">
      {/* Top Announcement Bar */}
      {storeAnnouncement && (
        <div className="store-announcement-bar">
          <div className="store-container announcement-content">
            <span className="pulse-indicator"></span>
            <span>{storeAnnouncement}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="store-header">
        <div className="store-container header-inner">
          <Link href="/" className="back-nav-link" title={t.backToStore}>
            <i className="fa-solid fa-arrow-left"></i>
            <span>{t.backToStore}</span>
          </Link>

          <div className="brand-group">
            <Link href="/" className="store-brand">
              <span className="brand-icon-box">
                <i className="fa-solid fa-bolt"></i>
              </span>
              <div>
                <h1 className="brand-title">{storeName}</h1>
                <span className="brand-subtitle">{storeBadge}</span>
              </div>
            </Link>
          </div>

          {/* Header Actions (Language, Theme, Share) - Visible on all devices */}
          <div className="header-actions">
            {/* Language Switcher Dual Pill */}
            <div className="lang-switcher-pill" role="group" aria-label="Langue">
              <button
                type="button"
                className={`lang-pill-opt ${lang === 'ar' ? 'active' : ''}`}
                onClick={() => changeLang('ar')}
                title="العربية"
              >
                عربي
              </button>
              <button
                type="button"
                className={`lang-pill-opt ${lang === 'fr' ? 'active' : ''}`}
                onClick={() => changeLang('fr')}
                title="Français"
              >
                FR
              </button>
            </div>

            {/* Dark/Light toggle */}
            <button
              type="button"
              className="icon-action-btn"
              onClick={toggleTheme}
              title={lang === 'ar' ? t.themeDark : 'Changer de thème'}
              aria-label="Basculer le thème"
            >
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>

            {/* Share */}
            <button
              type="button"
              className="icon-action-btn share-btn-header"
              onClick={handleShare}
              title={t.share}
              aria-label={t.share}
            >
              <i className="fa-solid fa-share-nodes"></i>
            </button>
          </div>
        </div>
      </header>



      {/* Product Hero Showcase */}
      <main className="store-container single-product-main">
        {/* Mobile-Only Compact Hero Showcase (Small Image Left, Full Title & Price Right) */}
        <div className="mobile-product-hero-card">
          <div className="mobile-hero-top-row">
            {/* Small Product Thumbnail */}
            <div className="mobile-hero-thumb-box">
              {hasImage ? (
                <img
                  src={product.imageUrl}
                  alt={prodTitle}
                  className="mobile-hero-thumb-img"
                />
              ) : (
                <div className="mobile-hero-thumb-placeholder">
                  <i className="fa-solid fa-box-open"></i>
                </div>
              )}
              {prodBadge && (
                <span className="mobile-hero-badge">{prodBadge}</span>
              )}
            </div>

            {/* Product Meta, Full Title, and Price beside the image */}
            <div className="mobile-hero-meta-col">
              <div className="mobile-hero-tag-row">
                <span className="mobile-hero-cat">{product.category.toUpperCase()}</span>
                {prodDuration && (
                  <span className="mobile-hero-duration">
                    <i className="fa-regular fa-clock"></i> {prodDuration}
                  </span>
                )}
              </div>
              <h1 className="mobile-hero-title">{prodTitle}</h1>
              <div className="mobile-hero-price-row">
                <span className="mobile-hero-price-val">
                  {formatPrice(product.priceMAD)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Trust Bar */}
          <div className="mobile-hero-trust-bar">
            <span><i className="fa-solid fa-bolt text-accent"></i> {t.instantDelivery}</span>
            <span><i className="fa-solid fa-shield-check text-blue"></i> {t.activeGuarantee}</span>
            <span><i className="fa-solid fa-headset text-orange"></i> {t.support7j}</span>
          </div>
        </div>

        {/* Desktop-Only Hero Showcase */}
        <div className="single-product-hero-grid desktop-hero-grid">
          {/* Left Media Area */}
          <div className="single-product-media-card">
            <div className="single-product-img-wrapper">
              {hasImage ? (
                <img
                  src={product.imageUrl}
                  alt={prodTitle}
                  className="single-product-main-img"
                />
              ) : (
                <div className="single-product-placeholder">
                  <div className="placeholder-icon-large">
                    <i className="fa-solid fa-box-open"></i>
                  </div>
                  <span className="placeholder-text-large">
                    {product.type === 'physical' ? (lang === 'ar' ? 'بطاقة NFC متصلة' : 'Produit NFC Connecté') : (lang === 'ar' ? 'ترخيص رسمي أصلي' : 'Licence Numérique Officielle')}
                  </span>
                </div>
              )}

              {prodBadge && (
                <span className="single-badge-pill">{prodBadge}</span>
              )}
            </div>

            {/* Guarantee / Trust Points */}
            <div className="product-trust-bullets">
              <div className="trust-bullet">
                <i className="fa-solid fa-bolt text-accent"></i>
                <div>
                  <strong>{t.instantDelivery}</strong>
                  <span>{t.instantDeliverySub}</span>
                </div>
              </div>

              <div className="trust-bullet">
                <i className="fa-solid fa-shield-check text-blue"></i>
                <div>
                  <strong>{t.activeGuarantee}</strong>
                  <span>{t.activeGuaranteeSub}</span>
                </div>
              </div>

              <div className="trust-bullet">
                <i className="fa-solid fa-headset text-orange"></i>
                <div>
                  <strong>{t.support7j}</strong>
                  <span>{t.support7jSub}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Info & CTA Card */}
          <div className="single-product-info-card">
            <div className="info-top-meta">
              <span className="info-category-tag">
                <i className="fa-solid fa-shapes"></i> {product.category.toUpperCase()}
              </span>
              {prodDuration && (
                <span className="info-duration-tag">
                  <i className="fa-regular fa-clock"></i> {prodDuration}
                </span>
              )}
              <span className="info-stock-badge">
                <i className="fa-solid fa-check"></i> {t.inStockImmediate}
              </span>
            </div>

            <h1 className="single-product-title">{prodTitle}</h1>

            <div className="single-price-box">
              <div className="price-row-hero">
                <div>
                  <span className="hero-price-label">{t.specialPromoPrice}</span>
                  <div className="hero-price-value">
                    {formatPrice(product.priceMAD)}
                  </div>
                </div>
              </div>

              <div className="hero-discount-pill">
                <i className="fa-solid fa-tag"></i> {t.guaranteedSavings}
              </div>
            </div>

            {/* Call to action button */}
            <div className="single-cta-group">
              <button
                type="button"
                className="btn-primary-order-now"
                onClick={scrollToForm}
              >
                <i className="fa-solid fa-cart-shopping"></i>
                <span>{t.orderNowCta}</span>
              </button>
            </div>

            {/* Short highlight excerpt */}
            <div className="single-product-excerpt">
              <h3>{t.keyPoints}</h3>
              <p>{prodDesc}</p>
            </div>
          </div>
        </div>

        {/* Detailed Information Section */}
        <section className="single-product-details-section">
          <div className="details-card-block">
            <h2 className="section-block-title">
              <i className="fa-solid fa-circle-info"></i> {t.detailedInfoSpecs}
            </h2>
            <p className="detailed-desc-text">{prodDesc}</p>

            <div className="specs-table-grid single-page-specs">
              <div className="spec-cell">
                <span className="spec-k">{t.durationOffer}</span>
                <span className="spec-v">{prodDuration}</span>
              </div>

              <div className="spec-cell">
                <span className="spec-k">{t.statusAvailability}</span>
                <span className="spec-v highlight-blue">
                  {product.inStock ? `✅ ${t.inStockImmediate}` : t.outOfStock}
                </span>
              </div>

              <div className="spec-cell">
                <span className="spec-k">{t.clientSupport}</span>
                <span className="spec-v highlight-blue">{t.totalGuarantee}</span>
              </div>
            </div>

            {/* Volume Tiers (for physical / NFC products) */}
            {product.tiers && product.tiers.length > 0 && (
              <div className="tiers-block single-tiers">
                <h3>{t.volumeTiersTitle}</h3>
                <div className="tiers-grid">
                  {product.tiers.map((tItem, i) => (
                    <div key={i} className="tier-pill">
                      <span className="tier-k">{tItem.k}</span>
                      <span className="tier-v">{tItem.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Form Section (Displays after Specifications on both Mobile and Desktop) */}
          <div className="single-order-form-container" id="formulaire-commande">
            <OrderForm
              product={product}
              storeInfo={storeInfo}
              lang={lang}
            />
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="related-products-section">
            <h2 className="related-heading">{t.similarProducts}</h2>
            <div className="products-grid">
              {relatedProducts.map((rel) => {
                const relTitle = lang === 'ar' && rel.titleAr ? rel.titleAr : rel.title;
                const relDuration = lang === 'ar' && rel.durationAr ? rel.durationAr : rel.duration;

                return (
                  <Link
                    key={rel.id}
                    href={`/product/${rel.id}`}
                    className="product-card related-card"
                  >
                    <div className="product-media-wrapper">
                      {rel.imageUrl ? (
                        <img
                          src={rel.imageUrl}
                          alt={relTitle}
                          className="product-main-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="product-placeholder-box">
                          <i className="fa-solid fa-cube"></i>
                        </div>
                      )}
                      {relDuration && (
                        <span className="product-duration-badge">{relDuration}</span>
                      )}
                    </div>
                    <div className="product-body">
                      <h4 className="product-title">{relTitle}</h4>
                      <div className="price-lead-value" style={{ marginTop: '0.5rem' }}>
                        {formatPrice(rel.priceMAD)}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Sticky Mobile Bottom Order Bar */}
      <div className="sticky-mobile-order-bar">
        <div className="sticky-bar-content">
          <div>
            <span className="sticky-bar-label">{t.price}</span>
            <span className="sticky-bar-price">
              {formatPrice(product.priceMAD)}
            </span>
          </div>
          <button
            type="button"
            className="sticky-bar-btn"
            onClick={scrollToForm}
          >
            <i className="fa-solid fa-cart-shopping"></i> {t.order}
          </button>
        </div>
      </div>

      {/* Fixed WhatsApp Support Floating Button */}
      {storeInfo?.whatsapp && (
        <a
          href={`https://wa.me/${waTarget}?text=${encodeURIComponent(lang === 'ar' ? `السلام عليكم ! بخصوص المنتج "${prodTitle}" في متجركم، لدي استفسار.` : `Bonjour ! Je regarde le produit "${product.title}" sur votre boutique et j'ai une question.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed-whatsapp-floating-btn"
          title={t.whatsappDirect}
        >
          <span className="floating-wa-pulse"></span>
          <i className="fa-brands fa-whatsapp"></i>
          <span className="floating-wa-text">{t.whatsappDirect}</span>
        </a>
      )}

      {/* Toast Notification */}
      {copiedLink && (
        <div className="store-toast">
          <i className="fa-solid fa-check"></i> {t.linkCopied}
        </div>
      )}

      {/* Footer */}
      <footer className="store-footer">
        <div className="store-container footer-content">
          <div className="footer-top-grid">
            {/* Brand Column */}
            <div className="footer-brand-col">
              <div className="footer-brand-title-wrap">
                <span className="footer-brand-bolt">
                  <i className="fa-solid fa-bolt"></i>
                </span>
                <span className="footer-brand-name">{storeName}</span>
              </div>
              <p className="footer-tagline">
                {lang === 'ar' && storeInfo?.taglineAr ? storeInfo.taglineAr : (storeInfo?.tagline || 'Boutique Numérique & Produits Connectés au Meilleur Prix')}
              </p>
              <div className="footer-features-pills">
                <span className="footer-feat-pill">
                  <i className="fa-solid fa-circle-check text-green"></i> {t.official100}
                </span>
                <span className="footer-feat-pill">
                  <i className="fa-solid fa-bolt text-amber"></i> {t.instantDelivery}
                </span>
                <span className="footer-feat-pill">
                  <i className="fa-solid fa-shield-halved text-blue"></i> {t.guaranteedSupport}
                </span>
              </div>
            </div>

            {/* Support & Contact Column */}
            <div className="footer-contact-col">
              <h5 className="footer-col-heading">{t.customerService}</h5>
              <p className="footer-contact-subtext">{t.contactDirectText}</p>
              <div className="footer-action-pills">
                {storeInfo?.whatsapp && (
                  <a
                    href={`https://wa.me/${storeInfo.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-btn-wa"
                  >
                    <i className="fa-brands fa-whatsapp"></i>
                    <span>WhatsApp : {storeInfo.whatsapp}</span>
                  </a>
                )}
                {storeInfo?.email && (
                  <a href={`mailto:${storeInfo.email}`} className="footer-btn-email">
                    <i className="fa-solid fa-envelope"></i>
                    <span>{storeInfo.email}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>© {new Date().getFullYear()} {storeName}. {t.allRightsReserved}</span>
            <Link href="/" className="footer-back-link">
              <i className="fa-solid fa-arrow-left"></i> {t.viewAllProducts}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
