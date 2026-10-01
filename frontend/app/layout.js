import './globals.css';
import { AuthProvider } from '../lib/auth';
import Nav from '../components/Nav';

export const metadata = { title: 'Lost & Found', description: 'Report and find lost belongings in your community' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Nav />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
