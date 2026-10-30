import { getConfig } from '@/lib/storage';
import { notFound } from 'next/navigation';
import ProductPageClient from './ProductPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }) {
  const data = await getConfig();
  const product = (data.products || []).find((p) => p.id === params.id);
  if (!product || product.isActive === false || product.status === 'inactive') {
    return { title: 'Produit introuvable • DIGISTORE' };
  }
  return {
    title: `${product.title} - Commander en ligne • ${data.storeInfo?.name || 'DIGISTORE'}`,
    description: product.description?.slice(0, 160) || `Commandez ${product.title} au meilleur prix.`,
  };
}

export default async function ProductPage({ params }) {
  const data = await getConfig();
  const product = (data.products || []).find((p) => p.id === params.id);

  if (!product || product.isActive === false || product.status === 'inactive') {
    notFound();
  }

  // Related products (only active)
  const relatedProducts = (data.products || [])
    .filter((p) => p.id !== product.id && p.isActive !== false && p.status !== 'inactive' && (p.category === product.category || p.featured))
    .slice(0, 4);

  return (
    <ProductPageClient
      product={product}
      storeInfo={data.storeInfo}
      relatedProducts={relatedProducts}
    />
  );
}

