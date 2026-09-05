import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, QrCode, CreditCard, Wallet, AlertTriangle, ArrowRight, Loader2, CheckCircle2, Clock, Copy, Check } from 'lucide-react';
import { PanelPackage, Order, PaymentSettings } from '../types';
import { formatRupiah, copyToClipboard } from '../utils/formatters';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CheckoutModalProps {
  pkg: PanelPackage;
  onClose: () => void;
  onPaymentSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  pkg,
  onClose,
  onPaymentSuccess,
}) => {
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'dana' | 'gopay' | 'bca' | 'seabank'>('qris');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // Payment settings from server
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    qrisImageUrl: '',
    qrisStoreName: 'VANN PETERODYCL STORE',
    qrisNmid: 'ID102026VANN01',
    danaNumber: '083126032264',
    danaName: 'VANN STORE',
    gopayNumber: '083126032264',
    gopayName: 'VANN STORE',
    bankName: 'BCA / SeaBank',
    bankNumber: '1234567890',
    bankHolder: 'VANN PETERODYCL',
    instructionText: 'Scan QRIS All Payment atau transfer sesuai nominal tagihan pesanan Anda.',
  });

  useEffect(() => {
    fetch('/api/payment-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.settings) {
          setPaymentSettings(data.settings);
        }
      })
      .catch((err) => console.error('Failed to load payment settings in checkout:', err));
  }, []);

  // 15-minute countdown for payment
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    if (step === 'payment') {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Create pending order on server
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim()) {
      setErrorMessage('Mohon isi nama atau username Anda.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          buyerName: buyerName.trim(),
          buyerContact: buyerContact.trim() || 'Pembeli Web',
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.order) {
        throw new Error(data.error || 'Gagal membuat pesanan');
      }

      setCurrentOrder(data.order);
      setStep('payment');

      // Sync order record to Firebase Firestore
      try {
        await setDoc(doc(db, 'orders', data.order.id), {
          id: data.order.id,
          packageId: data.order.packageId,
          packageName: data.order.packageName,
          price: Number(data.order.price) || 0,
          buyerName: data.order.buyerName,
          buyerContact: data.order.buyerContact,
          paymentMethod: data.order.paymentMethod,
          paymentStatus: data.order.paymentStatus,
          orderStatus: data.order.orderStatus,
          createdAt: data.order.createdAt,
        });
      } catch (fbErr) {
        console.warn('Firebase Firestore sync notice:', fbErr);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Simulate Instant Payment Confirmation (Atomic stock allocation)
  const handleConfirmPayment = async () => {
    if (!currentOrder) return;
    setIsPaying(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/orders/${currentOrder.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        throw new Error(data.error || 'Pembayaran gagal diverifikasi.');
      }

      // Success! Hand over to OrderSuccess view
      onPaymentSuccess(data.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses transaksi stok.');
    } finally {
      setIsPaying(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (currentOrder) {
      try {
        await fetch(`/api/orders/${currentOrder.id}/cancel`, { method: 'POST' });
      } catch (err) {
        console.error('Cancel order error:', err);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0a0f1e] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
            <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white tracking-wide">
              {step === 'form' ? 'Checkout Pembelian Panel' : 'Konfirmasi Pembayaran'}
            </h3>
          </div>
          <button
            onClick={step === 'payment' ? handleCancelOrder : onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Package Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900/50 border-b border-cyan-900/30 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Paket Dipilih:</span>
            <span className="ml-2 font-bold text-cyan-300">{pkg.name} ({pkg.ram}GB RAM)</span>
          </div>
          <div className="font-mono font-bold text-white text-sm">
            {formatRupiah(pkg.price)}
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="m-6 mb-0 p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: BUYER FORM */}
        {step === 'form' && (
          <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nama Pembeli / Akun <span className="text-cyan-400">*</span>
              </label>
              <input
                id="input-buyer-name"
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Contoh: Alex Pratama"
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nomor WhatsApp / Email (Opsional)
              </label>
              <input
                id="input-buyer-contact"
                type="text"
                value={buyerContact}
                onChange={(e) => setBuyerContact(e.target.value)}
                placeholder="08xxxxxxxxxx atau email@gmail.com"
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Digunakan untuk rekaman data invoice dan pengecekan pesanan jika lupa ID Pesanan.
              </p>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Pilih Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                    paymentMethod === 'qris'
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">QRIS Instant</div>
                    <div className="text-[10px] text-slate-400">Scan via Semua E-Wallet & Bank</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('dana')}
                  className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                    paymentMethod === 'dana'
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">DANA / OVO</div>
                    <div className="text-[10px] text-slate-400">Transfer E-Wallet</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('gopay')}
                  className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                    paymentMethod === 'gopay'
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Wallet className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">GoPay / ShopeePay</div>
                    <div className="text-[10px] text-slate-400">Instant E-Wallet</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bca')}
                  className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                    paymentMethod === 'bca'
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white">Transfer Bank</div>
                    <div className="text-[10px] text-slate-400">BCA / SeaBank / Mandiri</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Atomic Protection Note */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Data panel dialokasikan secara atomik saat pembayaran selesai. Akun dijamin fresh & siap pakai.
              </span>
            </div>

            <button
              id="btn-proceed-payment"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-sm text-[#060a14] bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan Pesanan...</span>
                </>
              ) : (
                <>
                  <span>Lanjut ke Pembayaran</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: PAYMENT SCREEN */}
        {step === 'payment' && currentOrder && (
          <div className="p-6 space-y-5">
            {/* Order Reference Bar */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">ID Pesanan:</span>
                <span className="ml-1 font-mono font-bold text-cyan-300">{currentOrder.id}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-amber-300 font-mono">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            </div>

            {/* QRIS / Payment Box */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-cyan-500/20 text-center">
              <span className="text-xs uppercase font-mono tracking-widest text-cyan-400 font-semibold mb-1">
                {paymentMethod === 'qris' ? 'Scan QRIS All Payment' : paymentMethod === 'dana' ? 'Transfer Akun DANA' : paymentMethod === 'gopay' ? 'Transfer Akun GoPay' : 'Transfer Rekening Bank'}
              </span>
              <div className="text-2xl font-black font-['Space_Grotesk'] text-white my-1">
                {formatRupiah(currentOrder.price)}
              </div>
              <span className="text-[11px] text-slate-400 mb-4">
                {paymentMethod === 'qris'
                  ? 'Mendukung Semua Pembayaran: GoPay, OVO, DANA, BCA, ShopeePay, LinkAja, Mobile Banking'
                  : 'Kirim sesuai nominal pesanan di atas ke detail berikut:'}
              </span>

              {/* Dynamic Payment Graphic / Details based on method */}
              {paymentMethod === 'qris' ? (
                <div className="relative p-4 bg-white rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.15)] flex flex-col items-center max-w-[280px] w-full">
                  <span className="text-[11px] font-bold text-slate-900 tracking-wider uppercase mb-1">
                    {paymentSettings.qrisStoreName || 'QRIS ALL PAYMENT'}
                  </span>

                  <div className="w-52 h-52 border-2 border-dashed border-slate-300 rounded-xl p-1.5 flex flex-col items-center justify-center bg-white relative overflow-hidden">
                    {paymentSettings.qrisImageUrl ? (
                      <img
                        src={paymentSettings.qrisImageUrl}
                        alt="QRIS All Payment"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <>
                        {/* Cyber QR Pattern Representation */}
                        <div className="grid grid-cols-6 gap-1.5 w-full h-full p-1 opacity-90">
                          {Array.from({ length: 36 }).map((_, i) => (
                            <div
                              key={i}
                              className={`rounded-xs ${
                                i % 2 === 0 || i % 7 === 0 || i === 0 || i === 5 || i === 30 || i === 35
                                  ? 'bg-slate-900'
                                  : (i * 17) % 5 === 0
                                  ? 'bg-cyan-600'
                                  : 'bg-slate-200'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Centered Brand Tag */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="px-2 py-1 bg-[#060a14] rounded text-[10px] font-black tracking-widest text-cyan-400 border border-cyan-400 shadow-md">
                            VANN
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <span className="mt-2 text-[10px] font-mono font-bold text-slate-800 tracking-wider">
                    NMID: {paymentSettings.qrisNmid || 'ID102026VANN01'}
                  </span>
                </div>
              ) : paymentMethod === 'dana' ? (
                <div className="w-full max-w-sm p-4 bg-slate-900/90 border border-blue-500/40 rounded-2xl text-left space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-blue-400 font-mono">AKUN DANA RESMI</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 font-semibold">
                      Terverifikasi
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Nomor DANA:</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-mono font-black text-white tracking-wider">
                        {paymentSettings.danaNumber || '083126032264'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(paymentSettings.danaNumber || '083126032264');
                          setCopiedNumber(true);
                          setTimeout(() => setCopiedNumber(false), 2000);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                      >
                        {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNumber ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Atas Nama:</span>
                    <span className="text-xs font-bold text-slate-200">
                      {paymentSettings.danaName || 'VANN STORE'}
                    </span>
                  </div>
                </div>
              ) : paymentMethod === 'gopay' ? (
                <div className="w-full max-w-sm p-4 bg-slate-900/90 border border-emerald-500/40 rounded-2xl text-left space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-400 font-mono">GOPAY / SHOPEEPAY</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                      Aktif
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Nomor HP GoPay:</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-mono font-black text-white tracking-wider">
                        {paymentSettings.gopayNumber || '083126032264'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(paymentSettings.gopayNumber || '083126032264');
                          setCopiedNumber(true);
                          setTimeout(() => setCopiedNumber(false), 2000);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                      >
                        {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNumber ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Atas Nama:</span>
                    <span className="text-xs font-bold text-slate-200">
                      {paymentSettings.gopayName || 'VANN STORE'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-sm p-4 bg-slate-900/90 border border-indigo-500/40 rounded-2xl text-left space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-indigo-300 font-mono">
                      {paymentSettings.bankName || 'BANK BCA / SEABANK'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-semibold">
                      Virtual/Rekening
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Nomor Rekening:</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-mono font-black text-white tracking-wider">
                        {paymentSettings.bankNumber || '1234567890'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(paymentSettings.bankNumber || '1234567890');
                          setCopiedNumber(true);
                          setTimeout(() => setCopiedNumber(false), 2000);
                        }}
                        className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                      >
                        {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedNumber ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Atas Nama:</span>
                    <span className="text-xs font-bold text-slate-200">
                      {paymentSettings.bankHolder || 'VANN PETERODYCL'}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Instructions */}
              <div className="mt-4 text-xs text-slate-400 text-center max-w-xs space-y-1">
                {paymentSettings.instructionText ? (
                  <p className="text-cyan-300/90 font-medium">{paymentSettings.instructionText}</p>
                ) : (
                  <p>Transfer atau scan barcode sesuai nominal di atas, lalu konfirmasi pembayaran.</p>
                )}
                <p className="text-[11px] text-slate-500">Setelah bayar, klik tombol di bawah untuk verifikasi dan menerima akun panel instan.</p>
              </div>
            </div>

            {/* Simulated Instant Confirmation Button */}
            <div className="space-y-2">
              <button
                id="btn-confirm-payment"
                onClick={handleConfirmPayment}
                disabled={isPaying || timeLeft <= 0}
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl font-bold text-sm text-[#060a14] bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all cursor-pointer disabled:opacity-50"
              >
                {isPaying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                    <span className="text-slate-900">Memverifikasi & Mengalokasikan Stok Panel...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-slate-900" />
                    <span className="text-slate-900">⚡ Simulasi Bayar Instan (Dapatkan Akun)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelOrder}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Batalkan Pesanan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
