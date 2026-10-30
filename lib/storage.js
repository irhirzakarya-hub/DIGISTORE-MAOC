import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { defaultData } from './defaultData';

const LOCAL_DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, 'store-data.json');
const LEGACY_DATA_FILE = path.join(LOCAL_DATA_DIR, 'remess-data.json');
const BLOB_CONFIG_FILENAME = 'store-config.json';
const LEGACY_BLOB_FILENAME = 'remess-config.json';

// Check if Vercel Blob is configured with an environment token
export function isBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// Get the latest configuration and products
export async function getConfig() {
  if (isBlobConfigured()) {
    try {
      const { blobs } = await list();
      const sortedBlobs = (blobs || []).sort(
        (a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
      );
      
      const targetBlob = sortedBlobs.find(b => b.pathname === BLOB_CONFIG_FILENAME) || 
                         sortedBlobs.find(b => b.pathname === LEGACY_BLOB_FILENAME);
      
      if (targetBlob && targetBlob.url) {
        const cacheBusterUrl = `${targetBlob.url}${targetBlob.url.includes('?') ? '&' : '?'}v=${Date.now()}`;
        const res = await fetch(cacheBusterUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (res.ok) {
          const cloudData = await res.json();
          return {
            ...defaultData,
            ...cloudData,
            storeInfo: { ...defaultData.storeInfo, ...(cloudData.storeInfo || cloudData.general || {}) },
            categories: Array.isArray(cloudData.categories) && cloudData.categories.length > 0 ? cloudData.categories : defaultData.categories,
            products: Array.isArray(cloudData.products) ? cloudData.products : defaultData.products,
            orders: Array.isArray(cloudData.orders) ? cloudData.orders : (defaultData.orders || []),
            _source: 'vercel-blob',
            _blobUrl: targetBlob.url,
          };
        }
      }
    } catch (err) {
      console.warn('[Vercel Blob] Could not read blob, falling back to local/default:', err.message);
    }
  }

  // Local fallback (development or without blob token)
  try {
    const fileToRead = fs.existsSync(LOCAL_DATA_FILE) ? LOCAL_DATA_FILE : (fs.existsSync(LEGACY_DATA_FILE) ? LEGACY_DATA_FILE : null);
    if (fileToRead) {
      const raw = fs.readFileSync(fileToRead, 'utf-8');
      const localData = JSON.parse(raw);
      return {
        ...defaultData,
        ...localData,
        storeInfo: { ...defaultData.storeInfo, ...(localData.storeInfo || localData.general || {}) },
        categories: Array.isArray(localData.categories) && localData.categories.length > 0 ? localData.categories : defaultData.categories,
        products: Array.isArray(localData.products) ? localData.products : defaultData.products,
        orders: Array.isArray(localData.orders) ? localData.orders : (defaultData.orders || []),
        _source: 'local-file',
      };
    }
  } catch (err) {
    console.warn('[Storage] Local read error:', err.message);
  }

  return {
    ...defaultData,
    orders: Array.isArray(defaultData.orders) ? defaultData.orders : [],
    _source: 'default',
  };
}

// Save configuration and products data
export async function saveConfig(newData) {
  const current = await getConfig().catch(() => ({}));

  const merged = {
    storeInfo: { ...defaultData.storeInfo, ...(current.storeInfo || {}), ...(newData.storeInfo || {}) },
    categories: newData.categories && newData.categories.length > 0 ? newData.categories : (current.categories || defaultData.categories),
    products: Array.isArray(newData.products) ? newData.products : (current.products || defaultData.products),
    orders: Array.isArray(newData.orders) ? newData.orders : (current.orders || []),
    updatedAt: new Date().toISOString(),
  };

  let savedSource = 'local-file';
  let blobUrl = null;

  if (isBlobConfigured()) {
    try {
      const blob = await put(BLOB_CONFIG_FILENAME, JSON.stringify(merged, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });
      savedSource = 'vercel-blob';
      blobUrl = blob.url;
      console.log('[Vercel Blob] Store config saved successfully to Blob:', blob.url);
    } catch (err) {
      console.error('[Vercel Blob] Error saving to Blob:', err.message);
      throw new Error(`Erreur Vercel Blob: ${err.message}`);
    }
  }

  // Also write to local storage as fallback/cache
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.log('[Storage] Local disk write skipped or read-only (expected on serverless):', err.message);
  }

  return {
    success: true,
    source: savedSource,
    blobUrl,
    data: merged,
  };
}

// Add a new order
export async function addOrder(orderData) {
  const current = await getConfig();
  const orders = Array.isArray(current.orders) ? current.orders : [];
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const newOrder = {
    id: orderData.id || `CMD-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`,
    createdAt: new Date().toISOString(),
    status: 'nouveau', // 'nouveau' | 'confirme' | 'livre' | 'annule'
    viewed: false,
    ...orderData,
  };

  const updatedOrders = [newOrder, ...orders];
  await saveConfig({
    ...current,
    orders: updatedOrders,
  });

  return newOrder;
}

// Update an existing order
export async function updateOrder(orderId, updateFields) {
  const current = await getConfig();
  const orders = Array.isArray(current.orders) ? [...current.orders] : [];
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) {
    throw new Error(`Commande avec l'identifiant ${orderId} introuvable`);
  }

  orders[idx] = {
    ...orders[idx],
    ...updateFields,
    updatedAt: new Date().toISOString(),
  };

  await saveConfig({
    ...current,
    orders,
  });

  return orders[idx];
}

// Delete an order
export async function deleteOrder(orderId) {
  const current = await getConfig();
  const orders = Array.isArray(current.orders) ? [...current.orders] : [];
  const filtered = orders.filter((o) => o.id !== orderId);

  await saveConfig({
    ...current,
    orders: filtered,
  });

  return { success: true };
}

// Upload file (product photo, logo, etc.) to Vercel Blob or local uploads
export async function uploadMedia(fileBuffer, originalName, mimeType) {
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `uploads/${Date.now()}-${cleanName}`;

  if (isBlobConfigured()) {
    try {
      const blob = await put(filename, fileBuffer, {
        access: 'public',
        contentType: mimeType || 'image/jpeg',
      });
      console.log('[Vercel Blob] Media uploaded to Blob:', blob.url);
      return {
        url: blob.url,
        pathname: blob.pathname,
        source: 'vercel-blob',
      };
    } catch (err) {
      console.error('[Vercel Blob] Error uploading to Blob:', err.message);
      throw err;
    }
  }

  // Local fallback
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFilePath = path.join(uploadsDir, `${Date.now()}-${cleanName}`);
  fs.writeFileSync(localFilePath, fileBuffer);

  const localUrl = `/uploads/${path.basename(localFilePath)}`;
  return {
    url: localUrl,
    pathname: localUrl,
    source: 'local-file',
  };
}
