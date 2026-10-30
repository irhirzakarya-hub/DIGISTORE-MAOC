import { getConfig } from '@/lib/storage';
import StoreClient from './StoreClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const initialData = await getConfig();
  return <StoreClient initialData={initialData} />;
}
