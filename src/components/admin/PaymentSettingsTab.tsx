import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Wallet,
  CreditCard,
  FileText,
  Loader2,
  Eye,
} from 'lucide-react';
import { PaymentSettings } from '../../types';

interface PaymentSettingsTabProps {
  token: string;
  onSuccessNotification: (message: string) => void;
  onErrorNotification: (message: string) => void;
}

export const PaymentSettingsTab: React.FC<PaymentSettingsTabProps> = ({
  token,
  onSuccessNotification,
  onErrorNotification,
}) => {
  const [settings, setSettings] = useState<PaymentSettings>({
    qrisImageUrl: '',
    qrisStoreName: 'VANN PETERODYCL STORE',
    qrisNmid: 'ID102026VANN01',
    danaNumber: '081234567890',
    danaName: 'VANN STORE',
    gopayNumber: '081234567890',
    gopayName: 'VANN STORE',
    bankName: 'BCA / SeaBank',
    bankNumber: '1234567890',
    bankHolder: 'VANN PETERODYCL',
    instructionText: 'Scan QRIS All Payment atau transfer sesuai nominal tagihan pesanan Anda.',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load payment settings
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/payment-settings', {
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
      });
      const data = await res.json();
      if (res.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (err: any) {
      console.error('Failed to load payment settings:', err);
      onErrorNotification('Gagal memuat pengaturan pembayaran.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle file conversion to base64
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onErrorNotification('File harus berformat gambar (.png, .jpg, .jpeg, .webp).');
      return;
    }

    // Limit image size to 5MB
    if (file.size > 5 * 1024 * 1024) {
      onErrorNotification('Ukuran gambar maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSettings((prev) => ({
          ...prev,
          qrisImageUrl: result,
        }));
        onSuccessNotification('Foto QRIS berhasil dipilih! Jangan lupa klik Simpan.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Submit & save settings
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan pengaturan pembayaran.');
      }

      setSettings(data.settings);
      onSuccessNotification('Pengaturan Pembayaran & Barcode QRIS berhasil disimpan!');
    } catch (err: any) {
      onErrorNotification(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveQRIS = () => {
    setSettings((prev) => ({ ...prev, qrisImageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onSuccessNotification('Gambar QRIS dicopot. Klik Simpan untuk menerapkan.');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs text-slate-400 font-mono">Memuat Pengaturan Pembayaran...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-950 border border-cyan-500/30">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-['Space_Grotesk'] text-white">
              Metode Pembayaran & Upload QRIS
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola barcode QRIS All Payment, nomor DANA, GoPay, dan rekening bank untuk pembayaran pembeli.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs text-[#060a14] bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-slate-900" />
              <span>Simpan Pengaturan</span>
            </>
          )}
        </button>
      </div>

      {/* SECTION 1: QRIS ALL PAYMENT UPLOAD */}
      <div className="p-6 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-6">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <QrCode className="w-5 h-5 text-cyan-400" />
          <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
            1. Barcode Gambar QRIS All Payment
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Upload Dropzone & File Picker */}
          <div className="lg:col-span-7 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileInputChange}
              className="hidden"
              id="qris-file-input"
            />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                dragActive
                  ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
                  : 'border-slate-700 hover:border-cyan-500/50 bg-slate-900/50 hover:bg-slate-900/80'
              }`}
            >
              <div className="p-3.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3">
                <Upload className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white">
                  Klik untuk pilih file atau tarik & letakkan gambar QRIS di sini
                </p>
                <p className="text-xs text-slate-400">
                  Format gambar yang didukung: <span className="text-cyan-400 font-mono">PNG, JPG, JPEG, WEBP</span> (Maks. 5MB)
                </p>
              </div>

              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900/50 transition-colors pointer-events-none"
              >
                Pilih Foto Barcode QRIS
              </button>
            </div>

            {/* Inputs: Nama Merchant & NMID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nama Toko / Merchant QRIS
                </label>
                <input
                  type="text"
                  value={settings.qrisStoreName}
                  onChange={(e) => setSettings({ ...settings, qrisStoreName: e.target.value })}
                  placeholder="Contoh: VANN PETERODYCL STORE"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  NMID QRIS (Opsional)
                </label>
                <input
                  type="text"
                  value={settings.qrisNmid}
                  onChange={(e) => setSettings({ ...settings, qrisNmid: e.target.value })}
                  placeholder="Contoh: ID102026VANN01"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-300 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Gambar QRIS ini akan <strong>langsung otomatis ditampilkan</strong> kepada pelanggan saat mereka memilih pembayaran <strong>QRIS Instant (All Payment)</strong> pada halaman checkout.
              </span>
            </div>
          </div>

          {/* Right Column: Real-time Live Preview for Buyer */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-3 font-mono">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pratinjau Tampilan di Checkout</span>
            </div>

            <div className="w-full max-w-[280px] p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center">
              <span className="text-[11px] font-bold text-slate-800 tracking-wide uppercase mb-1">
                {settings.qrisStoreName || 'QRIS ALL PAYMENT'}
              </span>

              <div className="w-52 h-52 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden flex items-center justify-center relative p-1.5 my-1">
                {settings.qrisImageUrl ? (
                  <img
                    src={settings.qrisImageUrl}
                    alt="QRIS Merchant"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center space-y-1 text-slate-400">
                    <ImageIcon className="w-10 h-10 text-slate-300 stroke-1" />
                    <span className="text-[11px] font-medium">Belum ada gambar QRIS</span>
                    <span className="text-[9px] text-slate-400">Unggah foto barcode QRIS Anda di samping</span>
                  </div>
                )}
              </div>

              <span className="mt-1 text-[10px] font-mono font-bold text-slate-700 tracking-wider">
                NMID: {settings.qrisNmid || '-'}
              </span>
            </div>

            {settings.qrisImageUrl && (
              <button
                type="button"
                onClick={handleRemoveQRIS}
                className="mt-4 flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus / Ganti Foto QRIS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: E-WALLET (DANA & GOPAY) */}
      <div className="p-6 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <Wallet className="w-5 h-5 text-blue-400" />
          <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
            2. Akun E-Wallet (DANA & GoPay)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* DANA */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-500/20 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <span className="text-xs font-bold font-mono text-blue-300 uppercase">DANA</span>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nomor Akun DANA</label>
              <input
                type="text"
                value={settings.danaNumber}
                onChange={(e) => setSettings({ ...settings, danaNumber: e.target.value })}
                placeholder="081234567890"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Atas Nama (Nama Akun DANA)</label>
              <input
                type="text"
                value={settings.danaName}
                onChange={(e) => setSettings({ ...settings, danaName: e.target.value })}
                placeholder="Nama Anda / Toko"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* GoPay */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold font-mono text-emerald-300 uppercase">GoPay / ShopeePay</span>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nomor Akun GoPay</label>
              <input
                type="text"
                value={settings.gopayNumber}
                onChange={(e) => setSettings({ ...settings, gopayNumber: e.target.value })}
                placeholder="081234567890"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Atas Nama (Nama Pemilik)</label>
              <input
                type="text"
                value={settings.gopayName}
                onChange={(e) => setSettings({ ...settings, gopayName: e.target.value })}
                placeholder="Nama Anda / Toko"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: BANK TRANSFER */}
      <div className="p-6 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
            3. Rekening Transfer Bank (BCA / Mandiri / SeaBank / Lainnya)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Nama Bank
            </label>
            <input
              type="text"
              value={settings.bankName}
              onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
              placeholder="Contoh: BCA / SeaBank / Mandiri"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Nomor Rekening Bank
            </label>
            <input
              type="text"
              value={settings.bankNumber}
              onChange={(e) => setSettings({ ...settings, bankNumber: e.target.value })}
              placeholder="Contoh: 1234567890"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Atas Nama Rekening
            </label>
            <input
              type="text"
              value={settings.bankHolder}
              onChange={(e) => setSettings({ ...settings, bankHolder: e.target.value })}
              placeholder="Nama Pemilik Rekening"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: INSTRUCTION TEXT */}
      <div className="p-6 rounded-2xl bg-[#0a0f1e] border border-cyan-500/20 space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <FileText className="w-5 h-5 text-amber-400" />
          <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
            4. Catatan & Petunjuk Transaksi untuk Pembeli
          </h3>
        </div>

        <div>
          <textarea
            rows={3}
            value={settings.instructionText}
            onChange={(e) => setSettings({ ...settings, instructionText: e.target.value })}
            placeholder="Ketik instruksi tambahan untuk pembeli saat pembayaran..."
            className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:border-cyan-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Bottom Save Button */}
      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold text-sm text-[#060a14] bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
              <span>Menyimpan Pengaturan...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-slate-900" />
              <span>Simpan Semua Pengaturan Pembayaran</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
