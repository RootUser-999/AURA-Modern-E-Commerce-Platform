import fs from 'node:fs';
import path from 'node:path';
import {
  Product,
  Category,
  User,
  Order,
  InventoryMovement,
  Coupon,
  Review,
  StoreSettings,
} from './types.ts';
import {
  initialCategories,
  initialProducts,
  initialUsers,
  initialOrders,
  initialInventoryMovements,
  initialCoupons,
  initialReviews,
  initialStoreSettings,
} from './seedData.ts';

export interface DatabaseSchema {
  products: Product[];
  categories: Category[];
  users: User[];
  orders: Order[];
  inventoryMovements: InventoryMovement[];
  coupons: Coupon[];
  reviews: Review[];
  wishlists: Record<string, string[]>; // userId -> productIds[]
  cartStore: Record<string, { productId: string; quantity: number }[]>; // sessionId/userId -> items
  settings: StoreSettings;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  private data: DatabaseSchema;
  private writeLock: Promise<void> = Promise.resolve();

  constructor() {
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all required collections exist
        if (parsed.products && parsed.orders && parsed.users) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[DB] Failed reading cached db.json, generating fresh seed:', err);
    }

    const fresh: DatabaseSchema = {
      products: JSON.parse(JSON.stringify(initialProducts)),
      categories: JSON.parse(JSON.stringify(initialCategories)),
      users: JSON.parse(JSON.stringify(initialUsers)),
      orders: JSON.parse(JSON.stringify(initialOrders)),
      inventoryMovements: JSON.parse(JSON.stringify(initialInventoryMovements)),
      coupons: JSON.parse(JSON.stringify(initialCoupons)),
      reviews: JSON.parse(JSON.stringify(initialReviews)),
      wishlists: {
        'usr-001': ['prod-003', 'prod-005'],
        'usr-002': ['prod-001', 'prod-004'],
      },
      cartStore: {},
      settings: JSON.parse(JSON.stringify(initialStoreSettings)),
    };

    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(fresh, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed writing initial db.json:', e);
    }

