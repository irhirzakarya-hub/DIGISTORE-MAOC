import './globals.css';
import MetaPixel from './components/MetaPixel';

export const metadata = {
  title: "DIGISTORE • Boutique Numérique & Produits Connectés",
  description: "Boutique officielle de produits numériques, abonnements streaming, licences pro, outils IA et cartes NFC connectées.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#3B4FD8',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" dir="ltr" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Sora:wght@400;500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
