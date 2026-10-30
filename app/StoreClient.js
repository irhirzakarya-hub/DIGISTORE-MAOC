'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import OrderForm from '@/app/components/OrderForm';
import { translations } from '@/lib/translations';

export default function StoreClient({ initialData }) {
  const [data, setData] = useState(initialData);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('ar');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync theme & language on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('store_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedLang = localStorage.getItem('store_lang') || 'ar';
    setLang(savedLang);
    document.documentElement.setAttribute('data-lang', savedLang);
    document.documentElement.setAttribute('dir', savedLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', savedLang);

    // Live background sync
    async function syncData() {
      try {
        const res = await fetch(`/api/data?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store' },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
          }
        }
      } catch (err) {
        // keep initialData
      }
    }

    syncData();
    const handleFocus = () => syncData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

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
  const storeInfo = data?.storeInfo || {};
  const categories = data?.categories || [];
  const products = data?.products || [];

  const storeName = lang === 'ar' && storeInfo.nameAr ? storeInfo.nameAr : (storeInfo.name || 'DIGISTORE');
  const storeTagline = lang === 'ar' && storeInfo.taglineAr ? storeInfo.taglineAr : (storeInfo.tagline || 'Boutique Numérique & Produits Connectés');
  const storeBio = lang === 'ar' && storeInfo.bioAr ? storeInfo.bioAr : (storeInfo.bio || 'Accédez aux meilleurs abonnements numériques au meilleur prix.');
  const storeAnnouncement = lang === 'ar' && storeInfo.announcementAr ? storeInfo.announcementAr : storeInfo.announcement;
  const storeBadge = lang === 'ar' && storeInfo.badgeTextAr ? storeInfo.badgeTextAr : (storeInfo.badgeText || 'Produit Officiel');

  // Price formatter helper (Always MAD / DH)
  const formatPrice = (priceMAD) => `${priceMAD || 0}\u00A0DH`;

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Exclude deactivated products from customer view
      if (p.isActive === false || p.status === 'inactive') return false;

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const title = (p.title || '').toLowerCase();
      const titleAr = (p.titleAr || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const descAr = (p.descriptionAr || '').toLowerCase();
      const matchesSearch =
        !query ||
        title.includes(query) ||
        titleAr.includes(query) ||
        desc.includes(query) ||
        descAr.includes(query);
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return (a.priceMAD || 0) - (b.priceMAD || 0);
      if (sortBy === 'price-desc') return (b.priceMAD || 0) - (a.priceMAD || 0);
      if (sortBy === 'title') {
        const titleA = lang === 'ar' && a.titleAr ? a.titleAr : a.title;
        const titleB = lang === 'ar' && b.titleAr ? b.titleAr : b.title;
        return titleA.localeCompare(titleB);
      }
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, selectedCategory, searchQuery, sortBy, lang]);

  // Generate WhatsApp order message link
  const getWhatsAppLink = (product) => {
    const phone = storeInfo.whatsapp ? storeInfo.whatsapp.replace(/[^0-9]/g, '') : '212661000000';
    const prodTitle = lang === 'ar' && product.titleAr ? product.titleAr : product.title;
    const text = encodeURIComponent(
      `السلام عليكم ! أرغب في طلب المنتج التالي من متجر ${storeName} :\n\n` +
      `📦 المنتج : ${prodTitle}\n` +
      `⏳ المدة : ${lang === 'ar' && product.durationAr ? product.durationAr : (product.duration || 'Standard')}\n` +
      `💰 السعر : ${formatPrice(product.priceMAD)}\n\n` +
      `يرجى تزويدي بطريقة الدفع والتسليم.`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  // Get icon for product category
  const getCategoryIcon = (catId) => {
    switch (catId) {
      case 'ai': return 'fa-solid fa-brain';
      case 'streaming': return 'fa-solid fa-play';
      case 'creative': return 'fa-solid fa-palette';
      case 'productivity': return 'fa-solid fa-briefcase';
      case 'vpn': return 'fa-solid fa-shield-halved';
      case 'accounts': return 'fa-solid fa-users';
      case 'hardware': return 'fa-solid fa-wifi';
      default: return 'fa-solid fa-cube';
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: storeName,
        text: storeTagline,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="store-page-root">
      {/* Top Announcement Bar */}
      {storeAnnouncement && (
        <div className="store-announcement-bar">
          <div className="store-container announcement-content">
            <span className="pulse-indicator"></span>
            <span>{storeAnnouncement}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="store-header">
        <div className="store-container header-inner">
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

          {/* Top Header Actions (Language, Theme, Share) - Visible on all devices */}
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

            {/* Dark / Light Toggle */}
            <button
              type="button"
              className="icon-action-btn"
              onClick={toggleTheme}
              aria-label="Basculer le thème"
              title={lang === 'ar' ? t.themeDark : 'Mode Sombre / Clair'}
            >
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>

            {/* Share button */}
            <button
              type="button"
              className="icon-action-btn share-btn-header"
              onClick={handleShare}
              aria-label={t.share}
              title={t.share}
            >
              <i className="fa-solid fa-share-nodes"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="store-hero-section">
        <div className="store-container hero-inner">
          <div className="hero-text-content">
            <span className="hero-pill-badge">
              <i className="fa-solid fa-circle-check"></i> {t.statsVerified}
            </span>
            <h2 className="hero-heading">{storeTagline}</h2>
            <p className="hero-subtext">{storeBio}</p>

            <div className="hero-stats-row">
              <div className="stat-card">
                <span className="stat-number">
                  {products.filter((p) => p.isActive !== false && p.status !== 'inactive').length}
                </span>
                <span className="stat-label">{lang === 'ar' ? 'منتج وأداة ذكية' : 'Produits & Outils'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{t.statsSavings}</span>
                <span className="stat-label">{t.statsRealSavings}</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{t.statsInstant}</span>
                <span className="stat-label">{t.statsFastDelivery}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="controls-section">
        <div className="store-container">
          <div className="search-and-sort-bar">
            <div className="search-box-wrapper">
              <i className="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="store-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>

            <div className="sort-dropdown-wrapper">
              <span className="sort-label">{t.sortBy}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="store-sort-select"
              >
                <option value="featured">{t.sortFeatured}</option>
                <option value="price-asc">{t.sortPriceAsc}</option>
                <option value="price-desc">{t.sortPriceDesc}</option>
                <option value="title">{t.sortName}</option>
              </select>
            </div>
          </div>

          {/* Categories Tab Navigation */}
          <div className="categories-scroll-wrapper">
            <div className="categories-pill-container" role="tablist">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const count = cat.id === 'all'
                  ? products.filter((p) => p.isActive !== false && p.status !== 'inactive').length
                  : products.filter((p) => p.category === cat.id && p.isActive !== false && p.status !== 'inactive').length;
                const catLabel = lang === 'ar' && cat.labelAr ? cat.labelAr : cat.label;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`category-pill ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <i className={cat.icon || getCategoryIcon(cat.id)}></i>
                    <span>{catLabel}</span>
                    <span className="category-count-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <main className="store-container products-section">
        {filteredProducts.length === 0 ? (
          <div className="empty-state-box">
            <div className="empty-icon-circle">
              <i className="fa-solid fa-box-open"></i>
            </div>
            <h3>{t.noProductsFound}</h3>
            <button
              type="button"
              className="reset-filters-btn"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
            >
              {t.resetSearch}
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => {
              const hasImage = Boolean(product.imageUrl && product.imageUrl.trim());
              const catIcon = getCategoryIcon(product.category);
              const prodTitle = lang === 'ar' && product.titleAr ? product.titleAr : product.title;
              const prodShortTitle = lang === 'ar' && product.shortTitleAr ? product.shortTitleAr : (product.shortTitle || prodTitle);
              const prodDesc = lang === 'ar' && product.descriptionAr ? product.descriptionAr : product.description;
              const prodBadge = lang === 'ar' && product.badgeAr ? product.badgeAr : product.badge;
              const prodDuration = lang === 'ar' && product.durationAr ? product.durationAr : product.duration;

              return (
                <div key={product.id} className="product-card">
                  {/* Card Media Header */}
                  <Link href={`/product/${product.id}`} className="product-media-wrapper" title={prodTitle}>
                    {hasImage ? (
                      <img
                        src={product.imageUrl}
                        alt={prodTitle}
                        className="product-main-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="product-placeholder-box">
                        <div className="placeholder-icon-ring">
                          <i className={catIcon}></i>
                        </div>
                        <span className="placeholder-badge">
                          {product.type === 'physical' ? (lang === 'ar' ? 'بطاقة NFC' : 'NFC Hardware') : (lang === 'ar' ? 'رقمي أصلي' : 'Produit Digital')}
                        </span>
                      </div>
                    )}

                    {prodBadge && (
                      <span className="product-status-tag">
                        {prodBadge}
                      </span>
                    )}

                    {prodDuration && (
                      <span className="product-duration-badge">
                        <i className="fa-regular fa-clock"></i> {prodDuration}
                      </span>
                    )}
                  </Link>

                  {/* Card Body */}
                  <div className="product-body">
                    <div className="product-header-info">
                      <span className="product-cat-name">
                        <i className={catIcon}></i> {prodShortTitle}
                      </span>
                      <h3 className="product-title" title={prodTitle}>
                        <Link href={`/product/${product.id}`}>
                          {prodTitle}
                        </Link>
                      </h3>
                    </div>

                    <p className="product-description-excerpt">
                      {prodDesc}
                    </p>

                    {/* Pricing Module */}
                    <div className="pricing-comparison-box">
                      <div className="price-main-row">
                        <div>
                          <span className="price-lead-label">{t.ourPrice}</span>
                          <span className="price-lead-value">
                            {formatPrice(product.priceMAD)}
                          </span>
                        </div>
                        {product.officialPrice && (
                          <div className="official-price-box">
                            <span className="official-label">{t.officialTariff}</span>
                            <span className="official-value">{product.officialPrice}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions: Single Commander Button leading to product page */}
                    <div className="card-actions-row single-action">
                      <Link
                        href={`/product/${product.id}`}
                        className="btn-card-commander"
                        title={prodTitle}
                      >
                        <i className="fa-solid fa-cart-shopping"></i>
                        <span>{t.order}</span>
                        <i className="fa-solid fa-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSelectedProduct(null)}
              aria-label={t.close}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="modal-body-content">
              {/* Left Column: Media & Price Summary */}
              <div className="modal-left-col">
                <div className="modal-image-wrapper">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={lang === 'ar' && selectedProduct.titleAr ? selectedProduct.titleAr : selectedProduct.title}
                      className="modal-product-img"
                    />
                  ) : (
                    <div className="modal-image-placeholder">
                      <i className="fa-solid fa-box-open"></i>
                    </div>
                  )}
                </div>

                <div className="modal-price-highlight">
                  <span className="modal-price-lbl">{t.proposedPrice}</span>
                  <span className="modal-price-num">
                    {formatPrice(selectedProduct.priceMAD)}
                  </span>
                  {selectedProduct.duration && (
                    <span className="modal-price-sub">
                      {lang === 'ar' && selectedProduct.durationAr ? selectedProduct.durationAr : selectedProduct.duration}
                    </span>
                  )}
                </div>

                <a
                  href={getWhatsAppLink(selectedProduct)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-cta-whatsapp"
                >
                  <i className="fa-brands fa-whatsapp"></i> {t.orderImmediately}
                </a>
              </div>

              {/* Right Column: Title, Description, Specs & Direct Order Form */}
              <div className="modal-right-col">
                <span className="modal-badge-tag">
                  {lang === 'ar' && selectedProduct.badgeAr ? selectedProduct.badgeAr : (selectedProduct.badge || t.officialProduct)}
                </span>
                <h2 className="modal-title">
                  {lang === 'ar' && selectedProduct.titleAr ? selectedProduct.titleAr : selectedProduct.title}
                </h2>
                <p className="modal-desc">
                  {lang === 'ar' && selectedProduct.descriptionAr ? selectedProduct.descriptionAr : selectedProduct.description}
                </p>

                {/* Specs Table */}
                <div className="modal-specs-table">
                  <div className="spec-cell">
                    <span className="spec-k">{t.durationOffer}</span>
                    <span className="spec-v">
                      {lang === 'ar' && selectedProduct.durationAr ? selectedProduct.durationAr : (selectedProduct.duration || 'Standard')}
                    </span>
                  </div>

                  {selectedProduct.officialPrice && (
                    <div className="spec-cell">
                      <span className="spec-k">{t.officialPriceNoted}</span>
                      <span className="spec-v highlight-green">{selectedProduct.officialPrice}</span>
                    </div>
                  )}

                  <div className="spec-cell">
                    <span className="spec-k">{t.statusAvailability}</span>
                    <span className="spec-v highlight-blue">
                      {selectedProduct.inStock ? t.inStockImmediate : t.outOfStock}
                    </span>
                  </div>

                  <div className="spec-cell">
                    <span className="spec-k">{t.clientSupport}</span>
                    <span className="spec-v highlight-blue">{t.totalGuarantee}</span>
                  </div>
                </div>

                {/* Tiers if physical / wholesale */}
                {selectedProduct.tiers && selectedProduct.tiers.length > 0 && (
                  <div className="tiers-block">
                    <h4>{t.volumeTiersTitle}</h4>
                    <div className="tiers-grid">
                      {selectedProduct.tiers.map((tItem, i) => (
                        <div key={i} className="tier-pill">
                          <span className="tier-k">{tItem.k}</span>
                          <span className="tier-v">{tItem.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed WhatsApp Support Floating Button */}
      {storeInfo.whatsapp && (
        <a
          href={`https://wa.me/${storeInfo.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(lang === 'ar' ? 'السلام عليكم ! لدي استفسار بخصوص منتجات المتجر.' : 'Bonjour ! J’ai une question concernant les produits de votre boutique en ligne.')}`}
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
              <p className="footer-tagline">{storeTagline}</p>
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
                {storeInfo.whatsapp && (
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
                {storeInfo.email && (
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
          </div>
        </div>
      </footer>
    </div>
  );
}