    return fresh;
  }

  public async save(): Promise<void> {
    this.writeLock = this.writeLock.then(async () => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        await fs.promises.writeFile(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (err) {
        console.error('[DB] Error saving data file:', err);
      }
    });
    return this.writeLock;
  }

  public resetSeed(): void {
    this.data = {
      products: JSON.parse(JSON.stringify(initialProducts)),
      categories: JSON.parse(JSON.stringify(initialCategories)),
      users: JSON.parse(JSON.stringify(initialUsers)),
      orders: JSON.parse(JSON.stringify(initialOrders)),
      inventoryMovements: JSON.parse(JSON.stringify(initialInventoryMovements)),
      coupons: JSON.parse(JSON.stringify(initialCoupons)),
      reviews: JSON.parse(JSON.stringify(initialReviews)),
      wishlists: {
        'usr-001': ['prod-003', 'prod-005'],
      },
      cartStore: {},
      settings: JSON.parse(JSON.stringify(initialStoreSettings)),
    };
    this.save();
  }

  // Getters
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProduct(idOrSlug: string): Product | undefined {
    return this.data.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  }

  public getCategories(): Category[] {
    return this.data.categories;
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public getOrders(): Order[] {
    return this.data.orders;
  }

  public getOrder(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  public getInventoryMovements(): InventoryMovement[] {
    return this.data.inventoryMovements;
  }

  public getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  public getCouponByCode(code: string): Coupon | undefined {
    return this.data.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
  }

  public getReviews(productId?: string): Review[] {
    if (productId) {
      return this.data.reviews.filter((r) => r.productId === productId);
    }
    return this.data.reviews;
  }

  public getSettings(): StoreSettings {
    return this.data.settings;
  }

  public getWishlist(userId: string): string[] {
    return this.data.wishlists[userId] || [];
  }

  // Mutations
  public async addProduct(product: Product): Promise<Product> {
    this.data.products.unshift(product);
    await this.save();
    return product;
  }

  public async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.save();
    return this.data.products[idx];
  }

  public async deleteProduct(id: string): Promise<boolean> {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    // Check if referenced by existing orders. If so, soft-archive to protect historical order data!
    const referencedInOrders = this.data.orders.some((o) => o.items.some((i) => i.productId === id));
    if (referencedInOrders) {
      this.data.products[idx].isActive = false;
      this.data.products[idx].updatedAt = new Date().toISOString();
    } else {
      this.data.products.splice(idx, 1);
    }
    await this.save();
    return true;
  }

  public async addUser(user: User): Promise<User> {
    this.data.users.push(user);
    await this.save();
    return user;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    await this.save();
    return this.data.users[idx];
  }

  // Stock Adjustment with automatic audit movement log
  public async adjustStock(
    productId: string,
    quantityChange: number,
    reason: InventoryMovement['reason'],
    performedBy: string,
    relatedOrderId?: string | null,
    notes?: string
  ): Promise<{ success: boolean; newStock?: number; error?: string }> {
    const product = this.getProduct(productId);
    if (!product) return { success: false, error: 'Product not found' };

    const newStock = product.stock + quantityChange;
    if (newStock < 0) {
      return { success: false, error: `Insufficient inventory. Available: ${product.stock}` };
    }

    product.stock = newStock;
    product.updatedAt = new Date().toISOString();

    const movement: InventoryMovement = {
      id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantityChange,
      stockAfter: newStock,
      reason,
      relatedOrderId: relatedOrderId || null,
      performedBy,
      notes,
      timestamp: new Date().toISOString(),
    };

    this.data.inventoryMovements.unshift(movement);
    await this.save();

    return { success: true, newStock };
  }

  // Atomic Checkout Transaction
  public async executeCheckoutTransaction(
    orderData: Omit<Order, 'id' | 'orderNumber' | 'inventoryDeducted' | 'inventoryRestored' | 'createdAt' | 'updatedAt' | 'statusHistory'>
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    // 1. Re-validate stock for every item atomically
    for (const item of orderData.items) {
      const prod = this.getProduct(item.productId);
      if (!prod) {
        return { success: false, error: `Product "${item.productName}" no longer exists.` };
      }
      if (!prod.isActive) {
        return { success: false, error: `Product "${prod.name}" is currently unavailable.` };
      }
      if (prod.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${prod.name}". Only ${prod.stock} unit(s) remaining.`,
        };
      }
    }

    // 2. Generate unique order number
    const orderNum = `AUR-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderId = `ord-${Date.now()}`;
    const now = new Date().toISOString();

    // 3. Deduct stock and write audit logs
    for (const item of orderData.items) {
      const prod = this.getProduct(item.productId)!;
      prod.stock -= item.quantity;
      prod.updatedAt = now;

      const movement: InventoryMovement = {
        id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        quantityChange: -item.quantity,
        stockAfter: prod.stock,
        reason: 'order_placed',
        relatedOrderId: orderId,
        performedBy: orderData.customerName || 'Customer Checkout',
        notes: `Order #${orderNum} confirmed`,
        timestamp: now,
      };
      this.data.inventoryMovements.unshift(movement);
    }

    // 4. Update coupon usage count if used
    if (orderData.couponCode) {
      const coupon = this.getCouponByCode(orderData.couponCode);
      if (coupon) {
        coupon.currentUsageCount += 1;
      }
    }

    // 5. Create Order
    const newOrder: Order = {
      ...orderData,
      id: orderId,
      orderNumber: orderNum,
      inventoryDeducted: true,
      inventoryRestored: false,
      statusHistory: [
        {
          status: orderData.status || 'pending',
          timestamp: now,
          note: 'Order successfully created',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.data.orders.unshift(newOrder);
    await this.save();

    return { success: true, order: newOrder };
  }

  // Update order status with idempotent inventory restoration on cancel/return
  public async updateOrderStatus(
    orderId: string,
    newStatus: Order['status'],
    performedBy: string,
    note?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    const order = this.getOrder(orderId);
    if (!order) return { success: false, error: 'Order not found' };

    const oldStatus = order.status;
    const now = new Date().toISOString();

    // Prevent duplicate cancellation or double inventory restoration
    if ((newStatus === 'cancelled' || newStatus === 'returned') && !order.inventoryRestored) {
      // Restore inventory for each item
      for (const item of order.items) {
        const prod = this.getProduct(item.productId);
        if (prod) {
          prod.stock += item.quantity;
          prod.updatedAt = now;

          const movement: InventoryMovement = {
            id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: prod.id,
            productName: prod.name,
            productSku: prod.sku,
            quantityChange: item.quantity,
            stockAfter: prod.stock,
            reason: newStatus === 'cancelled' ? 'order_cancelled' : 'order_returned',
            relatedOrderId: order.id,
            performedBy,
            notes: `Order #${order.orderNumber} ${newStatus}: stock restored`,
            timestamp: now,
          };
          this.data.inventoryMovements.unshift(movement);
        }
      }
      order.inventoryRestored = true;
    }

    order.status = newStatus;
    order.updatedAt = now;
    order.statusHistory.unshift({
      status: newStatus,
      timestamp: now,
      note: note || `Status transitioned from ${oldStatus} to ${newStatus}`,
      updatedBy: performedBy,
    });

    await this.save();
    return { success: true, order };
  }

  public async processRefund(
    orderId: string,
    performedBy: string,
    notes?: string
  ): Promise<{ success: boolean; order?: Order; error?: string }> {
    const order = this.getOrder(orderId);
    if (!order) return { success: false, error: 'Order not found' };

    if (order.paymentStatus === 'refunded') {
      return { success: false, error: 'Order has already been refunded.' };
    }

    order.paymentStatus = 'refunded';
    order.updatedAt = new Date().toISOString();
    order.internalNotes = (order.internalNotes ? order.internalNotes + '\n' : '') + `[Refund processed by ${performedBy}: ${notes || 'Manual refund'}]`;

    await this.save();
    return { success: true, order };
  }

  // Cart operations
  public getCart(sessionId: string): { productId: string; quantity: number }[] {
    return this.data.cartStore[sessionId] || [];
  }

  public async setCart(sessionId: string, items: { productId: string; quantity: number }[]): Promise<void> {
    this.data.cartStore[sessionId] = items;
    await this.save();
  }

  // Wishlist operations
  public async toggleWishlist(userId: string, productId: string): Promise<string[]> {
    if (!this.data.wishlists[userId]) {
      this.data.wishlists[userId] = [];
    }
    const list = this.data.wishlists[userId];
    const idx = list.indexOf(productId);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      list.push(productId);
    }
    await this.save();
    return list;
  }

  // Reviews
  public async addReview(review: Review): Promise<Review> {
    this.data.reviews.unshift(review);
    // Recalculate product rating
    const prodReviews = this.data.reviews.filter((r) => r.productId === review.productId);
    const avg = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
    const prod = this.getProduct(review.productId);
    if (prod) {
      prod.rating = parseFloat(avg.toFixed(1));
      prod.reviewCount = prodReviews.length;
    }
    await this.save();
    return review;
  }

  // Coupons
  public async addCoupon(coupon: Coupon): Promise<Coupon> {
    this.data.coupons.push(coupon);
    await this.save();
    return coupon;
  }

  public async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon | null> {
    const idx = this.data.coupons.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.coupons[idx] = { ...this.data.coupons[idx], ...updates };
    await this.save();
    return this.data.coupons[idx];
  }

  public async deleteCoupon(id: string): Promise<boolean> {
    const idx = this.data.coupons.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.data.coupons.splice(idx, 1);
    await this.save();
    return true;
  }

  // Store Settings
  public async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    this.data.settings = { ...this.data.settings, ...updates };
    await this.save();
    return this.data.settings;
  }
}

export const db = new Database();
