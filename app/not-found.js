import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', color: '#3B4FD8' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Produit ou page introuvable</h2>
      <p style={{ color: '#64748B', marginBottom: '2rem' }}>
        Le produit que vous recherchez n'existe pas ou a été déplacé.
      </p>
      <Link href="/" style={{
        padding: '0.75rem 1.5rem',
        background: '#3B4FD8',
        color: '#FFFFFF',
        borderRadius: '9999px',
        fontWeight: 600,
        textDecoration: 'none'
      }}>
        Retourner à la boutique
      </Link>
    </div>
  );
}

