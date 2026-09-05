import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Layers,
  Database,
  ShoppingBag,
  Activity,
  LogOut,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  FileText,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink,
  Users,
  Wallet,
  Key,
} from 'lucide-react';
import { PanelPackage, StockItem, Order, AdminStats, TrafficEvent } from '../../types';
import { formatRupiah, formatDate, copyToClipboard } from '../../utils/formatters';
import { PaymentSettingsTab } from './PaymentSettingsTab';

interface AdminDashboardProps {
  onLogout: () => void;
  token: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, token }) => {
  const [adminTab, setAdminTab] = useState<'overview' | 'packages' | 'stocks' | 'orders' | 'payments' | 'traffic'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [packages, setPackages] = useState<PanelPackage[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [trafficEvents, setTrafficEvents] = useState<TrafficEvent[]>([]);

  // Password change modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Stock filtering
  const [selectedPackageFilter, setSelectedPackageFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'AVAILABLE' | 'SOLD'>('all');

  // Single Stock Form
  const [isSingleStockModalOpen, setIsSingleStockModalOpen] = useState(false);
  const [singleStockForm, setSingleStockForm] = useState({
    packageId: '',
    url: '',
    username: '',
    password: '',
    notes: '',
  });

  // Bulk Import Form
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkPackageId, setBulkPackageId] = useState('');
  const [bulkRawText, setBulkRawText] = useState('');
  const [bulkResult, setBulkResult] = useState<{ added: number; errors: string[] } | null>(null);

  // Package Form (Add / Edit)
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    ram: 3,
    ramUnit: 'GB',
    price: 1000,
    cpu: '130% CPU',
    disk: '5 GB NVMe',
    description: '',
    active: true,
  });

  // Masked passwords visibility in stock list
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const notify = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper fetch with admin token
  const adminFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      'x-admin-token': token,
      ...(options.headers || {}),
    };
    return fetch(url, { ...options, headers });
  };

  // Load all admin data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [resStats, resPkgs, resStocks, resOrders] = await Promise.all([
        adminFetch('/api/admin/stats'),
        adminFetch('/api/admin/packages'),
        adminFetch('/api/admin/stocks'),
        adminFetch('/api/admin/orders'),
      ]);

      if (resStats.ok) {
        const data = await resStats.json();
        setStats(data.stats);
        setTrafficEvents(data.traffic || []);
      }
      if (resPkgs.ok) {
        const data = await resPkgs.json();
        setPackages(data.packages || []);
        if (data.packages?.length > 0 && !singleStockForm.packageId) {
          setSingleStockForm((prev) => ({ ...prev, packageId: data.packages[0].id }));
          setBulkPackageId(data.packages[0].id);
        }
      }
      if (resStocks.ok) {
        const data = await resStocks.json();
        setStocks(data.stocks || []);
      }
      if (resOrders.ok) {
        const data = await resOrders.json();
        setOrders(data.orders || []);
      }
    } catch (err: any) {
      notify('error', 'Gagal memuat data admin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 15000); // Polling every 15s for live monitoring
    return () => clearInterval(interval);
  }, []);

  // Handler: Add Single Stock
  const handleAddSingleStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStockForm.packageId || !singleStockForm.url || !singleStockForm.username || !singleStockForm.password) {
      notify('error', 'Semua field wajib diisi');
      return;
    }

    try {
      const res = await adminFetch('/api/admin/stocks/single', {
        method: 'POST',
        body: JSON.stringify(singleStockForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify('success', '1 Stok berhasil ditambahkan');
      setIsSingleStockModalOpen(false);
      setSingleStockForm({
        packageId: packages[0]?.id || '',
        url: '',
        username: '',
        password: '',
        notes: '',
      });
      loadAllData();
    } catch (err: any) {
      notify('error', err.message || 'Gagal menambahkan stok');
    }
  };

  // Handler: Bulk Import Stock
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkPackageId || !bulkRawText.trim()) {
      notify('error', 'Pilih paket dan isi data stok');
      return;
    }

    try {
      const res = await adminFetch('/api/admin/stocks/bulk', {
        method: 'POST',
        body: JSON.stringify({
          packageId: bulkPackageId,
          rawText: bulkRawText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBulkResult({ added: data.addedCount, errors: data.errors || [] });
      notify('success', `Berhasil mengimpor ${data.addedCount} stok!`);
      if (data.errors && data.errors.length === 0) {
        setBulkRawText('');
        setIsBulkModalOpen(false);
      }
      loadAllData();
    } catch (err: any) {
      notify('error', err.message || 'Gagal mengimpor stok');
    }
  };

  // Handler: Delete Stock
  const handleDeleteStock = async (id: string) => {
    if (!window.confirm('Hapus item stok ini dari database?')) return;
    try {
      const res = await adminFetch(`/api/admin/stocks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      notify('success', 'Stok berhasil dihapus');
      loadAllData();
    } catch {
      notify('error', 'Gagal menghapus stok');
    }
  };

  // Handler: Save Package (Create / Update)
  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingPackageId
        ? `/api/admin/packages/${editingPackageId}`
        : '/api/admin/packages';
      const method = editingPackageId ? 'PUT' : 'POST';

      const res = await adminFetch(endpoint, {
        method,
        body: JSON.stringify(packageForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify('success', editingPackageId ? 'Paket berhasil diperbarui' : 'Paket baru ditambahkan');
      setIsPackageModalOpen(false);
      setEditingPackageId(null);
      loadAllData();
    } catch (err: any) {
      notify('error', err.message || 'Gagal menyimpan paket');
    }
  };

  const handleEditPackageClick = (pkg: PanelPackage) => {
    setEditingPackageId(pkg.id);
    setPackageForm({
      name: pkg.name,
      ram: pkg.ram,
      ramUnit: pkg.ramUnit || 'GB',
      price: pkg.price,
      cpu: pkg.cpu,
      disk: pkg.disk,
      description: pkg.description,
      active: pkg.active,
    });
    setIsPackageModalOpen(true);
  };

  const handleTogglePackageActive = async (pkg: PanelPackage) => {
    try {
      await adminFetch(`/api/admin/packages/${pkg.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !pkg.active }),
      });
      notify('success', `Paket ${pkg.name} ${!pkg.active ? 'diaktifkan' : 'dinonaktifkan'}`);
      loadAllData();
    } catch {
      notify('error', 'Gagal mengubah status paket');
    }
  };

  // Filter stocks
  const filteredStocks = stocks.filter((s) => {
    const matchPkg = selectedPackageFilter === 'all' || s.packageId === selectedPackageFilter;
    const matchStatus = selectedStatusFilter === 'all' || s.status === selectedStatusFilter;
    return matchPkg && matchStatus;
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 4) {
      notify('error', 'Password baru minimal 4 karakter');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await adminFetch('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword: newPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      notify('success', 'Password admin berhasil diperbarui!');
      setIsPasswordModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      notify('error', err.message || 'Gagal memperbarui password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-400 font-bold">
              MASTER CONTROL CENTER
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-white tracking-tight">
            Dashboard Manajemen Vann Peterodycl
          </h1>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Ubah Sandi</span>
          </button>

          <button
            onClick={loadAllData}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/50 text-rose-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </div>

      {/* Global Admin Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs flex items-center space-x-2.5 border ${
            notification.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        <button
          onClick={() => setAdminTab('overview')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide whitespace-nowrap transition-all ${
            adminTab === 'overview'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard & Trafik</span>
        </button>

        <button
          onClick={() => setAdminTab('payments')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide whitespace-nowrap transition-all ${
            adminTab === 'payments'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span>Metode Pembayaran (DANA & QRIS)</span>
        </button>

        <button
          onClick={() => setAdminTab('packages')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide whitespace-nowrap transition-all ${
            adminTab === 'packages'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Kelola Paket ({packages.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('stocks')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide whitespace-nowrap transition-all ${
            adminTab === 'stocks'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Kelola Stok ({stocks.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('orders')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide whitespace-nowrap transition-all ${
            adminTab === 'orders'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Daftar Pesanan ({orders.length})</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW & TRAFFIC */}
      {adminTab === 'overview' && stats && (
        <div className="space-y-8">
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Stok */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-cyan-500/20">
              <span className="text-xs font-mono text-slate-400 block mb-1">Total Stok Panel</span>
              <div className="text-3xl font-black font-['Space_Grotesk'] text-white">
                {stats.totalStock}
              </div>
              <div className="mt-2 text-[11px] text-cyan-400/80 font-mono">
                {stats.availableStock} Siap Pakai &bull; {stats.soldStock} Terjual
              </div>
            </div>

            {/* Stok Terjual */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-cyan-500/20">
              <span className="text-xs font-mono text-slate-400 block mb-1">Stok Terjual</span>
              <div className="text-3xl font-black font-['Space_Grotesk'] text-emerald-400">
                {stats.soldStock}
              </div>
              <div className="mt-2 text-[11px] text-slate-400 font-mono">
                Terdistribusi Otomatis
              </div>
            </div>

            {/* Total Pesanan */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-cyan-500/20">
              <span className="text-xs font-mono text-slate-400 block mb-1">Total Pesanan Sukses</span>
              <div className="text-3xl font-black font-['Space_Grotesk'] text-cyan-300">
                {stats.totalOrders}
              </div>
              <div className="mt-2 text-[11px] text-slate-400 font-mono">
                Dari {orders.length} Transaksi Masuk
              </div>
            </div>

            {/* Total Pendapatan */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-cyan-500/20">
              <span className="text-xs font-mono text-slate-400 block mb-1">Total Pendapatan</span>
              <div className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                {formatRupiah(stats.totalRevenue)}
              </div>
              <div className="mt-2 text-[11px] text-emerald-400/80 font-mono">
                Pendapatan Kas Toko
              </div>
            </div>
          </div>

          {/* Real-time Traffic and User Monitoring */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Activity Stream */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#090e1c] border border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
                    Trafik & Aktivitas Pengguna Real-Time
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">
                    {stats.activeVisitors} Pengunjung Aktif
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {trafficEvents.length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center">
                    Belum ada rekaman aktivitas trafik terbaru.
                  </div>
                ) : (
                  trafficEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            ev.type === 'payment_success'
                              ? 'bg-emerald-400'
                              : ev.type === 'create_order'
                              ? 'bg-cyan-400'
                              : 'bg-slate-500'
                          }`}
                        />
                        <span className="text-slate-300">{ev.details}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">
                        {formatDate(ev.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stock Summary by Package */}
            <div className="p-6 rounded-2xl bg-[#090e1c] border border-cyan-500/20">
              <div className="flex items-center space-x-2 mb-4">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="font-['Space_Grotesk'] text-base font-bold text-white">
                  Stok Per Paket
                </h3>
              </div>

              <div className="space-y-3">
                {packages.map((pkg) => {
                  const available = stocks.filter((s) => s.packageId === pkg.id && s.status === 'AVAILABLE').length;
                  const sold = stocks.filter((s) => s.packageId === pkg.id && s.status === 'SOLD').length;
                  return (
                    <div
                      key={pkg.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-white">{pkg.name}</div>
                        <div className="text-[11px] text-cyan-400">{formatRupiah(pkg.price)}</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            available > 0
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {available > 0 ? `${available} Siap` : 'HABIS'}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          {sold} Terjual
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA PAKET */}
      {adminTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
              Kelola Paket Pterodactyl
            </h2>
            <button
              onClick={() => {
                setEditingPackageId(null);
                setPackageForm({
                  name: 'Panel 9GB',
                  ram: 9,
                  ramUnit: 'GB',
                  price: 7000,
                  cpu: '280% CPU',
                  disk: '25 GB NVMe',
                  description: 'Paket server berkapasitas besar untuk project khusus.',
                  active: true,
                });
                setIsPackageModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#060a14] bg-cyan-400 hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Paket Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => {
              const stockAvailable = stocks.filter((s) => s.packageId === pkg.id && s.status === 'AVAILABLE').length;
              return (
                <div
                  key={pkg.id}
                  className="p-5 rounded-2xl bg-[#090e1c] border border-cyan-500/20 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-semibold text-cyan-400">
                        {pkg.ram} {pkg.ramUnit} RAM
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          pkg.active
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {pkg.active ? 'AKTIF' : 'NONAKTIF'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                    <div className="text-xl font-extrabold text-cyan-300 my-1">
                      {formatRupiah(pkg.price)}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {pkg.description || '-'}
                    </p>

                    <div className="text-xs space-y-1 font-mono text-slate-300 py-2 border-y border-slate-800">
                      <div>CPU: {pkg.cpu}</div>
                      <div>Disk: {pkg.disk}</div>
                      <div>Stok Tersedia: <strong className="text-emerald-400">{stockAvailable}</strong></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-4 mt-2">
                    <button
                      onClick={() => handleEditPackageClick(pkg)}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleTogglePackageActive(pkg)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        pkg.active
                          ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:bg-amber-900/50'
                          : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50'
                      }`}
                    >
                      {pkg.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: KELOLA STOK */}
      {adminTab === 'stocks' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
                Kelola Stok Akun Panel
              </h2>
              <p className="text-xs text-slate-400">
                Total {stocks.length} stok ({stocks.filter((s) => s.status === 'AVAILABLE').length} tersedia,{' '}
                {stocks.filter((s) => s.status === 'SOLD').length} terjual)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSingleStockModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Stok Manual</span>
              </button>

              <button
                id="btn-import-bulk-stock"
                onClick={() => {
                  setBulkResult(null);
                  setIsBulkModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#060a14] bg-cyan-400 hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Import Banyak Stok Sekaligus</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-mono">Filter Paket:</span>
              <select
                value={selectedPackageFilter}
                onChange={(e) => setSelectedPackageFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Semua Paket</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-mono">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-cyan-400"
              >
                <option value="all">Semua Status</option>
                <option value="AVAILABLE">Tersedia (Ready)</option>
                <option value="SOLD">Terjual</option>
              </select>
            </div>

            <div className="ml-auto text-slate-400 text-xs font-mono">
              Menampilkan {filteredStocks.length} stok
            </div>
          </div>

          {/* Stock Table */}
          <div className="overflow-x-auto rounded-2xl border border-cyan-500/20 bg-[#090e1c]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase">
                <tr>
                  <th className="py-3 px-4">Paket</th>
                  <th className="py-3 px-4">URL Panel</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Password</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Order ID / Waktu</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Tidak ada stok yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => {
                    const pkg = packages.find((p) => p.id === stock.packageId);
                    const isPassVisible = !!visiblePasswords[stock.id];
                    return (
                      <tr key={stock.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white">{pkg?.name || stock.packageId}</span>
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={stock.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline flex items-center space-x-1"
                          >
                            <span className="truncate max-w-[150px]">{stock.url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </td>
                        <td className="py-3 px-4 text-slate-200 font-bold">{stock.username}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-emerald-400">
                              {isPassVisible ? stock.password : '••••••••'}
                            </span>
                            <button
                              onClick={() =>
                                setVisiblePasswords((prev) => ({
                                  ...prev,
                                  [stock.id]: !prev[stock.id],
                                }))
                              }
                              className="p-1 hover:text-white text-slate-400"
                              title={isPassVisible ? 'Sembunyikan' : 'Lihat password'}
                            >
                              {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {stock.status === 'AVAILABLE' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                              TERSEDIA
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/30">
                              TERJUAL
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {stock.assignedOrderId ? (
                            <span className="text-cyan-300 font-bold">{stock.assignedOrderId}</span>
                          ) : (
                            formatDate(stock.createdAt)
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => {
                                copyToClipboard(`${stock.url} | ${stock.username} | ${stock.password}`);
                                notify('success', 'Data stok disalin ke clipboard');
                              }}
                              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                              title="Salin Data"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteStock(stock.id)}
                              className="p-1.5 rounded hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                              title="Hapus Stok"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DAFTAR PESANAN */}
      {adminTab === 'orders' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">
              Riwayat Pesanan Pelanggan
            </h2>
            <p className="text-xs text-slate-400">
              Total {orders.length} transaksi masuk dalam sistem.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-cyan-500/20 bg-[#090e1c]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">ID Pesanan</th>
                  <th className="py-3 px-4">Pembeli</th>
                  <th className="py-3 px-4">Paket</th>
                  <th className="py-3 px-4">Nominal</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Panel Dikirim</th>
                  <th className="py-3 px-4">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Belum ada transaksi pesanan.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-bold text-cyan-300">{o.id}</td>
                      <td className="py-3 px-4 text-white">
                        <div>{o.buyerName}</div>
                        <div className="text-[10px] text-slate-500">{o.buyerContact}</div>
                      </td>
                      <td className="py-3 px-4">{o.packageName}</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{formatRupiah(o.price)}</td>
                      <td className="py-3 px-4 uppercase text-slate-400">{o.paymentMethod}</td>
                      <td className="py-3 px-4">
                        {o.paymentStatus === 'PAID' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            LUNAS
                          </span>
                        ) : o.paymentStatus === 'PENDING' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                            PENDING
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-500/30">
                            {o.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {o.deliveredPanel ? (
                          <div className="text-[11px]">
                            <span className="text-white font-bold">{o.deliveredPanel.username}</span>
                            <span className="text-slate-500 block">{o.deliveredPanel.url}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[10px]">
                        {formatDate(o.paidAt || o.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PENGATURAN PEMBAYARAN & UPLOAD QRIS */}
      {adminTab === 'payments' && (
        <PaymentSettingsTab
          token={token}
          onSuccessNotification={(msg) => notify('success', msg)}
          onErrorNotification={(msg) => notify('error', msg)}
        />
      )}

      {/* MODAL: BULK IMPORT STOCKS */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0a0f1e] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                Import Banyak Stok Sekaligus
              </h3>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Pilih Paket Tujuan
                </label>
                <select
                  value={bulkPackageId}
                  onChange={(e) => setBulkPackageId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.ram}GB - {formatRupiah(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Format: <span className="text-cyan-400">URL | Username | Password</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">1 Baris = 1 Akun Stok</span>
                </div>
                <textarea
                  rows={8}
                  value={bulkRawText}
                  onChange={(e) => setBulkRawText(e.target.value)}
                  placeholder={`Contoh:\nhttps://panel.example.com | user001 | pass001\nhttps://panel.example.com | user002 | pass002\nhttps://panel.example.com | user003 | pass003`}
                  className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Sample preview info */}
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-300 space-y-1">
                <div className="font-bold">Tips Import Cepat:</div>
                <p>
                  Sistem otomatis mengenali pemisah pipa (|) dan spasi. Masukkan ratusan akun sekaligus tanpa batas.
                </p>
              </div>

              {bulkResult && bulkResult.errors.length > 0 && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-300 max-h-36 overflow-y-auto space-y-1 font-mono">
                  <div className="font-bold">Ditemukan kendala:</div>
                  {bulkResult.errors.map((err, idx) => (
                    <div key={idx}>{err}</div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#060a14] bg-cyan-400 hover:bg-cyan-300 transition-colors"
                >
                  Simpan Semua Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SINGLE STOCK */}
      {isSingleStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0a0f1e] border border-cyan-500/40 rounded-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                Tambah Stok Manual
              </h3>
              <button
                onClick={() => setIsSingleStockModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSingleStock} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Paket</label>
                <select
                  value={singleStockForm.packageId}
                  onChange={(e) => setSingleStockForm({ ...singleStockForm, packageId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">URL Panel</label>
                <input
                  type="text"
                  required
                  value={singleStockForm.url}
                  onChange={(e) => setSingleStockForm({ ...singleStockForm, url: e.target.value })}
                  placeholder="https://panel.vannpeterodycl.net"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={singleStockForm.username}
                  onChange={(e) => setSingleStockForm({ ...singleStockForm, username: e.target.value })}
                  placeholder="user_3gb_01"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={singleStockForm.password}
                  onChange={(e) => setSingleStockForm({ ...singleStockForm, password: e.target.value })}
                  placeholder="Password123!"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Catatan / Port</label>
                <input
                  type="text"
                  value={singleStockForm.notes}
                  onChange={(e) => setSingleStockForm({ ...singleStockForm, notes: e.target.value })}
                  placeholder="Port: 25565"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSingleStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-[#060a14] bg-cyan-400 hover:bg-cyan-300"
                >
                  Simpan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PACKAGE */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#0a0f1e] border border-cyan-500/40 rounded-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                {editingPackageId ? 'Edit Paket Panel' : 'Tambah Paket Baru'}
              </h3>
              <button
                onClick={() => setIsPackageModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Nama Paket</label>
                <input
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  placeholder="Panel 3GB"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">RAM (GB)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={packageForm.ram}
                    onChange={(e) => setPackageForm({ ...packageForm, ram: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={500}
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">CPU Limit</label>
                  <input
                    type="text"
                    value={packageForm.cpu}
                    onChange={(e) => setPackageForm({ ...packageForm, cpu: e.target.value })}
                    placeholder="150% CPU"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 uppercase mb-1">Disk NVMe</label>
                  <input
                    type="text"
                    value={packageForm.disk}
                    onChange={(e) => setPackageForm({ ...packageForm, disk: e.target.value })}
                    placeholder="10 GB"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Deskripsi Paket</label>
                <textarea
                  rows={2}
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  placeholder="Keterangan kegunaan paket..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-pkg-active"
                  checked={packageForm.active}
                  onChange={(e) => setPackageForm({ ...packageForm, active: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
                />
                <label htmlFor="chk-pkg-active" className="text-slate-300 font-medium cursor-pointer">
                  Paket Aktif & Ditampilkan di Toko
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-[#060a14] bg-cyan-400 hover:bg-cyan-300"
                >
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UBAH SANDI ADMIN */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0a0f1e] border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.25)] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                  Ubah Kata Sandi Admin
                </h3>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru (min. 4 karakter)"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Sandi ini akan disimpan aman dan digunakan untuk login admin berikutnya.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#060a14] bg-amber-400 hover:bg-amber-300 disabled:opacity-50 transition-colors"
                >
                  {isChangingPassword ? 'Menyimpan...' : 'Simpan Sandi Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
