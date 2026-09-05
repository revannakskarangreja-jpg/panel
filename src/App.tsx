import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PackageCard } from './components/PackageCard';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { CheckOrderView } from './components/CheckOrderView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { PanelPackage, Order } from './types';
import { testFirestoreConnection } from './lib/firebase';
import {
  AlertTriangle,
  MessageCircle,
  Zap,
  Server,
  Shield,
  Clock,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'check-order' | 'admin'>('catalog');
  const [packages, setPackages] = useState<PanelPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  // Selected package for checkout
  const [selectedPackageForCheckout, setSelectedPackageForCheckout] = useState<PanelPackage | null>(null);

  // Completed order to show in OrderSuccessModal
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Target order to prefill in CheckOrder view
  const [targetCheckOrderId, setTargetCheckOrderId] = useState<string | undefined>(undefined);

  // Admin session state
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('vnp_admin_token') || null;
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Fetch active packages from backend
  const fetchPackages = async () => {
    setIsLoadingPackages(true);
    try {
      const res = await fetch('/api/packages');
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  // Heartbeat ping for visitor analytics
  useEffect(() => {
    testFirestoreConnection();
    fetchPackages();

    // Ping visitor event
    fetch('/api/traffic/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'Membuka Toko', path: window.location.pathname }),
    }).catch(() => {});

    // Polling catalog every 30s to keep stock count updated
    const interval = setInterval(fetchPackages, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminLoginSuccess = (token: string) => {
    setAdminToken(token);
    localStorage.setItem('vnp_admin_token', token);
    setActiveTab('admin');
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem('vnp_admin_token');
    setActiveTab('catalog');
  };

  // Check if ALL packages have 0 stock
  const allOutOfStock =
    packages.length > 0 &&
    packages.every((pkg) => (pkg.stockCount ?? 0) === 0);

  const whatsappAdminRestockUrl =
    'https://wa.me/6285136934300?text=' +
    encodeURIComponent('Halo Vann Peterodycl, saya ingin menanyakan restock panel Pterodactyl. Apakah ada update stok?');

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] selection:bg-cyan-500 selection:text-black">
      {/* Dynamic Cyber Ambient Glow Effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-[120px]"></div>
      </div>

      {/* Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminLoggedIn={!!adminToken}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* Global Banner: Out of Stock for ALL Packages */}
      {allOutOfStock && (
        <div className="relative z-10 w-full bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 border-b border-rose-500/40 px-4 py-3 shadow-[0_4px_20px_rgba(225,29,72,0.3)]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
              <div>
                <h4 className="font-['Space_Grotesk'] font-bold text-white text-sm tracking-wide">
                  ⚠️ STOK SEDANG HABIS
                </h4>
                <p className="text-xs text-rose-200">
                  Hubungi admin WhatsApp untuk menanyakan restock.
                </p>
              </div>
            </div>

            <a
              id="btn-chat-admin-restock"
              href={whatsappAdminRestockUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold font-mono tracking-wider text-white bg-rose-600 hover:bg-rose-500 shadow-lg transition-all shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>CHAT ADMIN</span>
            </a>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-1">
        {/* VIEW 1: CATALOG */}
        {activeTab === 'catalog' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] mb-4">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>PTERODACTYL PANEL READY STOCK</span>
              </div>

              <h1 className="font-['Space_Grotesk'] text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                VANN <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">PETERODYCL</span>
              </h1>

              <p className="mt-3 text-base sm:text-lg text-slate-300 font-medium">
                “Panel Siap Pakai, Harga Bersahabat.”
              </p>

              <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Beli akun panel Pterodactyl instan tanpa antre. Stok fresh disiapkan langsung oleh admin, sistem pembayaran otomatis, dan data login dikirimkan seketika.
              </p>

              {/* Quick Feature Badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-400">
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900/60 rounded-lg border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Pengiriman 1 Detik</span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900/60 rounded-lg border border-slate-800">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Alokasi Stok Anti-Bentrok</span>
                </div>
                <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-900/60 rounded-lg border border-slate-800">
                  <Server className="w-3.5 h-3.5 text-blue-400" />
                  <span>Uptime Server 99.9%</span>
                </div>
              </div>
            </div>

            {/* Catalog Grid Header */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                <h2 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold text-white tracking-wide">
                  Pilihan Paket Panel
                </h2>
              </div>
              <button
                onClick={fetchPackages}
                className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
                title="Refresh Stok"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPackages ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Perbarui Stok</span>
              </button>
            </div>

            {/* Packages Grid */}
            {isLoadingPackages && packages.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-80 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-6 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="h-6 w-24 bg-slate-800 rounded"></div>
                      <div className="h-8 w-40 bg-slate-800 rounded"></div>
                      <div className="h-4 w-full bg-slate-800 rounded"></div>
                    </div>
                    <div className="h-12 w-full bg-slate-800 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : packages.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800">
                <p className="text-slate-400 text-sm">Belum ada paket aktif yang tersedia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onSelectBuy={(selected) => setSelectedPackageForCheckout(selected)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: CHECK ORDER */}
        {activeTab === 'check-order' && (
          <CheckOrderView
            initialOrderId={targetCheckOrderId}
            onBackToCatalog={() => {
              setTargetCheckOrderId(undefined);
              setActiveTab('catalog');
            }}
          />
        )}

        {/* VIEW 3: ADMIN DASHBOARD */}
        {activeTab === 'admin' && adminToken && (
          <AdminDashboard onLogout={handleAdminLogout} token={adminToken} />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500/20 bg-[#04070e] py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <span className="font-['Space_Grotesk'] font-bold text-white tracking-wider">
              VANN PETERODYCL
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">Panel Siap Pakai, Harga Bersahabat.</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <button
              onClick={() => setActiveTab('catalog')}
              className="hover:text-cyan-400 transition-colors"
            >
              Katalog Paket
            </button>
            <button
              onClick={() => setActiveTab('check-order')}
              className="hover:text-cyan-400 transition-colors"
            >
              Cek Pesanan
            </button>
            <button
              onClick={() => {
                if (adminToken) setActiveTab('admin');
                else setIsAdminLoginOpen(true);
              }}
              className="hover:text-cyan-400 transition-colors"
            >
              Admin
            </button>
            <a
              href="https://wa.me/6285136934300"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center space-x-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </footer>

      {/* MODAL: CHECKOUT */}
      {selectedPackageForCheckout && (
        <CheckoutModal
          pkg={selectedPackageForCheckout}
          onClose={() => setSelectedPackageForCheckout(null)}
          onPaymentSuccess={(order) => {
            setSelectedPackageForCheckout(null);
            setCompletedOrder(order);
            fetchPackages(); // refresh stock numbers
          }}
        />
      )}

      {/* MODAL: ORDER SUCCESS & PANEL CREDENTIALS */}
      {completedOrder && (
        <OrderSuccessModal
          order={completedOrder}
          onClose={() => setCompletedOrder(null)}
          onGoToCheckOrder={(orderId) => {
            setCompletedOrder(null);
            setTargetCheckOrderId(orderId);
            setActiveTab('check-order');
          }}
        />
      )}

      {/* MODAL: ADMIN LOGIN */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccessLogin={handleAdminLoginSuccess}
      />
    </div>
  );
}
