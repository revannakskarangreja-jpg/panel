import React, { useState } from 'react';
import { CheckCircle, Copy, Eye, EyeOff, ExternalLink, Download, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { Order } from '../types';
import { copyToClipboard, downloadTextFile, formatDate, formatRupiah } from '../utils/formatters';

interface OrderSuccessModalProps {
  order: Order;
  onClose: () => void;
  onGoToCheckOrder: (orderId: string) => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  onClose,
  onGoToCheckOrder,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const panel = order.deliveredPanel;

  const handleCopy = async (field: string, text?: string) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    if (!panel) return;
    const allData = `==============================
VANN PETERODYCL - DATA PANEL
==============================
ID Pesanan : ${order.id}
Paket      : ${order.packageName}
Harga      : ${formatRupiah(order.price)}
Tanggal    : ${formatDate(order.paidAt || order.createdAt)}
------------------------------
URL Panel  : ${panel.url}
Username   : ${panel.username}
Password   : ${panel.password}
Catatan    : ${panel.notes || '-'}
==============================
Peringatan: Jangan bagikan data login ini kepada orang lain!
Simpan ID Pesanan Anda untuk mengecek kembali di website.
`;
    const ok = await copyToClipboard(allData);
    if (ok) {
      setCopiedField('all');
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleDownloadTxt = () => {
    if (!panel) return;
    const content = `==============================
VANN PETERODYCL - BUKTI PEMBELIAN & DATA LOGIN
==============================
ID Pesanan      : ${order.id}
Nama Pembeli    : ${order.buyerName}
Paket           : ${order.packageName}
Total Bayar     : ${formatRupiah(order.price)}
Status          : LUNAS / SELESAI
Waktu Pembelian : ${formatDate(order.paidAt || order.createdAt)}

DATA PANEL PTERODACTYL SIAP PAKAI:
----------------------------------
URL Panel       : ${panel.url}
Username        : ${panel.username}
Password        : ${panel.password}
Informasi Port  : ${panel.notes || 'Standar Pterodactyl Ready-to-Use'}

=======================================================
PERINGATAN KEAMANAN:
Jangan bagikan username dan password di atas kepada siapa pun.
Anda dapat mengecek kembali data ini di website VANN PETERODYCL
dengan memasukkan ID Pesanan: ${order.id}
=======================================================`;
    downloadTextFile(`VANN_PETERODYCL_${order.id}.txt`, content);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#090e1c] border border-cyan-500/40 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden my-8">
        {/* Glow Header */}
        <div className="relative p-6 text-center bg-gradient-to-b from-cyan-950/60 to-transparent border-b border-cyan-900/30">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.4)] mb-3 text-cyan-300">
            <CheckCircle className="w-8 h-8 text-cyan-400 animate-bounce" />
          </div>

          <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white tracking-tight">
            🎉 PEMBELIAN BERHASIL
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Akun panel Pterodactyl siap pakai Anda telah dialokasikan dan aktif 100%!
          </p>
        </div>

        {/* Order Metadata Box */}
        <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div>
            <span className="text-slate-400">ID Pesanan:</span>
            <span className="ml-2 font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-500/30">
              {order.id}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Paket:</span>
            <span className="ml-2 font-bold text-white bg-slate-800 px-2.5 py-1 rounded">
              {order.packageName}
            </span>
          </div>
        </div>

        {/* Delivered Panel Data Box */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Data Panel Pterodactyl Anda:</span>
            </span>
            {panel && (
              <a
                href={panel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>Buka Panel Langsung</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {panel ? (
            <div className="space-y-3 p-4 rounded-2xl bg-[#060a14] border border-cyan-500/30 shadow-inner">
              {/* URL */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="text-xs">
                  <span className="text-slate-400 block sm:inline font-mono sm:mr-2">URL Panel:</span>
                  <span className="font-mono text-cyan-300 font-medium break-all">{panel.url}</span>
                </div>
                <button
                  onClick={() => handleCopy('url', panel.url)}
                  className="self-end sm:self-center flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>{copiedField === 'url' ? 'Tersalin!' : 'Copy URL'}</span>
                </button>
              </div>

              {/* Username */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="text-xs font-mono">
                  <span className="text-slate-400 mr-2">Username:</span>
                  <span className="text-white font-bold">{panel.username}</span>
                </div>
                <button
                  id="btn-copy-username"
                  onClick={() => handleCopy('username', panel.username)}
                  className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>{copiedField === 'username' ? 'Tersalin!' : 'Copy Username'}</span>
                </button>
              </div>

              {/* Password */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="text-xs font-mono">
                  <span className="text-slate-400 mr-2">Password:</span>
                  <span className="text-emerald-400 font-bold tracking-wider">
                    {showPassword ? panel.password : '••••••••••••'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    id="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
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
                    id="btn-copy-password"
                    onClick={() => handleCopy('password', panel.password)}
                    className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    <Copy className="w-3 h-3 text-cyan-400" />
                    <span>{copiedField === 'password' ? 'Tersalin!' : 'Copy Password'}</span>
                  </button>
                </div>
              </div>

              {/* Notes / Port if any */}
              {panel.notes && (
                <div className="text-[11px] font-mono text-slate-400 pt-1">
                  <span className="text-slate-500 mr-1">Info Tambahan:</span> {panel.notes}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300">
              Data panel sedang disiapkan. Silakan refresh atau cek via ID Pesanan.
            </div>
          )}

          {/* Warning Notice */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start space-x-2.5 text-xs text-amber-200/90">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold">Peringatan:</span> Jangan bagikan data login panel kepada orang lain.
              Segera login dan ubah password jika diinginkan. Simpan ID Pesanan Anda:{' '}
              <strong className="text-white font-mono">{order.id}</strong>.
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              id="btn-copy-all"
              onClick={handleCopyAll}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs text-cyan-200 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/60 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all cursor-pointer"
            >
              <Copy className="w-4 h-4 text-cyan-400" />
              <span>{copiedField === 'all' ? 'Semua Data Tersalin!' : 'Copy Semua Data'}</span>
            </button>

            <button
              id="btn-download-txt"
              onClick={handleDownloadTxt}
              className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-xs text-slate-200 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Unduh File Bukti (.TXT)</span>
            </button>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
            <button
              onClick={() => onGoToCheckOrder(order.id)}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Cek Halaman Status Pesanan &rarr;
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
