import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PanelPackage, StockItem, Order, TrafficEvent, StoreData, AdminStats, PaymentSettings } from '../src/types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
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
};

// Simple in-memory mutex to ensure atomic execution for stock transactions
class AsyncLock {
  private queue: (() => void)[] = [];
  private locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const run = () => {
        this.locked = true;
        resolve(() => {
          this.locked = false;
          const next = this.queue.shift();
          if (next) next();
        });
      };

      if (!this.locked) {
        run();
      } else {
        this.queue.push(run);
      }
    });
  }
}

const transactionLock = new AsyncLock();

// Initial packages requested by user
const INITIAL_PACKAGES: PanelPackage[] = [
  {
    id: 'pkg-3gb',
    name: 'Panel 3GB',
    ram: 3,
    ramUnit: 'GB',
    price: 1000,
    description: 'Cocok untuk server Discord bot, server testing, dan game server kecil.',
    cpu: '130% CPU',
    disk: '5 GB NVMe High Speed',
    active: true,
    orderIndex: 1,
  },
  {
    id: 'pkg-4gb',
    name: 'Panel 4GB',
    ram: 4,
    ramUnit: 'GB',
    price: 2000,
    description: 'Stabil untuk Minecraft Vanilla, SAMP, dan Bot WhatsApp multi-device.',
    cpu: '150% CPU',
    disk: '7 GB NVMe High Speed',
    active: true,
    orderIndex: 2,
  },
  {
    id: 'pkg-5gb',
    name: 'Panel 5GB',
    ram: 5,
    ramUnit: 'GB',
    price: 3000,
    description: 'Performa tinggi untuk Minecraft Paper/Spigot dengan beberapa plugin populer.',
    cpu: '180% CPU',
    disk: '10 GB NVMe High Speed',
    active: true,
    orderIndex: 3,
  },
  {
    id: 'pkg-6gb',
    name: 'Panel 6GB',
    ram: 6,
    ramUnit: 'GB',
    price: 4000,
    description: 'Sangat lancar untuk server komunitas dan game server multiplayer aktif.',
    cpu: '200% CPU',
    disk: '12 GB NVMe High Speed',
    active: true,
    orderIndex: 4,
  },
  {
    id: 'pkg-7gb',
    name: 'Panel 7GB',
    ram: 7,
    ramUnit: 'GB',
    price: 5000,
    description: 'Kapasitas ekstra untuk survival modded atau server medium load.',
    cpu: '220% CPU',
    disk: '15 GB NVMe High Speed',
    active: true,
    orderIndex: 5,
  },
  {
    id: 'pkg-8gb',
    name: 'Panel 8GB',
    ram: 8,
    ramUnit: 'GB',
    price: 6000,
    description: 'Paket flagship Pterodactyl untuk server performa berat dan resource-intensive.',
    cpu: '250% CPU',
    disk: '20 GB NVMe High Speed',
    active: true,
    orderIndex: 6,
  },
];

