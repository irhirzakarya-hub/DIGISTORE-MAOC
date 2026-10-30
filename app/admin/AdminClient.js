'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { defaultData } from '@/lib/defaultData';

const POPULAR_CATEGORY_ICONS = [
  { icon: 'fa-solid fa-brain', label: 'IA' },
  { icon: 'fa-solid fa-play', label: 'Streaming' },
  { icon: 'fa-solid fa-palette', label: 'Design' },
  { icon: 'fa-solid fa-briefcase', label: 'Bureautique' },
  { icon: 'fa-solid fa-shield-halved', label: 'VPN & Sécurité' },
  { icon: 'fa-solid fa-users', label: 'Comptes' },
  { icon: 'fa-solid fa-wifi', label: 'NFC' },
  { icon: 'fa-solid fa-gamepad', label: 'Gaming' },
  { icon: 'fa-solid fa-music', label: 'Musique' },
  { icon: 'fa-solid fa-laptop-code', label: 'Code & Dev' },
  { icon: 'fa-solid fa-graduation-cap', label: 'Éducation' },
  { icon: 'fa-solid fa-bolt', label: 'Express' },
  { icon: 'fa-solid fa-cart-shopping', label: 'Boutique' },
  { icon: 'fa-solid fa-key', label: 'Licences' },
  { icon: 'fa-solid fa-mobile-screen', label: 'Mobile' },
  { icon: 'fa-solid fa-film', label: 'Cinéma' },
  { icon: 'fa-solid fa-cloud', label: 'Cloud' },
  { icon: 'fa-solid fa-gem', label: 'VIP' },
];

