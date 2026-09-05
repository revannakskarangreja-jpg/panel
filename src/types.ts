export interface PanelPackage {
  id: string;
  name: string;
  ram: number;
  ramUnit: string;
  price: number;
  description: string;
  cpu: string;
  disk: string;
  active: boolean;
  orderIndex: number;
  stockCount?: number;
}

export interface StockItem {
  id: string;
  packageId: string;
  url: string;
  username: string;
  password: string;
  notes?: string;
  status: 'AVAILABLE' | 'SOLD';
  assignedOrderId?: string;
  createdAt: string;
  soldAt?: string;
}

export interface DeliveredPanel {
  url: string;
  username: string;
  password: string;
  notes?: string;
}

export interface Order {
  id: string;
  packageId: string;
  packageName: string;
  price: number;
  buyerName: string;
  buyerContact: string;
  paymentMethod: 'qris' | 'dana' | 'gopay' | 'bca' | 'seabank';
  paymentStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  orderStatus: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  createdAt: string;
  paidAt?: string;
  deliveredPanel?: DeliveredPanel;
  failureReason?: string;
}

export interface AdminStats {
  totalStock: number;
  availableStock: number;
  soldStock: number;
  totalOrders: number;
  totalRevenue: number;
  activeVisitors: number;
  todayVisits: number;
}

export interface TrafficEvent {
  id: string;
  timestamp: string;
  type: 'visit' | 'view_package' | 'create_order' | 'payment_success' | 'check_order';
  details: string;
  ip?: string;
}

export interface PaymentSettings {
  qrisImageUrl: string;
  qrisStoreName: string;
  qrisNmid: string;
  danaNumber: string;
  danaName: string;
  gopayNumber: string;
  gopayName: string;
  bankName: string;
  bankNumber: string;
  bankHolder: string;
  instructionText: string;
}

export interface StoreData {
  packages: PanelPackage[];
  stocks: StockItem[];
  orders: Order[];
  traffic: TrafficEvent[];
  adminSecret: string;
  paymentSettings?: PaymentSettings;
}