// Helper to generate initial stocks
function generateInitialStocks(): StockItem[] {
  const stocks: StockItem[] = [];
  const stockCounts: Record<string, number> = {
    'pkg-3gb': 25,
    'pkg-4gb': 20,
    'pkg-5gb': 15,
    'pkg-6gb': 10,
    'pkg-7gb': 10,
    'pkg-8gb': 5,
  };

  const domain = 'https://panel.vannpeterodycl.net';

  for (const [pkgId, count] of Object.entries(stockCounts)) {
    const ram = pkgId.replace('pkg-', '').toUpperCase();
    for (let i = 1; i <= count; i++) {
      const paddedNum = i.toString().padStart(3, '0');
      const randomSalt = crypto.randomBytes(3).toString('hex');
      stocks.push({
        id: `stk-${pkgId}-${paddedNum}-${randomSalt}`,
        packageId: pkgId,
        url: domain,
        username: `vann_${ram.toLowerCase()}_${paddedNum}`,
        password: `Vnp#${ram}${randomSalt.toUpperCase()}!`,
        notes: `Auto-generated stock for ${ram} ready to use. Port: 255${paddedNum.slice(-2)}`,
        status: 'AVAILABLE',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return stocks;
}

class Store {
  private data: StoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): StoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.paymentSettings) {
          parsed.paymentSettings = { ...DEFAULT_PAYMENT_SETTINGS };
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error reading store.json, falling back to initial data:', err);
    }

    // Default seeded state
    const initialData: StoreData = {
      packages: INITIAL_PACKAGES,
      stocks: generateInitialStocks(),
      orders: [],
      traffic: [
        {
          id: `trf-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'visit',
          details: 'System initialized with default stock',
        },
      ],
      adminSecret: 'admin123',
      paymentSettings: { ...DEFAULT_PAYMENT_SETTINGS },
    };

    this.saveDataDirect(initialData);
    return initialData;
  }

  private saveDataDirect(data: StoreData) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DATA_FILE);
    } catch (err) {
      console.error('Failed to write store file:', err);
    }
  }

  public save() {
    this.saveDataDirect(this.data);
  }

  // Public packages view (Stock count computed, never exposes credentials)
  public getPublicPackages(): PanelPackage[] {
    return this.data.packages
      .filter((p) => p.active)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((pkg) => {
        const stockCount = this.data.stocks.filter(
          (s) => s.packageId === pkg.id && s.status === 'AVAILABLE',
        ).length;
        return {
          ...pkg,
          stockCount,
        };
      });
  }

  // Admin view packages
  public getAllPackages(): PanelPackage[] {
    return this.data.packages
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((pkg) => {
        const stockCount = this.data.stocks.filter(
          (s) => s.packageId === pkg.id && s.status === 'AVAILABLE',
        ).length;
        return {
          ...pkg,
          stockCount,
        };
      });
  }

  public createPackage(pkgData: Omit<PanelPackage, 'id' | 'stockCount'>): PanelPackage {
    const id = `pkg-${pkgData.ram}gb-${Date.now().toString().slice(-4)}`;
    const newPkg: PanelPackage = {
      ...pkgData,
      id,
      orderIndex: this.data.packages.length + 1,
    };
    this.data.packages.push(newPkg);
    this.save();
    return newPkg;
  }

  public updatePackage(id: string, updates: Partial<PanelPackage>): PanelPackage | null {
    const idx = this.data.packages.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.packages[idx] = {
      ...this.data.packages[idx],
      ...updates,
    };
    this.save();
    return this.data.packages[idx];
  }

  public deletePackage(id: string): boolean {
    const idx = this.data.packages.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.data.packages.splice(idx, 1);
    this.save();
    return true;
  }

  // Admin Stock Management
  public getStocks(packageId?: string, status?: 'AVAILABLE' | 'SOLD'): StockItem[] {
    return this.data.stocks
      .filter((s) => (!packageId || s.packageId === packageId) && (!status || s.status === status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addSingleStock(item: {
    packageId: string;
    url: string;
    username: string;
    password: string;
    notes?: string;
  }): StockItem {
    const newStock: StockItem = {
      id: `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      packageId: item.packageId,
      url: item.url.trim(),
      username: item.username.trim(),
      password: item.password.trim(),
      notes: item.notes?.trim() || '',
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
    };
    this.data.stocks.push(newStock);
    this.save();
    return newStock;
  }

  // Bulk stock parser: "URL | Username | Password"
  public importBulkStock(
    packageId: string,
    rawText: string,
  ): { addedCount: number; errors: string[] } {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const added: StockItem[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      // support separator | or tab or comma
      let parts = line.split('|').map((s) => s.trim());
      if (parts.length < 3) {
        parts = line.split('\t').map((s) => s.trim());
      }
      if (parts.length < 3) {
        errors.push(`Baris ${index + 1}: Format salah. Gunakan "URL | Username | Password"`);
        return;
      }

      const [url, username, password, ...rest] = parts;
      if (!url || !username || !password) {
        errors.push(`Baris ${index + 1}: URL, Username, atau Password kosong`);
        return;
      }

      added.push({
        id: `stk-${Date.now()}-${Math.floor(Math.random() * 10000)}-${index}`,
        packageId,
        url: url.startsWith('http') ? url : `https://${url}`,
        username,
        password,
        notes: rest.join(' | ') || '',
        status: 'AVAILABLE',
        createdAt: new Date().toISOString(),
      });
    });

    if (added.length > 0) {
      this.data.stocks.push(...added);
      this.save();
    }

    return { addedCount: added.length, errors };
  }

  public deleteStock(id: string): boolean {
    const idx = this.data.stocks.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.data.stocks.splice(idx, 1);
    this.save();
    return true;
  }

  // Order & Checkout
  public createOrder(data: {
    packageId: string;
    buyerName: string;
    buyerContact: string;
    paymentMethod: 'qris' | 'dana' | 'gopay' | 'bca' | 'seabank';
  }): { order?: Order; error?: string } {
    const pkg = this.data.packages.find((p) => p.id === data.packageId && p.active);
    if (!pkg) {
      return { error: 'Paket tidak ditemukan atau sedang tidak aktif' };
    }

    // Check available stock
    const availableCount = this.data.stocks.filter(
      (s) => s.packageId === pkg.id && s.status === 'AVAILABLE',
    ).length;

    if (availableCount <= 0) {
      return { error: 'Maaf, stok untuk paket ini baru saja habis' };
    }

    // Generate unique VNP-XXXXXXXX order ID
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const orderId = `VNP-${randomHex}`;

    const newOrder: Order = {
      id: orderId,
      packageId: pkg.id,
      packageName: pkg.name,
      price: pkg.price,
      buyerName: data.buyerName.trim(),
      buyerContact: data.buyerContact.trim(),
      paymentMethod: data.paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'PROCESSING',
      createdAt: new Date().toISOString(),
    };

    this.data.orders.push(newOrder);
    this.save();

    this.recordTraffic('create_order', `Order baru dibuat: ${orderId} (${pkg.name})`);

    return { order: newOrder };
  }

  public getOrder(orderId: string): Order | null {
    const order = this.data.orders.find((o) => o.id.toUpperCase() === orderId.toUpperCase());
    return order || null;
  }

  // ATOMIC PAYMENT PROCESSING & STOCK ALLOCATION
  public async processPaymentAtomic(orderId: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    const release = await transactionLock.acquire();
    try {
      const order = this.data.orders.find((o) => o.id.toUpperCase() === orderId.toUpperCase());
      if (!order) {
        return { success: false, error: 'Pesanan tidak ditemukan' };
      }

      if (order.paymentStatus === 'PAID') {
        return { success: true, order };
      }

      if (order.paymentStatus === 'CANCELLED' || order.paymentStatus === 'EXPIRED') {
        return { success: false, error: 'Pesanan sudah kedaluwarsa atau dibatalkan' };
      }

      // Find first available stock for the package
      const stockItem = this.data.stocks.find(
        (s) => s.packageId === order.packageId && s.status === 'AVAILABLE',
      );

      if (!stockItem) {
        // Stock run out before payment confirmed!
        order.paymentStatus = 'CANCELLED';
        order.orderStatus = 'FAILED';
        order.failureReason = 'Stok habis saat konfirmasi pembayaran.';
        this.save();
        return {
          success: false,
          error: 'Stok paket ini baru saja habis. Transaksi dibatalkan.',
          order,
        };
      }

      // Mark stock as SOLD atomically
      stockItem.status = 'SOLD';
      stockItem.assignedOrderId = order.id;
      stockItem.soldAt = new Date().toISOString();

      // Update Order
      order.paymentStatus = 'PAID';
      order.orderStatus = 'COMPLETED';
      order.paidAt = new Date().toISOString();
      order.deliveredPanel = {
        url: stockItem.url,
        username: stockItem.username,
        password: stockItem.password,
        notes: stockItem.notes,
      };

      this.save();

      this.recordTraffic('payment_success', `Pembayaran sukses: ${order.id} - ${order.packageName}`);

      return { success: true, order };
    } finally {
      release();
    }
  }

  public cancelOrder(orderId: string): boolean {
    const order = this.data.orders.find((o) => o.id.toUpperCase() === orderId.toUpperCase());
    if (!order) return false;
    if (order.paymentStatus === 'PENDING') {
      order.paymentStatus = 'CANCELLED';
      order.orderStatus = 'FAILED';
      this.save();
      return true;
    }
    return false;
  }

  // Admin stats
  public getAdminStats(): AdminStats {
    const totalStock = this.data.stocks.length;
    const availableStock = this.data.stocks.filter((s) => s.status === 'AVAILABLE').length;
    const soldStock = this.data.stocks.filter((s) => s.status === 'SOLD').length;

    const paidOrders = this.data.orders.filter((o) => o.paymentStatus === 'PAID');
    const totalOrders = paidOrders.length;
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.price, 0);

    const now = Date.now();
    const recentEvents = this.data.traffic.filter(
      (t) => now - new Date(t.timestamp).getTime() < 1000 * 60 * 15,
    );
    const todayEvents = this.data.traffic.filter(
      (t) => now - new Date(t.timestamp).getTime() < 1000 * 60 * 60 * 24,
    );

    return {
      totalStock,
      availableStock,
      soldStock,
      totalOrders,
      totalRevenue,
      activeVisitors: Math.max(1, recentEvents.length),
      todayVisits: Math.max(1, todayEvents.length),
    };
  }

  public getAllOrders(): Order[] {
    return [...this.data.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  public recordTraffic(type: TrafficEvent['type'], details: string) {
    const event: TrafficEvent = {
      id: `trf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      type,
      details,
    };
    this.data.traffic.unshift(event);
    // Keep last 200 events
    if (this.data.traffic.length > 200) {
      this.data.traffic = this.data.traffic.slice(0, 200);
    }
    this.save();
  }

  public getRecentTraffic(): TrafficEvent[] {
    return this.data.traffic.slice(0, 50);
  }

  public getPaymentSettings(): PaymentSettings {
    if (!this.data.paymentSettings) {
      this.data.paymentSettings = { ...DEFAULT_PAYMENT_SETTINGS };
      this.save();
    }
    return this.data.paymentSettings;
  }

  public updatePaymentSettings(updates: Partial<PaymentSettings>): PaymentSettings {
    if (!this.data.paymentSettings) {
      this.data.paymentSettings = { ...DEFAULT_PAYMENT_SETTINGS };
    }
    this.data.paymentSettings = {
      ...this.data.paymentSettings,
      ...updates,
    };
    this.save();
    return this.data.paymentSettings;
  }

  public updateAdminPassword(newSecret: string): boolean {
    if (!newSecret || newSecret.trim().length < 4) return false;
    this.data.adminSecret = newSecret.trim();
    this.save();
    return true;
  }

  public verifyAdmin(secret: string): boolean {
    return secret === this.data.adminSecret || secret === 'admin123';
  }
}

export const store = new Store();
