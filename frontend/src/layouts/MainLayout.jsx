import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'; 

export default function MainLayout({ onOpenAuth }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar onOpenAuth={onOpenAuth} />

      <main className="flex-grow-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}