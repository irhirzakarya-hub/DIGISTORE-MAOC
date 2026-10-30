import AdminClient from './AdminClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Administration • DIGISTORE',
};

export default function AdminPage() {
  return <AdminClient />;
}
