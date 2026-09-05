import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { store } from './server/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow larger payload for uploading QRIS image in base64
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Simple token-based admin protection
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers['x-admin-token'] || req.headers.authorization?.replace('Bearer ', '');
    if (token === 'admin123' || (typeof token === 'string' && store.verifyAdmin(token))) {
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized: Admin access required' });
  };

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', store: 'VANN PETERODYCL' });
  });

  // PUBLIC: Get active payment settings (QRIS Image, DANA, GoPay, Bank)
  app.get('/api/payment-settings', (req, res) => {
    try {
      const settings = store.getPaymentSettings();
      res.json({ settings });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Traffic heartbeat
  app.post('/api/traffic/ping', (req, res) => {
    const { action, path: pagePath } = req.body || {};
    store.recordTraffic('visit', `${action || 'Pengunjung aktif'} di ${pagePath || '/'}`);
    res.json({ status: 'recorded' });
  });

  // PUBLIC: Get active packages with computed stock count (SECURE: NO PASSWORDS)
  app.get('/api/packages', (req, res) => {
    try {
      const packages = store.getPublicPackages();
      res.json({ packages });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUBLIC: Create order (Buyer checkout initiated)
  app.post('/api/orders', (req, res) => {
    try {
      const { packageId, buyerName, buyerContact, paymentMethod } = req.body;
      if (!packageId || !buyerName || !paymentMethod) {
        return res.status(400).json({ error: 'Mohon lengkapi paket, nama pembeli, dan metode pembayaran' });
      }

      const result = store.createOrder({
        packageId,
        buyerName,
        buyerContact: buyerContact || '-',
        paymentMethod,
      });

      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({ order: result.order });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUBLIC: Get order details by ID (For Check Order page & confirmation)
  app.get('/api/orders/:orderId', (req, res) => {
    try {
      const { orderId } = req.params;
      const order = store.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan dengan ID tersebut' });
      }
      res.json({ order });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUBLIC / PAYMENT CALLBACK: Atomically confirm payment & allocate stock
  app.post('/api/orders/:orderId/pay', async (req, res) => {
    try {
      const { orderId } = req.params;
      const result = await store.processPaymentAtomic(orderId);
      if (!result.success) {
        return res.status(400).json({ error: result.error, order: result.order });
      }
      res.json({ success: true, order: result.order });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUBLIC: Cancel pending order
  app.post('/api/orders/:orderId/cancel', (req, res) => {
    try {
      const { orderId } = req.params;
      const cancelled = store.cancelOrder(orderId);
      if (!cancelled) {
        return res.status(400).json({ error: 'Tidak dapat membatalkan pesanan ini' });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Login
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (store.verifyAdmin(password)) {
      return res.json({ success: true, token: 'admin123' });
    }
    return res.status(401).json({ error: 'Password admin salah' });
  });

  // ADMIN: Stats & Traffic
  app.get('/api/admin/stats', requireAdmin, (req, res) => {
    try {
      const stats = store.getAdminStats();
      const traffic = store.getRecentTraffic();
      res.json({ stats, traffic });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Get all packages (including inactive)
  app.get('/api/admin/packages', requireAdmin, (req, res) => {
    try {
      const packages = store.getAllPackages();
      res.json({ packages });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Create package
  app.post('/api/admin/packages', requireAdmin, (req, res) => {
    try {
      const { name, ram, ramUnit, price, description, cpu, disk, active } = req.body;
      if (!name || !ram || price === undefined) {
        return res.status(400).json({ error: 'Nama, RAM, dan harga wajib diisi' });
      }

      const pkg = store.createPackage({
        name,
        ram: Number(ram),
        ramUnit: ramUnit || 'GB',
        price: Number(price),
        description: description || '',
        cpu: cpu || '150% CPU',
        disk: disk || '10 GB NVMe',
        active: active !== false,
        orderIndex: 99,
      });

      res.status(201).json({ package: pkg });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Update package
  app.put('/api/admin/packages/:id', requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const updated = store.updatePackage(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Paket tidak ditemukan' });
      }
      res.json({ package: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Delete package
  app.delete('/api/admin/packages/:id', requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const deleted = store.deletePackage(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Paket tidak ditemukan' });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Get stocks
  app.get('/api/admin/stocks', requireAdmin, (req, res) => {
    try {
      const { packageId, status } = req.query;
      const stocks = store.getStocks(
        packageId ? String(packageId) : undefined,
        status ? (String(status) as 'AVAILABLE' | 'SOLD') : undefined,
      );
      res.json({ stocks });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Add single stock
  app.post('/api/admin/stocks/single', requireAdmin, (req, res) => {
    try {
      const { packageId, url, username, password, notes } = req.body;
      if (!packageId || !url || !username || !password) {
        return res.status(400).json({ error: 'Paket, URL, Username, dan Password wajib diisi' });
      }

      const stock = store.addSingleStock({
        packageId,
        url,
        username,
        password,
        notes,
      });

      res.status(201).json({ stock });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Bulk import stocks ("URL | Username | Password")
  app.post('/api/admin/stocks/bulk', requireAdmin, (req, res) => {
    try {
      const { packageId, rawText } = req.body;
      if (!packageId || !rawText) {
        return res.status(400).json({ error: 'Pilih paket dan masukkan data teks stok' });
      }

      const result = store.importBulkStock(packageId, rawText);
      res.json({
        success: true,
        addedCount: result.addedCount,
        errors: result.errors,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Delete stock item
  app.delete('/api/admin/stocks/:id', requireAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const deleted = store.deleteStock(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Stok tidak ditemukan' });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Get all orders
  app.get('/api/admin/orders', requireAdmin, (req, res) => {
    try {
      const orders = store.getAllOrders();
      res.json({ orders });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Get payment settings
  app.get('/api/admin/payment-settings', requireAdmin, (req, res) => {
    try {
      const settings = store.getPaymentSettings();
      res.json({ settings });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Update payment settings (Upload QRIS image in base64, DANA, GoPay, Bank)
  app.post('/api/admin/payment-settings', requireAdmin, (req, res) => {
    try {
      const updated = store.updatePaymentSettings(req.body);
      store.recordTraffic('visit', 'Admin memperbarui pengaturan pembayaran & QRIS');
      res.json({ success: true, settings: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ADMIN: Change Admin Password
  app.post('/api/admin/change-password', requireAdmin, (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
        return res.status(400).json({ error: 'Password baru minimal 4 karakter' });
      }
      const success = store.updateAdminPassword(newPassword.trim());
      if (!success) {
        return res.status(400).json({ error: 'Gagal mengubah password' });
      }
      store.recordTraffic('visit', 'Admin mengubah password akun');
      res.json({ success: true, message: 'Password admin berhasil diubah!' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VANN PETERODYCL] Server ready on http://0.0.0.0:${PORT}`);
  });
}

startServer();