export default function AdminClient() {
  const [data, setData] = useState(defaultData);
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isBlobActive, setIsBlobActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'settings' | 'deploy'

  // Orders state
  const [orderFilterStatus, setOrderFilterStatus] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [fetchingGroups, setFetchingGroups] = useState(false);
  const [whatsappGroups, setWhatsappGroups] = useState([]);

  // Product filtering & edit state
  const [productSearch, setProductSearch] = useState('');
  const [productFilterCat, setProductFilterCat] = useState('all');
  const [productFilterStatus, setProductFilterStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [uploadingForId, setUploadingForId] = useState(null);

  // Category management state
  const [editingCategory, setEditingCategory] = useState(null);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);

  const fileInputRef = useRef(null);
  const activeUploadProductIdRef = useRef(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  // Load configuration on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('store_admin_auth');
    if (savedAuth) {
      setAuthPassword(savedAuth);
      setIsAuthenticated(true);
    }

    async function fetchData() {
      try {
        const res = await fetch('/api/data', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
            setIsBlobActive(Boolean(json.isBlobConfigured));
          }
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
      }
    }

    fetchData();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const targetPassword = data.storeInfo?.adminPassword || 'admin';
    if (loginInput === targetPassword || loginInput === 'admin') {
      setIsAuthenticated(true);
      setAuthPassword(loginInput);
      sessionStorage.setItem('store_admin_auth', loginInput);
      setLoginError('');
      triggerToast('Connexion réussie ! Bienvenue.');
    } else {
      setLoginError('Mot de passe incorrect. (Par défaut: admin)');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('store_admin_auth');
    setIsAuthenticated(false);
    setLoginInput('');
  };

  // Save all data to Vercel Blob / local
  const handleSaveData = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          authPassword,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsBlobActive(Boolean(json.isBlobConfigured));
        triggerToast(
          json.result?.source === 'vercel-blob'
            ? '✅ Enregistré avec succès dans Vercel Blob !'
            : '✅ Enregistré avec succès (Stockage local / data/store-data.json)'
        );
      } else {
        triggerToast(`❌ Erreur: ${json.error || 'Échec de la sauvegarde'}`);
      }
    } catch (err) {
      triggerToast(`❌ Erreur réseau: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Update order status or mark as viewed
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          viewed: true,
          authPassword,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setData((prev) => ({
          ...prev,
          orders: (prev.orders || []).map((o) => (o.id === orderId ? json.order : o)),
        }));
        triggerToast(`Statut de la commande #${orderId} mis à jour : ${newStatus}`);
      } else {
        triggerToast(`❌ Erreur: ${json.error || 'Impossible de mettre à jour'}`);
      }
    } catch (err) {
      triggerToast(`❌ Erreur réseau: ${err.message}`);
    }
  };

  // Delete an order
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement la commande #${orderId} ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/orders?id=${orderId}&auth=${encodeURIComponent(authPassword)}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setData((prev) => ({
          ...prev,
          orders: (prev.orders || []).filter((o) => o.id !== orderId),
        }));
        triggerToast(`Commande #${orderId} supprimée.`);
      } else {
        triggerToast(`❌ Erreur: ${json.error || 'Impossible de supprimer'}`);
      }
    } catch (err) {
      triggerToast(`❌ Erreur réseau: ${err.message}`);
    }
  };

  // Test SMTP / Gmail Email Sending
  const handleTestEmail = async () => {
    const userEmail = data.storeInfo?.gmailUser || data.storeInfo?.smtpUser || data.storeInfo?.email;
    const userPass = data.storeInfo?.gmailAppPassword || data.storeInfo?.smtpPass;
    const recipient = data.storeInfo?.notificationEmail || userEmail;

    if (!userEmail || !userPass) {
      alert('Veuillez renseigner votre email Gmail et votre mot de passe d’application (16 caractères) avant de tester.');
      return;
    }

    setTestingEmail(true);
    triggerToast(`Envoi d'un email de test vers ${recipient}...`);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-email',
          authPassword,
          smtpHost: data.storeInfo?.smtpHost || 'smtp.gmail.com',
          smtpPort: data.storeInfo?.smtpPort || '587',
          smtpUser: userEmail,
          smtpPass: userPass,
          smtpSecure: data.storeInfo?.smtpSecure,
          recipient,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        triggerToast('✅ Email de test envoyé avec succès ! Vérifiez votre boîte de réception Gmail.');
      } else {
        triggerToast(`❌ Échec de l'envoi email : ${json.error || 'Vérifiez votre mot de passe d’application'}`);
      }
    } catch (err) {
      triggerToast(`❌ Erreur réseau: ${err.message}`);
    } finally {
      setTestingEmail(false);
    }
  };

  // Test Green-API WhatsApp Group Sending
  const handleTestWhatsApp = async () => {
    const greenApi = data.storeInfo?.greenApi || {};
    const idInstance = greenApi.idInstance || '710722785894';
    const apiTokenInstance = greenApi.apiTokenInstance || '67bfe5f4eb344f108e09fb48f55e1f41390adb019b3240fcbf';
    const apiUrl = greenApi.apiUrl || 'https://7107.api.greenapi.com';
    const chatId = greenApi.chatId || '120363429062857929@g.us';

    if (!idInstance || !apiTokenInstance || !chatId) {
      alert('Veuillez renseigner l’idInstance, le Token et l’identifiant du groupe WhatsApp.');
      return;
    }

    setTestingWhatsApp(true);
    triggerToast('Envoi du message de test dans le groupe WhatsApp...');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test-whatsapp',
          authPassword,
          apiUrl,
          idInstance,
          apiTokenInstance,
          chatId,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        triggerToast('✅ Message envoyé avec succès dans votre groupe WhatsApp ! Vérifiez WhatsApp.');
      } else {
        triggerToast(`❌ Échec Green-API: ${json.error || 'Vérifiez vos paramètres'}`);
      }
    } catch (err) {
      triggerToast(`❌ Erreur réseau: ${err.message}`);
    } finally {
      setTestingWhatsApp(false);
    }
  };

  // Fetch user's WhatsApp groups from Green-API
  const handleFetchWhatsAppGroups = async () => {
    const greenApi = data.storeInfo?.greenApi || {};
    const idInstance = greenApi.idInstance || '710722785894';
    const apiTokenInstance = greenApi.apiTokenInstance || '67bfe5f4eb344f108e09fb48f55e1f41390adb019b3240fcbf';
    const apiUrl = greenApi.apiUrl || 'https://7107.api.greenapi.com';

    setFetchingGroups(true);
    triggerToast('Récupération de vos groupes WhatsApp depuis Green-API...');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch-groups',
          authPassword,
          apiUrl,
          idInstance,
          apiTokenInstance,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.groups)) {
        setWhatsappGroups(json.groups);
        triggerToast(`✅ ${json.groups.length} groupes trouvés sur votre compte WhatsApp !`);
      } else {
        triggerToast(`❌ Erreur: ${json.error || 'Impossible de lister les groupes'}`);
      }
    } catch (err) {
      triggerToast(`❌ Erreur réseau: ${err.message}`);
    } finally {
      setFetchingGroups(false);
    }
  };

  // Product Image Upload directly to Vercel Blob
  const triggerImageUpload = (productId) => {
    activeUploadProductIdRef.current = productId;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    const targetId = activeUploadProductIdRef.current;
    if (!file || !targetId) return;

    setUploadingForId(targetId);
    triggerToast(`Téléversement de l'image (${file.name})...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // Update product imageUrl in state
        setData((prev) => ({
          ...prev,
          products: prev.products.map((p) =>
            p.id === targetId ? { ...p, imageUrl: json.url } : p
          ),
        }));

        if (editingProduct && editingProduct.id === targetId) {
          setEditingProduct((prev) => ({ ...prev, imageUrl: json.url }));
        }

        setIsBlobActive(Boolean(json.isBlobConfigured));
        triggerToast(
          json.source === 'vercel-blob'
            ? '✅ Image enregistrée sur Vercel Blob avec succès !'
            : '✅ Image enregistrée en local (/uploads) avec succès !'
        );
      } else {
        triggerToast(`❌ Erreur d'upload: ${json.error || 'Impossible d\'envoyer le fichier'}`);
      }
    } catch (err) {
      triggerToast(`❌ Erreur de téléversement: ${err.message}`);
    } finally {
      setUploadingForId(null);
      activeUploadProductIdRef.current = null;
    }
  };

  // Product CRUD
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (isAddingNew) {
      // Add new
      const newProd = {
        ...editingProduct,
        id: editingProduct.id || `prod-${Date.now()}`,
      };
      setData((prev) => ({
        ...prev,
        products: [newProd, ...prev.products],
      }));
      triggerToast('Produit ajouté à la liste ! N\'oubliez pas de cliquer sur "Enregistrer les modifications".');
    } else {
      // Update existing
      setData((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === editingProduct.id ? editingProduct : p
        ),
      }));
      triggerToast('Détails du produit modifiés !');
    }

    setEditingProduct(null);
    setIsAddingNew(false);
  };

  const handleDeleteProduct = (productId, title) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le produit "${title}" ?`)) {
      setData((prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== productId),
      }));
      triggerToast('Produit supprimé ! N\'oubliez pas d\'enregistrer.');
    }
  };

  const handleToggleStock = (productId) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId ? { ...p, inStock: !p.inStock } : p
      ),
    }));
  };

  // Toggle Product Visibility / Active State without deleting
  const handleToggleActive = (productId) => {
    let nextStatus = false;
    setData((prev) => {
      const updatedProds = prev.products.map((p) => {
        if (p.id === productId) {
          nextStatus = p.isActive === false ? true : false;
          return { ...p, isActive: nextStatus };
        }
        return p;
      });
      return { ...prev, products: updatedProds };
    });
    triggerToast(
      nextStatus
        ? '✅ Produit activé (ظاهر الآن في المتجر للزبناء) !'
        : '⚪ Produit désactivé (مخفي من المتجر دون حذفه) !'
    );
  };

  const handleAddNewProductClick = () => {
    setIsAddingNew(true);
    setEditingProduct({
      id: `prod-${Date.now()}`,
      title: '',
      titleAr: '',
      shortTitle: '',
      category: (data.categories || []).find((c) => c.id !== 'all')?.id || 'ai',
      type: 'digital',
      badge: 'Nouveau',
      badgeAr: 'جديد',
      purchasePriceUSD: 1.0,
      priceMAD: 49,
      officialPrice: '',
      duration: '1 mois',
      durationAr: 'شهر واحد',
      description: '',
      descriptionAr: '',
      marginNote: '',
      imageUrl: '',
      inStock: true,
      featured: false,
      isActive: true,
    });
  };

  // Filter products for admin table
  const filteredAdminProducts = (data.products || []).filter((p) => {
    const matchesCat = productFilterCat === 'all' || p.category === productFilterCat;
    const matchesStatus =
      productFilterStatus === 'all' ||
      (productFilterStatus === 'active' && p.isActive !== false) ||
      (productFilterStatus === 'inactive' && p.isActive === false);
    const query = productSearch.toLowerCase();
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      (p.titleAr && p.titleAr.toLowerCase().includes(query)) ||
      p.shortTitle?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query);
    return matchesCat && matchesStatus && matchesSearch;
  });

  // Category CRUD Handlers
  const handleAddNewCategoryClick = () => {
    setIsAddingNewCat(true);
    setEditingCategory({
      id: '',
      label: '',
      labelAr: '',
      icon: 'fa-solid fa-shapes',
    });
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!editingCategory) return;

    let catId = (editingCategory.id || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9_-]/g, '');

    if (!catId) {
      catId = (editingCategory.label || 'cat')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '') || `cat-${Date.now()}`;
    }

    if (catId === 'all') {
      alert('L\'identifiant "all" est réservé pour le système.');
      return;
    }

    const cleanCategory = {
      id: catId,
      label: editingCategory.label.trim() || editingCategory.labelAr.trim() || 'Nouvelle Catégorie',
      labelAr: editingCategory.labelAr.trim() || editingCategory.label.trim() || 'قسم جديد',
      icon: editingCategory.icon.trim() || 'fa-solid fa-shapes',
    };

    const currentCats = Array.isArray(data.categories) ? data.categories : [];

    if (isAddingNewCat) {
      if (currentCats.some((c) => c.id === catId)) {
        alert(`Une catégorie avec l'identifiant "${catId}" existe déjà. Veuillez choisir un autre identifiant.`);
        return;
      }
      setData((prev) => ({
        ...prev,
        categories: [...(prev.categories || []), cleanCategory],
      }));
      triggerToast(`Catégorie "${cleanCategory.label}" créée avec succès ! N'oubliez pas d'enregistrer.`);
    } else {
      setData((prev) => ({
        ...prev,
        categories: (prev.categories || []).map((c) =>
          c.id === editingCategory.id ? cleanCategory : c
        ),
      }));
      triggerToast(`Catégorie "${cleanCategory.label}" mise à jour avec succès !`);
    }

    setEditingCategory(null);
    setIsAddingNewCat(false);
  };

  const handleDeleteCategory = (catId, catLabel) => {
    if (catId === 'all') {
      alert('La catégorie "Tous les produits" est une catégorie système essentielle et ne peut pas être supprimée.');
      return;
    }

    const productsInCat = (data.products || []).filter((p) => p.category === catId);
    const confirmMsg =
      productsInCat.length > 0
        ? `Attention: ${productsInCat.length} produit(s) sont classés dans "${catLabel}".\nSi vous supprimez cette catégorie, ces produits seront réassignés à la catégorie par défaut.\n\nVoulez-vous vraiment supprimer "${catLabel}" ?`
        : `Êtes-vous sûr de vouloir supprimer la catégorie "${catLabel}" ?`;

    if (confirm(confirmMsg)) {
      const remainingCats = (data.categories || []).filter((c) => c.id !== catId && c.id !== 'all');
      const fallbackCatId = remainingCats.length > 0 ? remainingCats[0].id : 'ai';

      setData((prev) => ({
        ...prev,
        categories: (prev.categories || []).filter((c) => c.id !== catId),
        products: (prev.products || []).map((p) =>
          p.category === catId ? { ...p, category: fallbackCatId } : p
        ),
      }));
      triggerToast(`Catégorie "${catLabel}" supprimée ! N'oubliez pas d'enregistrer les modifications.`);
    }
  };

  // Orders statistics & filtering
  const orders = Array.isArray(data.orders) ? data.orders : [];
  const newOrdersCount = orders.filter((o) => o.status === 'nouveau' || !o.viewed).length;
  const confirmedOrdersCount = orders.filter((o) => o.status === 'confirme' || o.status === 'livre').length;
  const totalRevenueMAD = orders
    .filter((o) => o.status !== 'annule')
    .reduce((sum, o) => sum + (Number(o.priceMAD) || 0), 0);

  const filteredOrders = orders.filter((ord) => {
    const matchesStatus = orderFilterStatus === 'all' || ord.status === orderFilterStatus;
    const query = orderSearch.toLowerCase();
    const matchesSearch =
      !query ||
      ord.id?.toLowerCase().includes(query) ||
      ord.fullName?.toLowerCase().includes(query) ||
      ord.phone?.includes(query) ||
      ord.whatsapp?.includes(query) ||
      ord.productTitle?.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="admin-login-wrapper">
        <div className="admin-login-card">
          <div className="login-header">
            <div className="login-icon-circle">
              <i className="fa-solid fa-lock"></i>
            </div>
            <h2>Administration du Store</h2>
            <p>Connectez-vous pour gérer les produits, ajouter des images et configurer la boutique.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="adminPass">Mot de passe administrateur</label>
              <input
                id="adminPass"
                type="password"
                placeholder="Mot de passe (défaut : admin)"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                autoFocus
                className="admin-text-input"
              />
            </div>

            {loginError && <div className="login-error-msg">{loginError}</div>}

            <button type="submit" className="admin-primary-btn full-width">
              <i className="fa-solid fa-right-to-bracket"></i> Se connecter
            </button>
          </form>

          <div className="login-footer">
            <Link href="/" className="back-to-store-link">
              <i className="fa-solid fa-arrow-left"></i> Retour à la boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Hidden global file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        style={{ display: 'none' }}
      />

      {/* Admin Top Navigation */}
      <header className="admin-navbar">
        <div className="admin-nav-container">
          <div className="admin-brand">
            <Link href="/" className="admin-store-link" title="Voir la vitrine">
              <i className="fa-solid fa-store"></i>
              <span>{data.storeInfo?.name || 'DIGISTORE'}</span>
            </Link>
            <span className="admin-badge">Admin Dashboard</span>
          </div>

          <div className="admin-nav-right">
            {/* Blob Storage Status Badge */}
            <div
              className={`blob-status-badge ${isBlobActive ? 'active' : 'local'}`}
              title={
                isBlobActive
                  ? 'Vercel Blob est configuré et actif en production.'
                  : 'Mode stockage local. Pour la production Vercel, ajoutez le store Blob dans votre dashboard Vercel.'
              }
            >
              <span className="status-dot"></span>
              <span>{isBlobActive ? 'Vercel Blob Actif' : 'Stockage Local'}</span>
            </div>

            {/* Save Button */}
            <button
              type="button"
              className="admin-save-top-btn"
              onClick={handleSaveData}
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i> Sauvegarde...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up"></i> Enregistrer
                </>
              )}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              className="admin-logout-btn"
              onClick={handleLogout}
              title="Se déconnecter"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Container */}
      <div className="admin-container">
        {/* Navigation Tabs */}
        <div className="admin-tab-nav">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <i className="fa-solid fa-bell"></i>
            <span>Commandes</span>
            {newOrdersCount > 0 ? (
              <span className="admin-badge-count-red">{newOrdersCount} NOUVEAU</span>
            ) : (
              <span className="admin-badge-count-gray">({orders.length})</span>
            )}
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <i className="fa-solid fa-cubes"></i> Produits ({data.products?.length || 0})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <i className="fa-solid fa-shapes"></i> Catégories ({(data.categories || []).filter((c) => c.id !== 'all').length})
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fa-solid fa-gear"></i> Paramètres & Emails
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'deploy' ? 'active' : ''}`}
            onClick={() => setActiveTab('deploy')}
          >
            <i className="fa-solid fa-cloud"></i> Déploiement Vercel
          </button>
        </div>

        {/* Tab 0: Orders Management */}
        {activeTab === 'orders' && (
          <section className="admin-section orders-section">
            <div className="section-header-row">
              <div>
                <h2>
                  <i className="fa-solid fa-receipt text-primary"></i> Gestion des Commandes Clients
                </h2>
                <p>
                  Suivez toutes les commandes passées depuis la boutique. Contactez chaque client en un clic sur WhatsApp ou par appel téléphonique.
                </p>
              </div>

              <div className="section-actions-group">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/orders', { cache: 'no-store' });
                      const json = await res.json();
                      if (json.success) {
                        setData((prev) => ({ ...prev, orders: json.orders }));
                        triggerToast('Liste des commandes actualisée.');
                      }
                    } catch (e) {
                      triggerToast('Erreur actualisation: ' + e.message);
                    }
                  }}
                >
                  <i className="fa-solid fa-rotate"></i> Actualiser les commandes
                </button>
              </div>
            </div>

            {/* Statistics Row */}
            <div className="orders-stats-row">
              <div className="order-stat-card">
                <div className="stat-icon-box blue">
                  <i className="fa-solid fa-cart-shopping"></i>
                </div>
                <div className="stat-info-box">
                  <h4>Total Commandes</h4>
                  <div className="stat-val">{orders.length}</div>
                </div>
              </div>

              <div className="order-stat-card">
                <div className="stat-icon-box amber">
                  <i className="fa-solid fa-bell"></i>
                </div>
                <div className="stat-info-box">
                  <h4>À Traiter (Nouvelles)</h4>
                  <div className="stat-val">{newOrdersCount}</div>
                </div>
              </div>

              <div className="order-stat-card">
                <div className="stat-icon-box green">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <div className="stat-info-box">
                  <h4>Confirmées / Livrées</h4>
                  <div className="stat-val">{confirmedOrdersCount}</div>
                </div>
              </div>

              <div className="order-stat-card">
                <div className="stat-icon-box green">
                  <i className="fa-solid fa-coins"></i>
                </div>
                <div className="stat-info-box">
                  <h4>Chiffre d'Affaires</h4>
                  <div className="stat-val">{totalRevenueMAD.toLocaleString()} DH</div>
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="orders-filter-bar">
              <div className="status-filter-pills">
                <button
                  type="button"
                  className={`status-pill-btn ${orderFilterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setOrderFilterStatus('all')}
                >
                  Toutes ({orders.length})
                </button>
                <button
                  type="button"
                  className={`status-pill-btn ${orderFilterStatus === 'nouveau' ? 'active' : ''}`}
                  onClick={() => setOrderFilterStatus('nouveau')}
                >
                  Nouvelles ({orders.filter((o) => o.status === 'nouveau').length})
                </button>
                <button
                  type="button"
                  className={`status-pill-btn ${orderFilterStatus === 'confirme' ? 'active' : ''}`}
                  onClick={() => setOrderFilterStatus('confirme')}
                >
                  Confirmées ({orders.filter((o) => o.status === 'confirme').length})
                </button>
                <button
                  type="button"
                  className={`status-pill-btn ${orderFilterStatus === 'livre' ? 'active' : ''}`}
                  onClick={() => setOrderFilterStatus('livre')}
                >
                  Livrées ({orders.filter((o) => o.status === 'livre').length})
                </button>
                <button
                  type="button"
                  className={`status-pill-btn ${orderFilterStatus === 'annule' ? 'active' : ''}`}
                  onClick={() => setOrderFilterStatus('annule')}
                >
                  Annulées ({orders.filter((o) => o.status === 'annule').length})
                </button>
              </div>

              <div className="search-filter-box">
                <input
                  type="text"
                  placeholder="Rechercher par client, téléphone ou #ID..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div className="orders-empty-state">
                <i className="fa-solid fa-inbox"></i>
                <h3>Aucune commande trouvée</h3>
                <p>
                  {orders.length === 0
                    ? 'Aucun client n’a encore passé de commande. Dès qu’une commande est effectuée sur la boutique, elle apparaîtra ici en temps réel et vous recevrez un email.'
                    : 'Aucune commande ne correspond à votre filtre de recherche.'}
                </p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>Commande</th>
                      <th>Client</th>
                      <th>Produit & Montant</th>
                      <th>Note Client</th>
                      <th>Statut</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => {
                      const cleanWa = (ord.whatsapp || ord.phone || '').replace(/[^0-9]/g, '');
                      const waChatText = encodeURIComponent(
                        `Bonjour ${ord.fullName} ! Nous vous contactons suite à votre commande #${ord.id} pour "${ord.productTitle}". Êtes-vous disponible pour finaliser la livraison ?`
                      );

                      return (
                        <tr
                          key={ord.id}
                          className={ord.status === 'nouveau' ? 'order-row-new' : ''}
                        >
                          {/* Order ID & Date */}
                          <td>
                            <div className="order-id-badge">#{ord.id}</div>
                            <span className="order-date-text">
                              {ord.createdAt
                                ? new Date(ord.createdAt).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Récemment'}
                            </span>
                            {ord.status === 'nouveau' && (
                              <span className="admin-badge-count-red" style={{ marginTop: '4px', display: 'inline-block' }}>
                                NOUVEAU
                              </span>
                            )}
                          </td>

                          {/* Customer */}
                          <td>
                            <div className="order-client-name">{ord.fullName}</div>
                            <a href={`tel:${ord.phone}`} className="order-phone-link">
                              <i className="fa-solid fa-phone"></i> {ord.phone}
                            </a>
                            {ord.whatsapp && ord.whatsapp !== ord.phone && (
                              <span className="order-phone-link" style={{ color: '#16A34A' }}>
                                <i className="fa-brands fa-whatsapp"></i> {ord.whatsapp}
                              </span>
                            )}
                          </td>

                          {/* Product & Price */}
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                              {ord.productTitle}
                            </div>
                            {ord.productDuration && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <i className="fa-regular fa-clock"></i> {ord.productDuration}
                              </div>
                            )}
                            <div style={{ fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
                              {ord.priceText || (ord.priceMAD ? `${ord.priceMAD} DH` : '')}
                            </div>
                          </td>

                          {/* Note */}
                          <td style={{ maxWidth: '200px' }}>
                            {ord.note ? (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontStyle: 'italic' }}>
                                « {ord.note} »
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td>
                            <select
                              value={ord.status || 'nouveau'}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className="order-status-select"
                            >
                              <option value="nouveau">🔴 Nouveau</option>
                              <option value="confirme">🔵 Confirmé</option>
                              <option value="livre">🟢 Livré</option>
                              <option value="annule">⚪ Annulé</option>
                            </select>
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div className="order-actions-flex" style={{ justifyContent: 'flex-end' }}>
                              {cleanWa && (
                                <a
                                  href={`https://wa.me/${cleanWa}?text=${waChatText}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-order-wa"
                                  title="Contacter sur WhatsApp"
                                >
                                  <i className="fa-brands fa-whatsapp"></i>
                                  <span>WhatsApp</span>
                                </a>
                              )}

                              <a
                                href={`tel:${ord.phone}`}
                                className="btn-order-call"
                                title="Appeler directement"
                              >
                                <i className="fa-solid fa-phone"></i>
                              </a>

                              <button
                                type="button"
                                className="btn-order-del"
                                onClick={() => handleDeleteOrder(ord.id)}
                                title="Supprimer la commande"
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Tab 1: Products Management */}
        {activeTab === 'products' && (
          <section className="admin-section">
            <div className="section-header-row">
              <div>
                <h2>Catalogue de Produits</h2>
                <p>Gérez vos produits, téléversez leurs images vers Vercel Blob et ajustez les prix.</p>
              </div>

              <div className="section-actions-group">
                <button
                  type="button"
                  className="admin-primary-btn"
                  onClick={handleAddNewProductClick}
                >
                  <i className="fa-solid fa-plus"></i> Ajouter un Produit
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="admin-filter-bar">
              <div className="admin-search-wrap">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  placeholder="Rechercher par nom ou catégorie..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>

              <div className="admin-cat-filter">
                <select
                  value={productFilterCat}
                  onChange={(e) => setProductFilterCat(e.target.value)}
                  className="admin-select-input"
                >
                  <option value="all">Toutes les catégories</option>
                  {(data.categories || []).filter((c) => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} {c.labelAr ? `(${c.labelAr})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-status-filter">
                <select
                  value={productFilterStatus}
                  onChange={(e) => setProductFilterStatus(e.target.value)}
                  className="admin-select-input"
                >
                  <option value="all">Tous les états (الكل)</option>
                  <option value="active">🟢 Actifs seulement (ظاهر في المتجر)</option>
                  <option value="inactive">⚪ Désactivés (معطل ومخفي)</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="admin-table-wrapper">
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Photo</th>
                    <th>Nom du Produit</th>
                    <th>Catégorie</th>
                    <th>Durée</th>
                    <th>Prix Vente (DH)</th>
                    <th>Visibilité Store</th>
                    <th>Disponibilité</th>
                    <th style={{ width: '160px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminProducts.map((p) => {
                    const isUploading = uploadingForId === p.id;
                    const hasImage = Boolean(p.imageUrl && p.imageUrl.trim());
                    const isDeactivated = p.isActive === false;

                    return (
                      <tr key={p.id} className={isDeactivated ? 'product-row-deactivated' : ''}>
                        <td>
                          <div className="table-thumb-container">
                            {hasImage ? (
                              <img
                                src={p.imageUrl}
                                alt={p.title}
                                className="table-thumb-img"
                              />
                            ) : (
                              <div className="table-thumb-placeholder">
                                <i className="fa-solid fa-image"></i>
                              </div>
                            )}

                            <button
                              type="button"
                              className="thumb-upload-overlay-btn"
                              title="Téléverser / Changer la photo (Vercel Blob)"
                              onClick={() => triggerImageUpload(p.id)}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fa-solid fa-camera"></i>
                              )}
                            </button>
                          </div>
                        </td>

                        <td>
                          <div className="table-prod-name-box">
                            <span className="table-prod-title">{p.title}</span>
                            {p.titleAr && <span className="table-prod-title-ar">{p.titleAr}</span>}
                            <div className="table-badges-flex">
                              {isDeactivated && (
                                <span
                                  className="table-badge badge-deactivated"
                                  title="Ce produit est masqué du magasin sans être supprimé"
                                >
                                  <i className="fa-solid fa-eye-slash"></i> Désactivé (مخفي)
                                </span>
                              )}
                              {p.badge && <span className="table-badge">{p.badge}</span>}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="table-category-pill">{p.category}</span>
                        </td>

                        <td>
                          <span className="table-duration-pill">{p.duration || '–'}</span>
                        </td>

                        <td>
                          <strong className="table-price-mad">{p.priceMAD || 0} DH</strong>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={`visibility-toggle-btn ${!isDeactivated ? 'vis-active' : 'vis-inactive'}`}
                            onClick={() => handleToggleActive(p.id)}
                            title={
                              !isDeactivated
                                ? 'Cliquer pour DÉSACTIVER (masquer du store sans supprimer)'
                                : 'Cliquer pour ACTIVER (afficher dans le store)'
                            }
                          >
                            <i className={`fa-solid ${!isDeactivated ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                            <span>{!isDeactivated ? 'Actif' : 'Désactivé'}</span>
                          </button>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={`stock-toggle-btn ${p.inStock ? 'instock' : 'outstock'}`}
                            onClick={() => handleToggleStock(p.id)}
                            title="Cliquer pour changer le stock"
                          >
                            {p.inStock ? 'En Stock' : 'Épuisé'}
                          </button>
                        </td>

                        <td>
                          <div className="table-actions-cell">
                            <button
                              type="button"
                              className="table-action-icon edit"
                              onClick={() => {
                                setIsAddingNew(false);
                                setEditingProduct({ ...p });
                              }}
                              title="Modifier les détails"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>

                            <button
                              type="button"
                              className="table-action-icon upload"
                              onClick={() => triggerImageUpload(p.id)}
                              title="Téléverser la photo"
                            >
                              <i className="fa-solid fa-upload"></i>
                            </button>

                            <button
                              type="button"
                              className="table-action-icon delete"
                              onClick={() => handleDeleteProduct(p.id, p.title)}
                              title="Supprimer le produit"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 1.5: Categories Management */}
        {activeTab === 'categories' && (
          <section className="admin-section categories-section">
            <div className="section-header-row">
              <div>
                <h2>Gestion des Catégories (إدارة الأقسام والتصنيفات)</h2>
                <p>
                  Créez de nouvelles catégories, modifiez leurs noms et icônes, ou supprimez les catégories inutilisées.
                  Les catégories ajoutées apparaissent immédiatement dans les onglets de la boutique.
                </p>
              </div>

              <div className="section-actions-group">
                <button
                  type="button"
                  className="admin-primary-btn"
                  onClick={handleAddNewCategoryClick}
                >
                  <i className="fa-solid fa-plus"></i> Nouvelle Catégorie
                </button>
              </div>
            </div>

            {/* Categories Table */}
            <div className="admin-table-wrapper">
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Icône</th>
                    <th>Nom (Français)</th>
                    <th>الاسم (العربية)</th>
                    <th>Identifiant (Slug / ID)</th>
                    <th>Produits associés</th>
                    <th style={{ width: '160px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.categories || []).map((cat) => {
                    const isSystemAll = cat.id === 'all';
                    const prodCount = isSystemAll
                      ? (data.products || []).length
                      : (data.products || []).filter((p) => p.category === cat.id).length;

                    return (
                      <tr key={cat.id}>
                        <td>
                          <div className="cat-table-icon-box">
                            <i className={cat.icon || 'fa-solid fa-shapes'}></i>
                          </div>
                        </td>

                        <td>
                          <strong className="cat-table-label">{cat.label}</strong>
                          {isSystemAll && (
                            <span className="cat-system-badge">Filtre Global Système</span>
                          )}
                        </td>

                        <td>
                          <span className="cat-table-label-ar" dir="rtl">
                            {cat.labelAr || '–'}
                          </span>
                        </td>

                        <td>
                          <code className="cat-table-slug">{cat.id}</code>
                        </td>

                        <td>
                          <span className="table-duration-pill">
                            {prodCount} produit{prodCount > 1 ? 's' : ''}
                          </span>
                        </td>

                        <td>
                          <div className="table-actions-cell">
                            <button
                              type="button"
                              className="table-action-icon edit"
                              onClick={() => {
                                setIsAddingNewCat(false);
                                setEditingCategory({ ...cat });
                              }}
                              title="Modifier cette catégorie"
                            >
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>

                            {!isSystemAll && (
                              <button
                                type="button"
                                className="table-action-icon delete"
                                onClick={() => handleDeleteCategory(cat.id, cat.label)}
                                title="Supprimer cette catégorie"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 2: Store Settings */}
        {activeTab === 'settings' && (
          <section className="admin-section settings-section">
            <h2>Paramètres Généraux de la Boutique</h2>
            <p>Ces informations s'affichent sur la vitrine et déterminent les canaux de contact client.</p>

            <div className="admin-form-grid">
              <div className="form-group">
                <label>Nom de la Boutique (Français)</label>
                <input
                  type="text"
                  value={data.storeInfo?.name || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, name: e.target.value },
                    }))
                  }
                  className="admin-text-input"
                />
              </div>

              <div className="form-group">
                <label>Nom en Arabe (اسم المتجر بالعربية)</label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="مثال: ديجي ستور • المتجر الرقمي"
                  value={data.storeInfo?.nameAr || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, nameAr: e.target.value },
                    }))
                  }
                  className="admin-text-input"
                />
              </div>

              <div className="form-group">
                <label>Slogan / Titre Principal (Français)</label>
                <input
                  type="text"
                  value={data.storeInfo?.tagline || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, tagline: e.target.value },
                    }))
                  }
                  className="admin-text-input"
                />
              </div>

              <div className="form-group">
                <label>Slogan en Arabe (الشعار الرئيسي بالعربية)</label>
                <input
                  type="text"
                  dir="rtl"
                  placeholder="مثال: اشتراكات بريميوم وأدوات الذكاء الاصطناعي بأفضل الأسعار"
                  value={data.storeInfo?.taglineAr || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, taglineAr: e.target.value },
                    }))
                  }
                  className="admin-text-input"
                />
              </div>

              <div className="form-group">
                <label>Message d'annonce en haut (Français)</label>
                <input
                  type="text"
                  value={data.storeInfo?.announcement || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, announcement: e.target.value },
                    }))
                  }
                  placeholder="Ex : ⚡ Livraison instantanée • Garantie 100% • Support WhatsApp 7j/7"
                  className="admin-text-input"
                />
              </div>

              <div className="form-group">
                <label>Message d'annonce en Arabe (شريط الإعلان بالعربية)</label>
                <input
                  type="text"
                  dir="rtl"
                  value={data.storeInfo?.announcementAr || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, announcementAr: e.target.value },
                    }))
                  }
                  placeholder="مثال: ⚡ تسليم فوري على الواتساب • ضمان 100% شغال • دعم فني 7/7"
                  className="admin-text-input"
                />
              </div>

              <div className="form-group full-width">
                <label>Description de la Boutique (Français)</label>
                <textarea
                  rows={2}
                  value={data.storeInfo?.bio || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, bio: e.target.value },
                    }))
                  }
                  className="admin-textarea"
                />
              </div>

              <div className="form-group full-width">
                <label>Description en Arabe (نبذة عن المتجر بالعربية)</label>
                <textarea
                  rows={2}
                  dir="rtl"
                  value={data.storeInfo?.bioAr || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, bioAr: e.target.value },
                    }))
                  }
                  className="admin-textarea"
                />
              </div>

              <div className="form-group">
                <label>Numéro WhatsApp de Commande</label>
                <input
                  type="text"
                  placeholder="+212661000000"
                  value={data.storeInfo?.whatsapp || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, whatsapp: e.target.value },
                    }))
                  }
                  className="admin-text-input"
                />
                <small className="help-text">Les boutons "Commander" ouvrent WhatsApp vers ce numéro avec le message pré-rempli.</small>
              </div>

              <div className="form-group">
                <label>Email de Contact</label>
                <input
                  type="email"
                  value={data.storeInfo?.email || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, email: e.target.value },
                    }))
                  }
                  className="admin-text-input"
                />
              </div>

              <div className="form-group">
                <label>Telegram (Pseudo)</label>
                <input
                  type="text"
                  placeholder="@mon_compte"
                  value={data.storeInfo?.telegram || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, telegram: e.target.value },
                    }))
                  }
                  className="admin-text-input"
                />
              </div>

              <div className="form-group">
                <label>Nouveau mot de passe Administrateur</label>
                <input
                  type="text"
                  value={data.storeInfo?.adminPassword || ''}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      storeInfo: { ...prev.storeInfo, adminPassword: e.target.value },
                    }))
                  }
                  className="admin-text-input"
                />
              </div>
            </div>

            {/* 1. Gmail Notifications Configuration */}
            <div className="email-smtp-card">
              <div className="email-smtp-header">
                <i className="fa-solid fa-envelope-open-text" style={{ color: '#EA4335' }}></i>
                <div>
                  <h3>1. Notifications par Email (Gmail)</h3>
                  <p>
                    Recevez instantanément un email sur votre boîte de réception Gmail à chaque nouvelle commande.
                  </p>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group full-width">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={data.storeInfo?.gmailEnabled !== false}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          storeInfo: { ...prev.storeInfo, gmailEnabled: e.target.checked },
                        }))
                      }
                      style={{ width: '18px', height: '18px', accentColor: '#EA4335' }}
                    />
                    <strong style={{ fontSize: '0.95rem' }}>Activer les alertes par Email (Gmail)</strong>
                  </label>
                </div>

                <div className="form-group">
                  <label>Votre adresse Gmail *</label>
                  <input
                    type="email"
                    placeholder="ex : votre-compte@gmail.com"
                    value={data.storeInfo?.gmailUser || data.storeInfo?.smtpUser || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        storeInfo: {
                          ...prev.storeInfo,
                          gmailUser: e.target.value,
                          smtpUser: e.target.value,
                        },
                      }))
                    }
                    className="admin-text-input"
                  />
                  <small className="help-text">L'adresse Gmail qui enverra et recevra les notifications.</small>
                </div>

                <div className="form-group">
                  <label>Mot de passe d'application Google (App Password 16 lettres) *</label>
                  <input
                    type="password"
                    placeholder="ex : abcd efgh ijkl mnop"
                    value={data.storeInfo?.gmailAppPassword || data.storeInfo?.smtpPass || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        storeInfo: {
                          ...prev.storeInfo,
                          gmailAppPassword: e.target.value,
                          smtpPass: e.target.value,
                        },
                      }))
                    }
                    className="admin-text-input"
                  />
                  <small className="help-text">
                    Générez-le en 30s sur{' '}
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)', fontWeight: 600 }}
                    >
                      myaccount.google.com/apppasswords <i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                  </small>
                </div>

                <div className="form-group full-width">
                  <label>Email de réception (Destinataire)</label>
                  <input
                    type="email"
                    placeholder="Laissez vide pour recevoir sur le même Gmail ci-dessus"
                    value={data.storeInfo?.notificationEmail || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        storeInfo: { ...prev.storeInfo, notificationEmail: e.target.value },
                      }))
                    }
                    className="admin-text-input"
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="test-email-btn"
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                >
                  {testingEmail ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Test Gmail en cours...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i> Tester l'envoi d'email Gmail
                    </>
                  )}
                </button>
                <small className="help-text">
                  Cliquez pour recevoir un email de test immédiat dans votre boîte Gmail.
                </small>
              </div>
            </div>

            {/* 2. Green-API WhatsApp Group Notifications Configuration */}
            <div className="email-smtp-card" style={{ borderColor: '#25D366' }}>
              <div className="email-smtp-header">
                <i className="fa-brands fa-whatsapp" style={{ color: '#25D366', fontSize: '1.6rem' }}></i>
                <div>
                  <h3>2. Notifications Automatiques Groupe WhatsApp (Green-API)</h3>
                  <p>
                    Envoyez automatiquement tous les détails de chaque nouvelle commande dans votre groupe WhatsApp (ex: <strong>news orders</strong>).
                  </p>
                </div>
              </div>

              <div className="admin-form-grid">
                <div className="form-group full-width">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={data.storeInfo?.greenApi?.enabled !== false}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          storeInfo: {
                            ...prev.storeInfo,
                            greenApi: { ...(prev.storeInfo?.greenApi || {}), enabled: e.target.checked },
                          },
                        }))
                      }
                      style={{ width: '18px', height: '18px', accentColor: '#25D366' }}
                    />
                    <strong style={{ fontSize: '0.95rem' }}>Activer les alertes automatiques dans le Groupe WhatsApp</strong>
                  </label>
                </div>

                <div className="form-group">
                  <label>Identifiant Instance (idInstance) *</label>
                  <input
                    type="text"
                    placeholder="710722785894"
                    value={data.storeInfo?.greenApi?.idInstance || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        storeInfo: {
                          ...prev.storeInfo,
                          greenApi: { ...(prev.storeInfo?.greenApi || {}), idInstance: e.target.value },
                        },
                      }))
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>Jeton d'accès (apiTokenInstance) *</label>
                  <input
                    type="text"
                    placeholder="67bfe5f4eb344f108e09fb48f55e1f41390adb019b3240fcbf"
                    value={data.storeInfo?.greenApi?.apiTokenInstance || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        storeInfo: {
                          ...prev.storeInfo,
                          greenApi: { ...(prev.storeInfo?.greenApi || {}), apiTokenInstance: e.target.value },
                        },
                      }))
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>URL de base Green-API (apiUrl)</label>
                  <input
                    type="text"
                    placeholder="https://7107.api.greenapi.com"
                    value={data.storeInfo?.greenApi?.apiUrl || 'https://7107.api.greenapi.com'}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        storeInfo: {
                          ...prev.storeInfo,
                          greenApi: { ...(prev.storeInfo?.greenApi || {}), apiUrl: e.target.value },
                        },
                      }))
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>Identifiant du Groupe WhatsApp (Chat ID) *</label>
                  <input
                    type="text"
                    placeholder="120363429062857929@g.us"
                    value={data.storeInfo?.greenApi?.chatId || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        storeInfo: {
                          ...prev.storeInfo,
                          greenApi: { ...(prev.storeInfo?.greenApi || {}), chatId: e.target.value },
                        },
                      }))
                    }
                    className="admin-text-input"
                  />
                  <small className="help-text">
                    ID du groupe (ex: <code>120363429062857929@g.us</code> pour le groupe "news orders").
                  </small>
                </div>

                {/* WhatsApp Groups Detector Button */}
                <div className="form-group full-width">
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="admin-secondary-btn"
                      onClick={handleFetchWhatsAppGroups}
                      disabled={fetchingGroups}
                    >
                      {fetchingGroups ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin"></i> Détection des groupes...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-layer-group"></i> Détecter mes groupes WhatsApp
                        </>
                      )}
                    </button>

                    {whatsappGroups.length > 0 && (
                      <select
                        className="admin-select-input"
                        style={{ maxWidth: '300px' }}
                        onChange={(e) => {
                          if (e.target.value) {
                            setData((prev) => ({
                              ...prev,
                              storeInfo: {
                                ...prev.storeInfo,
                                greenApi: {
                                  ...(prev.storeInfo?.greenApi || {}),
                                  chatId: e.target.value,
                                },
                              },
                            }));
                            triggerToast('Groupe WhatsApp sélectionné !');
                          }
                        }}
                      >
                        <option value="">Sélectionner un groupe détecté ({whatsappGroups.length})...</option>
                        {whatsappGroups.map((grp) => (
                          <option key={grp.id} value={grp.id}>
                            {grp.name} ({grp.id.slice(0, 15)}...)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="test-email-btn"
                  style={{ background: '#25D366', color: '#FFFFFF', borderColor: '#20BD5A' }}
                  onClick={handleTestWhatsApp}
                  disabled={testingWhatsApp}
                >
                  {testingWhatsApp ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> Envoi WhatsApp en cours...
                    </>
                  ) : (
                    <>
                      <i className="fa-brands fa-whatsapp"></i> Tester l'envoi dans le groupe WhatsApp
                    </>
                  )}
                </button>
                <small className="help-text">
                  Envoie un message test immédiat dans votre groupe "news orders".
                </small>
              </div>
            </div>

            <div className="settings-bottom-actions">
              <button
                type="button"
                className="admin-primary-btn"
                onClick={handleSaveData}
                disabled={saving}
              >
                <i className="fa-solid fa-floppy-disk"></i> Enregistrer les paramètres
              </button>
            </div>
          </section>
        )}

        {/* Tab 3: Deploy Guide */}
        {activeTab === 'deploy' && (
          <section className="admin-section deploy-section">
            <h2>Guide de Déploiement Vercel & Stockage Gratuit Blob</h2>
            <p>
              Pour bénéficier du stockage gratuit permanent d'images et de données proposé par Vercel, suivez ces 3 étapes :
            </p>

            <div className="deploy-steps-list">
              <div className="deploy-step-card">
                <div className="step-num">1</div>
                <div>
                  <h4>Déployez le projet sur Vercel</h4>
                  <p>
                    Liez votre dépôt GitHub / GitLab à votre compte <strong>Vercel</strong> et lancez le déploiement normal.
                  </p>
                </div>
              </div>

              <div className="deploy-step-card">
                <div className="step-num">2</div>
                <div>
                  <h4>Activez le store Vercel Blob (100% Gratuit)</h4>
                  <p>
                    Dans votre tableau de bord de projet Vercel, cliquez sur l'onglet <strong>Storage</strong>, puis <strong>Create Database</strong> &gt; <strong>Blob</strong>.
                    Vercel associera automatiquement la variable <code>BLOB_READ_WRITE_TOKEN</code> à votre projet sans aucune configuration manuelle !
                  </p>
                </div>
              </div>

              <div className="deploy-step-card">
                <div className="step-num">3</div>
                <div>
                  <h4>Ajoutez vos images et gérez vos prix</h4>
                  <p>
                    Rendez-vous sur <code>votre-site.vercel.app/admin</code> : téléversez les images de vos produits. Elles seront sauvegardées directement dans le cloud Blob haute performance avec CDN mondial !
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Edit / Add Product Modal */}
      {editingProduct && (
        <div className="modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="modal-card admin-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{isAddingNew ? 'Ajouter un nouveau produit' : 'Modifier le produit'}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingProduct(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="admin-product-edit-form">
              <div className="admin-form-grid">
                <div className="form-group full-width">
                  <label>Titre complet du produit (Français) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, title: e.target.value })
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Titre en Arabe (العنوان بالعربية)</label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: باقة جوجل للذكاء الاصطناعي"
                    value={editingProduct.titleAr || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, titleAr: e.target.value })
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>Nom court / Titre compact</label>
                  <input
                    type="text"
                    value={editingProduct.shortTitle || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, shortTitle: e.target.value })
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>Catégorie</label>
                  <select
                    value={editingProduct.category || 'ai'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="admin-select-input"
                  >
                    {(data.categories || [])
                      .filter((c) => c.id !== 'all')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label} {c.labelAr ? `(${c.labelAr})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Prix de vente (DH / MAD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.priceMAD || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        priceMAD: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>Prix d'achat coût (DH)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="ex : 15"
                    value={editingProduct.purchasePriceUSD || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        purchasePriceUSD: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>Durée / Validité (Français - ex: 18 mois, 1 an)</label>
                  <input
                    type="text"
                    value={editingProduct.duration || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, duration: e.target.value })
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>Durée en Arabe (المدة بالعربية - ex: 18 شهراً، سنة)</label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: شهر واحد"
                    value={editingProduct.durationAr || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, durationAr: e.target.value })
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>Badge d'étiquette (Français - ex: Top Vente)</label>
                  <input
                    type="text"
                    value={editingProduct.badge || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, badge: e.target.value })
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>Badge en Arabe (الشارة بالعربية - ex: الأكثر طلباً)</label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: الأكثر مبيعاً"
                    value={editingProduct.badgeAr || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, badgeAr: e.target.value })
                    }
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label>Prix Officiel constaté</label>
                  <input
                    type="text"
                    placeholder="ex : 21,99 €/mois"
                    value={editingProduct.officialPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, officialPrice: e.target.value })
                    }
                    className="admin-text-input"
                  />
                </div>

                {/* Image Upload section inside edit form */}
                <div className="form-group full-width">
                  <label>Image du Produit</label>
                  <div className="edit-image-preview-row">
                    {editingProduct.imageUrl ? (
                      <img
                        src={editingProduct.imageUrl}
                        alt="Aperçu"
                        className="modal-preview-img"
                      />
                    ) : (
                      <div className="modal-preview-placeholder">
                        <i className="fa-solid fa-image"></i>
                        <span>Aucune image</span>
                      </div>
                    )}

                    <div className="image-inputs-flex">
                      <button
                        type="button"
                        className="admin-secondary-btn"
                        onClick={() => triggerImageUpload(editingProduct.id)}
                        disabled={uploadingForId === editingProduct.id}
                      >
                        {uploadingForId === editingProduct.id ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i> Téléversement...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-cloud-arrow-up"></i> Téléverser une image (Vercel Blob)
                          </>
                        )}
                      </button>

                      <input
                        type="text"
                        placeholder="Ou collez l'URL directe de l'image"
                        value={editingProduct.imageUrl || ''}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, imageUrl: e.target.value })
                        }
                        className="admin-text-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Description détaillée (Français)</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    className="admin-textarea"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description en Arabe (الوصف التفصيلي بالعربية)</label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    placeholder="اكتب وصفاً جذاباً وشاملاً للمنتج ومميزاته بالعربية..."
                    value={editingProduct.descriptionAr || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, descriptionAr: e.target.value })
                    }
                    className="admin-textarea"
                  />
                </div>

                {/* Product Visibility Store Toggle */}
                <div className="form-group full-width">
                  <label>Visibilité du Produit dans le Store (ظهور المنتج في المتجر للزبناء)</label>
                  <div className="vis-switch-container">
                    <button
                      type="button"
                      className={`vis-option-btn ${editingProduct.isActive !== false ? 'active' : ''}`}
                      onClick={() => setEditingProduct({ ...editingProduct, isActive: true })}
                    >
                      <i className="fa-solid fa-circle-check"></i>
                      <div>
                        <strong>Actif (مفعل في المتجر)</strong>
                        <small>Le produit est visible et commandable dans la vitrine</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`vis-option-btn ${editingProduct.isActive === false ? 'inactive' : ''}`}
                      onClick={() => setEditingProduct({ ...editingProduct, isActive: false })}
                    >
                      <i className="fa-solid fa-eye-slash"></i>
                      <div>
                        <strong>Désactivé (معطل ومخفي)</strong>
                        <small>Le produit reste sauvegardé dans l'admin mais masqué du store</small>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-form-actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setEditingProduct(null)}
                >
                  Annuler
                </button>
                <button type="submit" className="admin-primary-btn">
                  <i className="fa-solid fa-check"></i> Valider ce produit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Add / Edit Modal */}
      {editingCategory && (
        <div className="modal-backdrop" onClick={() => setEditingCategory(null)}>
          <div className="modal-card admin-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>
                {isAddingNewCat
                  ? 'Ajouter une Nouvelle Catégorie (إضافة قسم جديد)'
                  : `Modifier la Catégorie : ${editingCategory.label}`}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingCategory(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="admin-category-edit-form">
              <div className="admin-form-grid">
                {/* Row 1: Symmetrical Dual-Language Names */}
                <div className="form-group">
                  <label>Nom en Français *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex : Jeux Vidéo & Gaming"
                    value={editingCategory.label || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const update = { label: val };
                      if (isAddingNewCat && !editingCategory.id) {
                        update.id = val
                          .toLowerCase()
                          .trim()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9_-]/g, '');
                      }
                      setEditingCategory({ ...editingCategory, ...update });
                    }}
                    className="admin-text-input"
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>الاسم بالعربية *</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>(Nom en Arabe)</span>
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    required
                    placeholder="مثال: ألعاب الفيديو واشتراكات الجيمنغ"
                    value={editingCategory.labelAr || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, labelAr: e.target.value })
                    }
                    className="admin-text-input"
                  />
                </div>

                {/* Row 2: Slug ID & FontAwesome Icon Input */}
                <div className="form-group">
                  <label>Identifiant Slug (Code unique) *</label>
                  <input
                    type="text"
                    required
                    disabled={!isAddingNewCat && editingCategory.id === 'all'}
                    placeholder="ex : gaming, education, design"
                    value={editingCategory.id}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
                      })
                    }
                    className="admin-text-input"
                  />
                  <small className="field-hint">
                    {!isAddingNewCat && editingCategory.id === 'all'
                      ? '🔒 Catégorie système globale (Filtre par défaut).'
                      : 'Code unique utilisé pour classer les produits (ex: gaming).'}
                  </small>
                </div>

                <div className="form-group">
                  <label>Icône FontAwesome</label>
                  <div className="cat-icon-input-row">
                    <div className="cat-icon-preview-box">
                      <i className={editingCategory.icon || 'fa-solid fa-shapes'}></i>
                    </div>
                    <input
                      type="text"
                      placeholder="ex : fa-solid fa-gamepad"
                      value={editingCategory.icon || ''}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, icon: e.target.value })
                      }
                      className="admin-text-input"
                    />
                  </div>
                </div>

                {/* Row 3: Recommended Quick-Select Icons Palette */}
                <div className="form-group full-width">
                  <label className="preset-icons-title">
                    <i className="fa-solid fa-icons text-primary"></i>
                    <span>Icônes recommandées (انقر لاختيار أيقونة جاهزة) :</span>
                  </label>
                  <div className="preset-icons-grid">
                    {POPULAR_CATEGORY_ICONS.map((p) => {
                      const isSelected = editingCategory.icon === p.icon;
                      return (
                        <button
                          key={p.icon}
                          type="button"
                          className={`preset-icon-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setEditingCategory({ ...editingCategory, icon: p.icon })}
                          title={p.label}
                        >
                          <i className={p.icon}></i>
                          <span>{p.label}</span>
                          {isSelected && <i className="fa-solid fa-check check-mark-icon"></i>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="modal-form-actions">
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={() => setEditingCategory(null)}
                >
                  Annuler
                </button>
                <button type="submit" className="admin-primary-btn">
                  <i className="fa-solid fa-check"></i> Enregistrer la catégorie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Save Reminder & Toast */}
      {showToast && (
        <div className="admin-toast">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
