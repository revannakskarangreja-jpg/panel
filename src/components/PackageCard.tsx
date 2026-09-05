import React from 'react';
import { Cpu, HardDrive, Zap, CheckCircle2, MessageCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import { PanelPackage } from '../types';
import { formatRupiah } from '../utils/formatters';

interface PackageCardProps {
  pkg: PanelPackage;
  onSelectBuy: (pkg: PanelPackage) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, onSelectBuy }) => {
  const stock = pkg.stockCount ?? 0;
  const isAvailable = stock > 0;

  // WhatsApp automated template message when stock is 0
  const whatsappMessage = encodeURIComponent(
    `Halo Vann Peterodycl, saya ingin membeli ${pkg.name}. Apakah stok sudah tersedia?`
  );
  const whatsappUrl = `https://wa.me/6285136934300?text=${whatsappMessage}`;

  return (
    <div
      id={`package-card-${pkg.id}`}
      className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-300 p-6 overflow-hidden ${
        isAvailable
          ? 'bg-gradient-to-b from-[#0b1329]/90 to-[#070d1d]/90 border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] hover:-translate-y-1'
          : 'bg-gradient-to-b from-slate-900/60 to-slate-950/80 border-slate-800 opacity-90'
      }`}
    >
      {/* Decorative cyber grid accent on top right */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div>
        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono tracking-wider bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>{pkg.ram} {pkg.ramUnit || 'GB'} RAM</span>
          </span>

          {/* Stock Status Badge */}
          {isAvailable ? (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium font-mono bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Stok: {stock}</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold font-mono bg-rose-950/60 border border-rose-500/40 text-rose-300">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              <span>STOK HABIS</span>
            </span>
          )}
        </div>

        {/* Title and Price */}
        <div className="mb-4">
          <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">
            {pkg.name}
          </h3>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-3xl font-black font-['Space_Grotesk'] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {formatRupiah(pkg.price)}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ panel siap pakai</span>
          </div>
          <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {pkg.description || 'Panel Pterodactyl siap pakai dengan performa stabil.'}
          </p>
        </div>

        {/* Specs Box */}
        <div className="space-y-2 py-3.5 my-3 border-y border-slate-800/80 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">CPU Allocation</span>
            </div>
            <span className="font-mono font-medium text-slate-200">{pkg.cpu || '150% CPU'}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">Storage NVMe</span>
            </div>
            <span className="font-mono font-medium text-slate-200">{pkg.disk || '10 GB'}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400">Pengiriman</span>
            </div>
            <span className="font-mono font-medium text-emerald-300">Otomatis &bull; 1 Detik</span>
          </div>
        </div>
      </div>

      {/* Action Button: Beli Sekarang or Tanya Stok via WhatsApp */}
      <div className="mt-4">
        {isAvailable ? (
          <button
            id={`btn-buy-${pkg.id}`}
            onClick={() => onSelectBuy(pkg)}
            className="w-full relative group flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-sm text-[#060a14] bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400 hover:from-cyan-300 hover:to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.55)] transition-all duration-200 active:scale-[0.98] cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4 text-[#060a14]" />
            <span>BELI SEKARANG</span>
          </button>
        ) : (
          <a
            id={`btn-wa-${pkg.id}`}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">📱 TANYA STOK VIA WHATSAPP</span>
          </a>
        )}
      </div>
    </div>
  );
};
