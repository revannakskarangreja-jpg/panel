import React, { useState, useEffect } from 'react';
import { Search, Server, Copy, Eye, EyeOff, ExternalLink, ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Order } from '../types';
import { copyToClipboard, formatDate, formatRupiah } from '../utils/formatters';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface CheckOrderViewProps {
  initialOrderId?: string;
  onBackToCatalog: () => void;
}

export const CheckOrderView: React.FC<CheckOrderViewProps> = ({
  initialOrderId,
  onBackToCatalog,
}) => {
  const [searchId, setSearchId] = useState(initialOrderId || '');
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Auto search if initialOrderId provided
  useEffect(() => {
    if (initialOrderId) {
      handleSearch(initialOrderId);
    }
  }, [initialOrderId]);

  const handleSearch = async (idToSearch: string) => {
    const cleanId = idToSearch.trim();
    if (!cleanId) {
      setErrorMessage('Silakan masukkan ID Pesanan.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(cleanId)}`);
      const data = await res.json();

      if (res.ok && data.order) {
        setOrder(data.order);
        return;
      }

      // Fallback: check Firebase Firestore directly
      try {
        const orderSnap = await getDoc(doc(db, 'orders', cleanId));
        if (orderSnap.exists()) {
          const fbData = orderSnap.data() as Order;
          setOrder(fbData);
          return;
        }
      } catch (fbErr) {
        // If Firestore permission error occurs, handle via helper
        try {
          handleFirestoreError(fbErr, OperationType.GET, `orders/${cleanId}`);
        } catch {
          // Logged
        }
      }

      throw new Error(data.error || 'Pesanan tidak ditemukan. Periksa kembali ID Pesanan Anda.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memeriksa pesanan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (field: string, text?: string) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    if (!order || !order.deliveredPanel) return;
    const p = order.deliveredPanel;
    const allData = `==============================
VANN PETERODYCL - DATA PANEL
==============================
ID Pesanan : ${order.id}
Paket      : ${order.packageName}
Status     : ${order.paymentStatus}
Waktu      : ${formatDate(order.paidAt || order.createdAt)}
------------------------------
URL Panel  : ${p.url}
Username   : ${p.username}
Password   : ${p.password}
Catatan    : ${p.notes || '-'}
==============================`;
    const ok = await copyToClipboard(allData);
    if (ok) {
      setCopiedField('all');
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Search Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 mb-3">
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span>PORTAL LACAK PESANAN</span>
        </div>
        <h1 className="text-3xl font-black font-['Space_Grotesk'] text-white tracking-tight">
          Cek Status & Data Panel
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
          Masukkan ID Pesanan (contoh: <span className="font-mono text-cyan-300">VNP-XXXXXXXX</span>) yang Anda peroleh saat pembelian.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchId);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="input-search-order-id"
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.toUpperCase())}
              placeholder="Masukkan ID Pesanan (Contoh: VNP-1A2B3C4D)"
              className="w-full pl-12 pr-4 py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 font-mono text-sm uppercase focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>

          <button
            id="btn-search-order"
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-bold text-sm text-[#060a14] bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Mengecek...</span>
            ) : (
              <>
                <span>Cari Pesanan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-950/50 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Result Card */}
      {order && (
        <div className="bg-[#090e1d] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.2)] animate-fadeIn">
          {/* Status Bar */}
          <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 font-mono">ID Pesanan:</span>
              <span className="ml-2 font-mono font-bold text-white text-base">{order.id}</span>
            </div>

            <div className="flex items-center space-x-2">
              {order.paymentStatus === 'PAID' ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PEMBAYARAN LUNAS</span>
                </span>
              ) : order.paymentStatus === 'PENDING' ? (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-amber-950/70 border border-amber-500/40 text-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>MENUNGGU PEMBAYARAN</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-rose-950/70 border border-rose-500/40 text-rose-300">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{order.paymentStatus}</span>
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Paket Panel</span>
                <span className="text-sm font-bold text-cyan-300">{order.packageName}</span>
              </div>
              <div className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Total Biaya</span>
                <span className="text-sm font-bold text-white">{formatRupiah(order.price)}</span>
              </div>
              <div className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-1">Waktu Pembelian</span>
                <span className="text-xs font-medium text-slate-300">
                  {formatDate(order.paidAt || order.createdAt)}
                </span>
              </div>
            </div>

            {/* Panel Credentials if PAID */}
            {order.paymentStatus === 'PAID' && order.deliveredPanel ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span>Data Panel Siap Pakai Anda</span>
                  </div>
                  <a
                    href={order.deliveredPanel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    <span>Buka Panel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Box Credential */}
                <div className="p-5 rounded-2xl bg-[#060a14] border border-cyan-500/30 space-y-3.5">
                  {/* URL */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-400 font-mono sm:mr-2">URL Panel:</span>
                      <span className="font-mono text-cyan-300 font-semibold break-all">
                        {order.deliveredPanel.url}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy('url', order.deliveredPanel?.url)}
                      className="self-end sm:self-center flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs"
                    >
                      <Copy className="w-3 h-3 text-cyan-400" />
                      <span>{copiedField === 'url' ? 'Tersalin!' : 'Copy URL'}</span>
                    </button>
                  </div>

                  {/* Username */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 mr-2">Username:</span>
                      <span className="text-white font-bold">{order.deliveredPanel.username}</span>
                    </div>
                    <button
                      onClick={() => handleCopy('username', order.deliveredPanel?.username)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs"
                    >
                      <Copy className="w-3 h-3 text-cyan-400" />
                      <span>{copiedField === 'username' ? 'Tersalin!' : 'Copy Username'}</span>
                    </button>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 mr-2">Password:</span>
                      <span className="text-emerald-400 font-bold tracking-wider">
                        {showPassword ? order.deliveredPanel.password : '••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs"
                      >
                        {showPassword ? (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            <span>Sembunyikan</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 text-cyan-400" />
                            <span>Tampilkan Password</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleCopy('password', order.deliveredPanel?.password)}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-xs"
                      >
                        <Copy className="w-3 h-3 text-cyan-400" />
                        <span>{copiedField === 'password' ? 'Tersalin!' : 'Copy Password'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Copy All Button */}
                  <button
                    onClick={handleCopyAll}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl font-bold text-xs text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 hover:bg-cyan-900/60 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{copiedField === 'all' ? 'Semua Data Berhasil Disalin!' : 'Copy Semua Data Panel'}</span>
                  </button>
                </div>

                {/* Warning callout */}
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    “Jangan bagikan data login panel kepada orang lain.”
                  </span>
                </div>
              </div>
            ) : order.paymentStatus === 'PENDING' ? (
              <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center space-y-2">
                <Clock className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-white">Pesanan Ini Belum Dibayar</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Data panel Pterodactyl akan langsung diberikan secara otomatis seketika setelah pembayaran terkonfirmasi.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-center space-y-2">
                <XCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Pesanan Dibatalkan</h4>
                <p className="text-xs text-slate-400">
                  {order.failureReason || 'Transaksi ini telah dibatalkan atau kedaluwarsa.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="mt-8 text-center">
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <span>&larr; Kembali ke Katalog Paket</span>
        </button>
      </div>
    </div>
  );
};
