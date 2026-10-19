import type { Metadata, Viewport } from 'next';
import './global.css';
import './brand-palette.css';
import './games.css';
import './race-club.css';
import './profile-settings.css';
import './live-flow.css';
import './post-race.css';
import './desktop-responsive.css';
import './racing-information.css';
import './site-navigation.css';
import './education.css';
import './subscriptions.css';
import './racing-layout.css';
import './racing-data.css';

export const metadata: Metadata = {
  title: 'Philippine Jockey',
  description: 'Race day, made simple.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
