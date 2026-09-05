import React from 'react';
import { Server, Search, Shield, MessageCircle, Zap, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: 'catalog' | 'check-order' | 'admin';
  setActiveTab: (tab: 'catalog' | 'check-order' | 'admin') => void;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdminLoggedIn,
  onOpenAdminLogin,
}) => {
  const whatsappUrl = 'https://wa.me/6285136934300?text=Halo%20Vann%20Peterodycl,%20saya%20ingin%20bertanya%20seputar%20panel%20Pterodactyl';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[#060a14]/90 backdrop-blur-md">
      {/* Top micro-bar with status indicator */}
      <div className="w-full bg-gradient-to-r from-cyan-950/40 via-slate-900 to-cyan-950/40 px-4 py-1 text-xs border-b border-cyan-900/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-mono text-[11px] text-cyan-300 tracking-wider">
              AUTO-DELIVERY ACTIVE &bull; INSTANT CREDENTIALS
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-3 text-slate-400 text-[11px]">
            <span className="flex items-center space-x-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Sistem Stok Terenkripsi</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400/90 font-medium">Bantuan Cepat 24/7</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo and Tagline */}
          <div 
            onClick={() => setActiveTab('catalog')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] group-hover:border-cyan-400 transition-all duration-300">
              <Server className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[#060a14]"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  VANN <span className="text-cyan-400">PETERODYCL</span>
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 rounded">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide">
                Panel Siap Pakai, Harga Bersahabat.
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'catalog'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Katalog Paket</span>
            </button>

            <button
              onClick={() => setActiveTab('check-order')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'check-order'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Cek Pesanan</span>
            </button>

            <button
              onClick={() => {
                if (isAdminLoggedIn) {
                  setActiveTab('admin');
                } else {
                  onOpenAdminLogin();
                }
              }}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-400" />
              <span>{isAdminLoggedIn ? 'Admin Panel' : 'Login Admin'}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-400 transition-all ml-2"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Admin</span>
            </a>
          </nav>

          {/* Mobile Fast Action Buttons */}
          <div className="flex md:hidden items-center space-x-1">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`p-2 rounded-lg text-xs font-medium ${
                activeTab === 'catalog' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
              }`}
              title="Katalog"
            >
              <Zap className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('check-order')}
              className={`p-2 rounded-lg text-xs font-medium ${
                activeTab === 'check-order' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
              }`}
              title="Cek Pesanan"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (isAdminLoggedIn) setActiveTab('admin');
                else onOpenAdminLogin();
              }}
              className={`p-2 rounded-lg text-xs font-medium ${
                activeTab === 'admin' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-400'
              }`}
              title="Admin"
            >
              <Shield className="w-5 h-5" />
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              title="WhatsApp"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
