import { Suspense } from 'react';
import { getConfig } from '@/lib/storage';
import OrderConfirmationClient from './OrderConfirmationClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Commande reçue avec succès • DIGISTORE',
  description: 'Merci pour votre commande, un conseiller va vous contacter sous peu.',
};

export default async function OrderConfirmationPage() {
  const config = await getConfig();

  return (
    <Suspense fallback={<div className="store-container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>Chargement de la confirmation...</div>}>
      <OrderConfirmationClient storeInfo={config.storeInfo} />
    </Suspense>
  );
}

