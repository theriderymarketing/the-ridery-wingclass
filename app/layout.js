import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'THE RIDERY WINGCLASS',
  description: 'Plateforme de réservation et de suivi des cours The Ridery',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable}`}>
      <body className="bg-gray-50 text-gray-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
