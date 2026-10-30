# DIGISTORE - Boutique de Produits Numériques & Produits Connectés (Next.js & Vercel Blob)

Plateforme e-commerce moderne pour la vente de produits numériques (licences pro, suites créatives, abonnements streaming, outils IA) et produits physiques connectés (cartes NFC, porte-clés RFID, présentoirs).

---

## 🌟 Fonctionnalités Principales

- **Catalogue Complet Pré-intégré (27 Produits)** :
  - **Outils d'Intelligence Artificielle** : Google AI Bundle (Gemini Pro, Antigravity, NotebookLM), Claude API Key ($100), Grok, Lovable AI Pro, n8n Starter, Claude Compte Neuf.
  - **Créatif & Graphisme** : CapCut Pro, Canva Education, Canva Reseller Panel (500 sièges), Adobe Substance 3D, Adobe Express.
  - **Streaming & Médias** : Netflix Premium 4K UHD, Spotify Premium, YouTube Premium, Amazon Prime Video.
  - **Bureautique & Productivité** : Microsoft 365 Personnel, Outlook PVA, Notion Plus.
  - **Sécurité & VPN** : N-VPN Complete Account.
  - **Comptes & Réseaux Sociaux** : LinkedIn Premium Career (3 mois et 1 mois), Instagram Ancien (2012), Telegram Neuf Vérifié.
  - **Produits Physiques Connectés NFC (Alibaba)** : Cartes NFC PVC personnalisables, cartes vierges, porte-clés RFID et présentoirs de table en L.

- **Stockage Cloud Gratuit avec Vercel Blob (`@vercel/blob`)** :
  - Conforme aux règles d'architecture sans serveur (*serverless*) de Vercel.
  - Stockage persistant des images de produits et de la configuration JSON via Vercel Blob.
  - En local, basculement automatique sur un stockage local (`public/uploads/` et `data/store-data.json`).

- **Panneau d'Administration Intégré (`/admin`)** :
  - **Upload d'images direct** : Cliquez sur l'icône appareil photo de n'importe quel produit pour téléverser sa photo directement vers Vercel Blob.
  - **Édition complète** : Modifiez les titres, catégories, prix de vente (DH), prix d'achat ($), prix officiels, durées et descriptions.
  - **Ajout & Suppression** : Ajoutez de nouveaux produits en un clic ou gérez la disponibilité en stock.
  - **Configuration Boutique** : Modifiez le numéro WhatsApp de commande, l'email, le mot de passe admin et le texte d'annonce.

- **Expérience Client Haute Performance** :
  - Recherche instantanée et filtrage par catégories.
  - Comparateur de prix en direct (Notre Prix vs Prix Officiel vs Prix Concurrent).
  - Sélecteur de devises (MAD / USD / EUR).
  - Mode Sombre / Clair.
  - Bouton de commande direct via WhatsApp avec message pré-rempli.

---

## 🚀 Démarrage en Local

1. Installez les dépendances :
   ```bash
   npm install
   ```

2. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

3. Ouvrez votre navigateur sur [http://localhost:3000](http://localhost:3000).

4. Accédez au panneau d'administration pour téléverser vos photos :
   - URL : [http://localhost:3000/admin](http://localhost:3000/admin)
   - Mot de passe par défaut : `admin`

---

## ☁️ Déploiement sur Vercel & Stockage Gratuit Blob

Pour bénéficier du stockage gratuit permanent de Vercel (1 Go offert sur chaque projet) :

1. Poussez votre code sur votre compte **GitHub** ou **GitLab**.
2. Sur [vercel.com](https://vercel.com), importez le projet et cliquez sur **Deploy**.
3. Dans votre tableau de bord de projet sur Vercel :
   - Allez dans l'onglet **Storage**.
   - Cliquez sur **Create Database** &gt; Sélectionnez **Blob**.
   - Cliquez sur **Connect to Project**. Vercel configurera automatiquement la variable d'environnement `BLOB_READ_WRITE_TOKEN`.
4. Rendez-vous sur `votre-domaine.vercel.app/admin` :
   - Le voyant vert indiquera **Vercel Blob Actif**.
   - Vous pouvez téléverser toutes vos photos de produits, elles seront stockées de manière permanente sur le CDN mondial de Vercel !
