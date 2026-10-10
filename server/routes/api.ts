import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { Product, Order, User, Coupon, Review, InventoryMovement } from '../types.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & CUSTOMER ACCOUNTS
// ==========================================

// Current session / mock auth token resolution helper
function getAuthenticatedUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (token.startsWith('user_')) {
    const userId = token.replace('user_', '');
    return db.getUserById(userId) || null;
  }
  if (token === 'admin_token') {
    return db.getUserById('usr-admin') || null;
  }
  return null;
}

// Register
apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, email, fullName, password, phone, address } = req.body;
    if (!username || !email || !fullName) {
      return res.status(400).json({ error: 'Username, email, and full name are required.' });
    }

    if (db.getUserByEmail(email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    if (db.getUserByUsername(username)) {
      return res.status(409).json({ error: 'This username is already taken.' });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      role: 'customer',
      phone: phone || '',
      address: address || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    await db.addUser(newUser);
    const token = `user_${newUser.id}`;
    return res.status(201).json({ user: newUser, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Customer Login
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername) {
      return res.status(400).json({ error: 'Email or username is required.' });
    }

    const user =
      db.getUserByEmail(emailOrUsername) || db.getUserByUsername(emailOrUsername);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated. Please contact support.' });
    }

    user.lastLogin = new Date().toISOString();
    await db.updateUser(user.id, { lastLogin: user.lastLogin });

    const token = user.role === 'admin' ? 'admin_token' : `user_${user.id}`;
    return res.json({ user, token });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Dedicated Admin Login (validates admin credentials: admin / root for demo)
apiRouter.post('/auth/admin-login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Explicit dev check for demo administrator (admin / root)
    if (username === 'admin' && (password === 'root' || password === 'admin123')) {
      const adminUser = db.getUserById('usr-admin') || {
        id: 'usr-admin',
        username: 'admin',
        email: 'admin@aurastudio.com',
        fullName: 'System Administrator',
        role: 'admin' as const,
        isActive: true,
        createdAt: '2026-08-01T08:00:00Z',
        lastLogin: new Date().toISOString(),
      };

      await db.updateUser('usr-admin', { lastLogin: new Date().toISOString() });
      return res.json({
        user: adminUser,
        token: 'admin_token',
        notice: 'Seeded admin credentials used. Please update default password in production.',
      });
    }

    return res.status(401).json({ error: 'Invalid administrator credentials.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Admin login failed' });
  }
});

// Me endpoint
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ user });
});

// Update Profile
apiRouter.put('/auth/profile', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { fullName, phone, address } = req.body;
  const updated = await db.updateUser(user.id, {
    fullName: fullName || user.fullName,
    phone: phone ?? user.phone,
    address: address ?? user.address,
  });
  return res.json({ user: updated });
});

// ==========================================
// 2. PRODUCTS & CATEGORIES
// ==========================================

// Get Categories
apiRouter.get('/categories', (req: Request, res: Response) => {
  const categories = db.getCategories();
  const products = db.getProducts();

  // Attach item count to each category
  const enriched = categories.map((c) => ({
    ...c,
    itemCount: products.filter((p) => p.category === c.id && p.isActive).length,
  }));
  return res.json({ categories: enriched });
});

// Get Products with filtering, search, sorting & pagination
apiRouter.get('/products', (req: Request, res: Response) => {
  let products = [...db.getProducts()];

  const {
    q,
    category,
    brand,
    minPrice,
    maxPrice,
    inStock,
    featured,
    sort,
    page = '1',
    limit = '24',
    includeInactive,
  } = req.query;

  // Filter active unless requested by admin
  if (includeInactive !== 'true') {
    products = products.filter((p) => p.isActive);
  }

  // Live text search across name, description, brand, SKU
  if (q && typeof q === 'string') {
    const query = q.toLowerCase().trim();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }

  // Category filter
  if (category && typeof category === 'string' && category !== 'all') {
    products = products.filter((p) => p.category === category || p.category.includes(category));
  }

  // Brand filter
  if (brand && typeof brand === 'string' && brand !== 'all') {
    products = products.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
  }

  // Price bounds
  if (minPrice) {
    const min = parseFloat(minPrice as string);
    if (!isNaN(min)) products = products.filter((p) => (p.salePrice ?? p.price) >= min);
  }
  if (maxPrice) {
    const max = parseFloat(maxPrice as string);
    if (!isNaN(max)) products = products.filter((p) => (p.salePrice ?? p.price) <= max);
  }

  // Availability / in-stock
  if (inStock === 'true') {
    products = products.filter((p) => p.stock > 0);
  }

  // Featured flag
  if (featured === 'true') {
    products = products.filter((p) => p.featured);
  }

  // Sorting
  switch (sort) {
    case 'price-low':
      products.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
      break;
    case 'price-high':
      products.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
      break;
    case 'rating':
      products.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
      products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'bestseller':
      products.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
      break;
    default:
      // Featured / default
      products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      break;
  }

  // Pagination
  const pageNum = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(limit as string, 10) || 24;
  const total = products.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginated = products.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  return res.json({
    products: paginated,
    total,
    page: pageNum,
    totalPages,
    limit: pageSize,
  });
});

// Single Product Details
apiRouter.get('/products/:idOrSlug', (req: Request, res: Response) => {
  const product = db.getProduct(req.params.idOrSlug);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const reviews = db.getReviews(product.id);
  const related = db
    .getProducts()
    .filter((p) => p.category === product.category && p.id !== product.id && p.isActive)
    .slice(0, 4);

  return res.json({ product, reviews, related });
});

// Admin Product CRUD: Add
apiRouter.post('/products', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  try {
    const {
      name,
      sku,
      description,
      shortDescription,
      price,
      salePrice,
      costPrice,
      stock,
      lowStockThreshold,
      category,
      brand,
      images,
      featured,
      isNewArrival,
      isBestseller,
      specifications,
    } = req.body;

    if (!name || price === undefined || stock === undefined || !category) {
      return res.status(400).json({ error: 'Name, price, stock, and category are required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const now = new Date().toISOString();

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      slug,
      sku: sku ? sku.trim().toUpperCase() : `AUR-${Math.floor(100 + Math.random() * 900)}`,
      description: description || '',
      shortDescription: shortDescription || '',
      price: parseFloat(price),
      salePrice: salePrice ? parseFloat(salePrice) : null,
      costPrice: costPrice ? parseFloat(costPrice) : parseFloat(price) * 0.5,
      stock: parseInt(stock, 10),
      lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
      category,
      brand: brand || 'AURA Studio',
      images: Array.isArray(images) && images.length > 0 ? images : ['/src/assets/images/hero_modern_lifestyle_1791623269890.jpg'],
      featured: !!featured,
      isNewArrival: !!isNewArrival,
      isBestseller: !!isBestseller,
      isActive: true,
      rating: 5.0,
      reviewCount: 0,
      specifications: specifications || {},
      createdAt: now,
      updatedAt: now,
    };

    await db.addProduct(newProduct);

    // Record initial inventory movement
    await db.adjustStock(
      newProduct.id,
      newProduct.stock,
      'initial_seed',
      user.fullName,
      null,
      'Initial stock entry upon product creation'
    );

    return res.status(201).json({ product: newProduct });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed creating product' });
  }
});

// Admin Product CRUD: Update
apiRouter.put('/products/:id', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  const { id } = req.params;
  const existing = db.getProduct(id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const stockBefore = existing.stock;
  const updated = await db.updateProduct(id, req.body);

  // If stock was directly updated through this form, record inventory movement
  if (req.body.stock !== undefined && req.body.stock !== stockBefore) {
    const diff = req.body.stock - stockBefore;
    await db.adjustStock(
      id,
      diff,
      'manual_adjustment',
      user.fullName,
      null,
      'Manual inventory update via product editor'
    );
  }

  return res.json({ product: updated });
});

// Admin Product CRUD: Delete / Archive
apiRouter.delete('/products/:id', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  const { id } = req.params;
  const success = await db.deleteProduct(id);
  if (!success) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  return res.json({ success: true, message: 'Product deleted or safely archived if tied to past orders.' });
});

// Export products to CSV
apiRouter.get('/products/export/csv', (req: Request, res: Response) => {
  const products = db.getProducts();
  const headers = ['id', 'name', 'sku', 'price', 'salePrice', 'stock', 'category', 'brand', 'isActive'];
  const rows = products.map((p) =>
    [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.price,
      p.salePrice ?? '',
      p.stock,
      p.category,
      `"${p.brand.replace(/"/g, '""')}"`,
      p.isActive,
    ].join(',')
  );
  const csvContent = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="aura_products.csv"');
  return res.send(csvContent);
});

// ==========================================
// 3. COUPONS & PROMOTIONS
// ==========================================

// Validate coupon code against cart subtotal
apiRouter.post('/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required.' });
  }

  const coupon = db.getCouponByCode(code);
  if (!coupon || !coupon.isActive) {
    return res.status(400).json({ error: 'Invalid or inactive promo code.' });
  }

  const now = new Date();
  if (now > new Date(coupon.endDate)) {
    return res.status(400).json({ error: 'This promo code has expired.' });
  }

  if (coupon.currentUsageCount >= coupon.maxUsageLimit) {
    return res.status(400).json({ error: 'This promo code has reached its maximum usage limit.' });
  }

  const cartAmount = parseFloat(subtotal) || 0;
  if (cartAmount < coupon.minOrderAmount) {
    return res.status(400).json({
      error: `Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} required for this code.`,
    });
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (cartAmount * coupon.discountValue) / 100;
  } else {
    discount = Math.min(coupon.discountValue, cartAmount);
  }

  return res.json({
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: parseFloat(discount.toFixed(2)),
  });
});

// Admin Coupon CRUD
apiRouter.get('/coupons', (req: Request, res: Response) => {
  return res.json({ coupons: db.getCoupons() });
});

apiRouter.post('/coupons', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  const { code, discountType, discountValue, minOrderAmount, maxUsageLimit, endDate } = req.body;
  if (!code || !discountValue) {
    return res.status(400).json({ error: 'Code and discount value are required.' });
  }

  const newCoupon: Coupon = {
    id: `cpn-${Date.now()}`,
    code: code.trim().toUpperCase(),
    discountType: discountType || 'percentage',
    discountValue: parseFloat(discountValue),
    minOrderAmount: parseFloat(minOrderAmount) || 0,
    maxUsageLimit: parseInt(maxUsageLimit, 10) || 100,
    currentUsageCount: 0,
    startDate: new Date().toISOString(),
    endDate: endDate || '2026-12-31T23:59:59Z',
    isActive: true,
  };

  await db.addCoupon(newCoupon);
  return res.status(201).json({ coupon: newCoupon });
});

apiRouter.put('/coupons/:id', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }
  const updated = await db.updateCoupon(req.params.id, req.body);
  return res.json({ coupon: updated });
});

apiRouter.delete('/coupons/:id', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }
  await db.deleteCoupon(req.params.id);
  return res.json({ success: true });
});

// ==========================================
// 4. CHECKOUT & ORDERS
// ==========================================

// Standard Checkout (Atomic inventory deduction & transaction)
apiRouter.post('/checkout', async (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      couponCode,
      shippingMethod,
      paymentMethod,
    } = req.body;

    if (!customerName || !customerEmail || !shippingAddress || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required order fields.' });
    }

    const settings = db.getSettings();
    const user = getAuthenticatedUser(req);

    // Calculate prices & verify stock on server-side
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = db.getProduct(item.productId);
      if (!prod) {
        return res.status(400).json({ error: `Product ID "${item.productId}" was not found.` });
      }
      if (!prod.isActive) {
        return res.status(400).json({ error: `Product "${prod.name}" is currently unavailable.` });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${prod.name}". Available: ${prod.stock}, requested: ${item.quantity}.`,
        });
      }

      const unitPrice = prod.salePrice ?? prod.price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      validatedItems.push({
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        productImage: prod.images[0] || '',
        unitPrice,
        quantity: item.quantity,
        lineTotal,
      });
    }

    // Server-side discount calculation
    let discount = 0;
    if (couponCode) {
      const coupon = db.getCouponByCode(couponCode);
      if (coupon && coupon.isActive && subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100;
        } else {
          discount = Math.min(coupon.discountValue, subtotal);
        }
      }
    }

    // Shipping cost calculation
    let shippingFee = 0;
    if (shippingMethod === 'express') {
      shippingFee = 25.00;
    } else {
      shippingFee = subtotal >= settings.freeShippingThreshold ? 0.00 : settings.standardShippingFee;
    }

    // Tax calculation
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = parseFloat(((taxableAmount * settings.taxRatePercent) / 100).toFixed(2));
    const grandTotal = parseFloat((taxableAmount + shippingFee + tax).toFixed(2));

    // Execute atomic checkout transaction
    const result = await db.executeCheckoutTransaction({
      userId: user ? user.id : null,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      shippingAddress,
      items: validatedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      couponCode: couponCode || null,
      shippingFee: parseFloat(shippingFee.toFixed(2)),
      shippingMethod: shippingMethod === 'express' ? 'Express Priority Courier' : 'Standard Carbon-Neutral Delivery',
      tax,
      total: grandTotal,
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      paymentMethod: paymentMethod || 'card',
      paymentReference: paymentMethod === 'cod' ? 'COD-VERIFIED' : `mock_pay_${Date.now()}`,
    });

    if (!result.success || !result.order) {
      return res.status(400).json({ error: result.error || 'Checkout failed.' });
    }

    return res.status(201).json({ success: true, order: result.order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'An unexpected error occurred during checkout.' });
  }
});

// Buy Now instant checkout
apiRouter.post('/buy-now', async (req: Request, res: Response) => {
  try {
    const { productId, quantity = 1, customerName, customerEmail, customerPhone, shippingAddress, paymentMethod } = req.body;
    if (!productId || !customerName || !customerEmail || !shippingAddress) {
      return res.status(400).json({ error: 'Missing required purchase details.' });
    }

    const prod = db.getProduct(productId);
    if (!prod) return res.status(404).json({ error: 'Product not found.' });
    if (!prod.isActive) return res.status(400).json({ error: 'Product is unavailable.' });
    if (prod.stock < quantity) {
      return res.status(400).json({ error: `Only ${prod.stock} unit(s) available in stock.` });
    }

    const settings = db.getSettings();
    const user = getAuthenticatedUser(req);
    const unitPrice = prod.salePrice ?? prod.price;
    const subtotal = unitPrice * quantity;
    const shippingFee = subtotal >= settings.freeShippingThreshold ? 0.00 : settings.standardShippingFee;
    const tax = parseFloat(((subtotal * settings.taxRatePercent) / 100).toFixed(2));
    const total = parseFloat((subtotal + shippingFee + tax).toFixed(2));

    const item = {
      id: `item-${Date.now()}`,
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      productImage: prod.images[0] || '',
      unitPrice,
      quantity,
      lineTotal: subtotal,
    };

    const result = await db.executeCheckoutTransaction({
      userId: user ? user.id : null,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '',
      shippingAddress,
      items: [item],
      subtotal,
      discount: 0,
      couponCode: null,
      shippingFee,
      shippingMethod: 'Express Courier',
      tax,
      total,
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
      paymentMethod: paymentMethod || 'card',
      paymentReference: `buynow_${Date.now()}`,
    });

    if (!result.success || !result.order) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({ success: true, order: result.order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// List Orders (customer sees their own; admin sees all)
apiRouter.get('/orders', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const { status, q, page = '1', limit = '20' } = req.query;

  let orders = [...db.getOrders()];

  // If customer, only show their orders or orders matching their email
  if (!user || user.role !== 'admin') {
    if (!user) {
      return res.status(401).json({ error: 'Authentication required to view orders.' });
    }
    orders = orders.filter((o) => o.userId === user.id || o.customerEmail.toLowerCase() === user.email.toLowerCase());
  }

  // Filter status
  if (status && typeof status === 'string' && status !== 'all') {
    orders = orders.filter((o) => o.status === status);
  }

  // Search by orderNumber, customerName, email
  if (q && typeof q === 'string') {
    const query = q.toLowerCase().trim();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName.toLowerCase().includes(query) ||
        o.customerEmail.toLowerCase().includes(query) ||
        o.items.some((i) => i.productName.toLowerCase().includes(query) || i.productSku.toLowerCase().includes(query))
    );
  }

  // Sort newest first
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(limit as string, 10) || 20;
  const total = orders.length;
  const paginated = orders.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  return res.json({ orders: paginated, total, page: pageNum, totalPages: Math.ceil(total / pageSize) });
});

// Single Order
apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrder(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin' && order.userId && order.userId !== user?.id && order.customerEmail !== user?.email) {
    return res.status(403).json({ error: 'Unauthorized to view this order.' });
  }
  return res.json({ order });
});

// Customer Cancel Order (restores inventory safely!)
apiRouter.post('/orders/:id/cancel', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const order = db.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  // Check permission
  if (user?.role !== 'admin' && order.userId !== user?.id && order.customerEmail !== user?.email) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  if (order.status === 'shipped' || order.status === 'delivered') {
    return res.status(400).json({ error: 'Cannot cancel an order that has already been dispatched or delivered.' });
  }

  if (order.status === 'cancelled') {
    return res.status(400).json({ error: 'Order is already cancelled.' });
  }

  const result = await db.updateOrderStatus(
    order.id,
    'cancelled',
    user?.fullName || 'Customer',
    'Customer cancelled order prior to dispatch; stock restored.'
  );

  return res.json({ success: true, order: result.order });
});

// Admin Update Order Status (handles fulfillment tracking and inventory restoration)
apiRouter.put('/orders/:id/status', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  const { status, carrier, trackingNumber, note, internalNotes } = req.body;
  const order = db.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  if (carrier !== undefined) order.carrier = carrier;
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  if (internalNotes !== undefined) order.internalNotes = internalNotes;

  if (status) {
    const result = await db.updateOrderStatus(order.id, status, user.fullName, note);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ order: result.order });
  }

  await db.save();
  return res.json({ order });
});

// Admin Process Refund
apiRouter.post('/orders/:id/refund', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  const { notes } = req.body;
  const result = await db.processRefund(req.params.id, user.fullName, notes);
  if (!result.success) return res.status(400).json({ error: result.error });

  return res.json({ success: true, order: result.order });
});

// Printable HTML Invoice
apiRouter.get('/orders/:id/invoice', (req: Request, res: Response) => {
  const order = db.getOrder(req.params.id);
  if (!order) return res.status(404).send('Order not found');
  const settings = db.getSettings();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${order.orderNumber} - ${settings.storeName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; }
    .meta { text-align: right; font-size: 14px; color: #555; }
    .details { display: flex; justify-content: space-between; margin: 30px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { text-align: left; padding: 10px; border-bottom: 1px solid #ddd; font-size: 13px; text-transform: uppercase; color: #666; }
    td { padding: 12px 10px; border-bottom: 1px solid #eee; font-size: 14px; }
    .totals { margin-top: 30px; text-align: right; }
    .totals table { width: 300px; margin-left: auto; }
    .total-row { font-size: 18px; font-weight: bold; border-top: 2px solid #000; }
    .footer { margin-top: 60px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
    @media print {
      body { margin: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #000; color: #fff; border: none; cursor: pointer; border-radius: 4px;">Print Invoice</button>
  </div>
  <div class="header">
    <div>
      <div class="logo">${settings.storeName}</div>
      <div style="font-size: 13px; color: #666; margin-top: 4px;">${settings.tagline}</div>
      <div style="font-size: 13px; color: #666;">${settings.contactEmail}</div>
    </div>
    <div class="meta">
      <h2 style="margin: 0 0 6px 0; color: #000;">INVOICE</h2>
      <div><strong>Order #:</strong> ${order.orderNumber}</div>
      <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
      <div><strong>Status:</strong> ${order.status.toUpperCase()}</div>
      <div><strong>Payment:</strong> ${order.paymentStatus.toUpperCase()} (${order.paymentMethod.toUpperCase()})</div>
    </div>
  </div>

  <div class="details">
    <div>
      <strong>Billed & Shipped To:</strong><br>
      ${order.customerName}<br>
      ${order.shippingAddress.street}<br>
      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}<br>
      ${order.shippingAddress.country}<br>
      Email: ${order.customerEmail}<br>
      Phone: ${order.customerPhone}
    </div>
    <div style="text-align: right;">
      <strong>Fulfillment Details:</strong><br>
      Shipping: ${order.shippingMethod}<br>
      ${order.trackingNumber ? `Tracking #: ${order.trackingNumber}<br>Carrier: ${order.carrier}` : 'Awaiting tracking assignment'}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th>SKU</th>
        <th style="text-align: right;">Price</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items
        .map(
          (item) => `
        <tr>
          <td><strong>${item.productName}</strong></td>
          <td>${item.productSku}</td>
          <td style="text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">$${item.lineTotal.toFixed(2)}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>Subtotal:</td>
        <td style="text-align: right;">$${order.subtotal.toFixed(2)}</td>
      </tr>
      ${
        order.discount > 0
          ? `<tr>
        <td>Discount (${order.couponCode || 'Promo'}):</td>
        <td style="text-align: right; color: #16a34a;">-$${order.discount.toFixed(2)}</td>
      </tr>`
          : ''
      }
      <tr>
        <td>Shipping:</td>
        <td style="text-align: right;">$${order.shippingFee.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Estimated Tax:</td>
        <td style="text-align: right;">$${order.tax.toFixed(2)}</td>
      </tr>
      <tr class="total-row">
        <td>Total Paid:</td>
        <td style="text-align: right;">$${order.total.toFixed(2)}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    Thank you for choosing ${settings.storeName}. All orders include 30-day returns and a 2-year warranty.<br>
    Questions? Contact support at ${settings.contactEmail}.
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

// ==========================================
// 5. INVENTORY & STOCK AUDIT LOGS
// ==========================================

// Get inventory movements
apiRouter.get('/inventory/movements', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  const { productId } = req.query;
  let movements = db.getInventoryMovements();
  if (productId && typeof productId === 'string') {
    movements = movements.filter((m) => m.productId === productId);
  }
  return res.json({ movements });
});

// Manual inventory adjustment
apiRouter.post('/inventory/adjust', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  const { productId, quantityChange, reason, notes } = req.body;
  if (!productId || quantityChange === undefined) {
    return res.status(400).json({ error: 'Product ID and quantity change are required.' });
  }

  const result = await db.adjustStock(
    productId,
    parseInt(quantityChange, 10),
    reason || 'manual_adjustment',
    user.fullName,
    null,
    notes || 'Manual admin inventory adjustment'
  );

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  return res.json({ success: true, newStock: result.newStock });
});

// ==========================================
// 6. ADMIN ANALYTICS & KPIS
// ==========================================

apiRouter.get('/admin/analytics', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  const orders = db.getOrders();
  const products = db.getProducts();
  const users = db.getUsers().filter((u) => u.role === 'customer');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  // Active revenue excludes cancelled and refunded orders
  const validOrders = orders.filter((o) => o.status !== 'cancelled' && o.paymentStatus !== 'refunded');

  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);

  const revenueToday = validOrders
    .filter((o) => new Date(o.createdAt).getTime() >= todayStart)
    .reduce((sum, o) => sum + o.total, 0);

  const revenue7d = validOrders
    .filter((o) => new Date(o.createdAt).getTime() >= sevenDaysAgo)
    .reduce((sum, o) => sum + o.total, 0);

  const revenue30d = validOrders
    .filter((o) => new Date(o.createdAt).getTime() >= thirtyDaysAgo)
    .reduce((sum, o) => sum + o.total, 0);

  const ordersAwaitingProcessing = orders.filter((o) => o.status === 'pending' || o.status === 'processing').length;
  const completedOrders = orders.filter((o) => o.status === 'delivered').length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const totalUnitsInStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold);
  const outOfStockProducts = products.filter((p) => p.stock === 0);

  const averageOrderValue = validOrders.length > 0 ? totalRevenue / validOrders.length : 0;

  // Daily revenue chart data for the last 14 days
  const dailyTrends: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = validOrders.filter((o) => o.createdAt.startsWith(dateStr));
    const dayRev = dayOrders.reduce((sum, o) => sum + o.total, 0);
    dailyTrends.push({
      date: dateStr.slice(5), // MM-DD
      revenue: parseFloat(dayRev.toFixed(2)),
      orders: dayOrders.length,
    });
  }

  // Sales by Category
  const categorySalesMap: Record<string, number> = {};
  for (const order of validOrders) {
    for (const item of order.items) {
      const prod = db.getProduct(item.productId);
      const catName = prod ? prod.category : 'General';
      categorySalesMap[catName] = (categorySalesMap[catName] || 0) + item.lineTotal;
    }
  }

  const salesByCategory = Object.entries(categorySalesMap).map(([catId, amount]) => {
    const cat = db.getCategories().find((c) => c.id === catId);
    return {
      category: cat ? cat.name : catId,
      amount: parseFloat(amount.toFixed(2)),
    };
  });

  // Top Selling Products
  const productSalesCount: Record<string, { name: string; units: number; revenue: number; image: string }> = {};
  for (const order of validOrders) {
    for (const item of order.items) {
      if (!productSalesCount[item.productId]) {
        productSalesCount[item.productId] = {
          name: item.productName,
          units: 0,
          revenue: 0,
          image: item.productImage,
        };
      }
      productSalesCount[item.productId].units += item.quantity;
      productSalesCount[item.productId].revenue += item.lineTotal;
    }
  }

  const topSelling = Object.values(productSalesCount)
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  // Status breakdown
  const statusCounts = {
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  };

  return res.json({
    kpis: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      revenueToday: parseFloat(revenueToday.toFixed(2)),
      revenue7d: parseFloat(revenue7d.toFixed(2)),
      revenue30d: parseFloat(revenue30d.toFixed(2)),
      totalOrders: orders.length,
      ordersAwaitingProcessing,
      completedOrders,
      cancelledOrders,
      totalProducts,
      activeProducts,
      totalUnitsInStock,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalCustomers: users.length,
      newCustomers30d: users.filter((u) => new Date(u.createdAt).getTime() >= thirtyDaysAgo).length,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
    },
    charts: {
      dailyTrends,
      salesByCategory,
      topSelling,
      statusCounts,
    },
    lowStockAlerts: lowStockProducts.concat(outOfStockProducts).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      threshold: p.lowStockThreshold,
    })),
  });
});

// Admin Customers Directory
apiRouter.get('/admin/customers', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  const customers = db.getUsers().filter((u) => u.role === 'customer');
  const orders = db.getOrders();

  const enriched = customers.map((c) => {
    const custOrders = orders.filter((o) => o.userId === c.id || o.customerEmail.toLowerCase() === c.email.toLowerCase());
    const validOrders = custOrders.filter((o) => o.status !== 'cancelled' && o.paymentStatus !== 'refunded');
    const lifetimeSpend = validOrders.reduce((sum, o) => sum + o.total, 0);

    return {
      ...c,
      orderCount: custOrders.length,
      lifetimeSpend: parseFloat(lifetimeSpend.toFixed(2)),
      lastOrderDate: custOrders.length > 0 ? custOrders[0].createdAt : null,
    };
  });

  return res.json({ customers: enriched });
});

// Admin toggle customer active status
apiRouter.put('/admin/customers/:id/toggle-status', async (req: Request, res: Response) => {
  const admin = getAuthenticatedUser(req);
  if (admin?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }

  const customer = db.getUserById(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found.' });

  const updated = await db.updateUser(customer.id, { isActive: !customer.isActive });
  return res.json({ customer: updated });
});

// ==========================================
// 7. REVIEWS & WISHLIST
// ==========================================

apiRouter.get('/reviews/:productId', (req: Request, res: Response) => {
  const reviews = db.getReviews(req.params.productId);
  return res.json({ reviews });
});

apiRouter.post('/reviews/:productId', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  const { rating, title, comment, userName } = req.body;
  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating and comment are required.' });
  }

  const newReview: Review = {
    id: `rev-${Date.now()}`,
    productId: req.params.productId,
    userId: user ? user.id : 'guest',
    userName: user ? user.fullName : userName || 'Verified Purchaser',
    rating: parseInt(rating, 10),
    title: title || 'Product Review',
    comment,
    verifiedPurchase: true,
    createdAt: new Date().toISOString(),
  };

  await db.addReview(newReview);
  return res.status(201).json({ review: newReview });
});

apiRouter.get('/wishlist', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.json({ wishlist: [] });
  const ids = db.getWishlist(user.id);
  const products = db.getProducts().filter((p) => ids.includes(p.id));
  return res.json({ wishlist: ids, products });
});

apiRouter.post('/wishlist/toggle', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to save items to your wishlist.' });
  }
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Product ID is required.' });

  const updated = await db.toggleWishlist(user.id, productId);
  return res.json({ wishlist: updated });
});

// ==========================================
// 8. STORE SETTINGS & SEED RESET
// ==========================================

apiRouter.get('/settings', (req: Request, res: Response) => {
  return res.json({ settings: db.getSettings() });
});

apiRouter.put('/settings', async (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required.' });
  }
  const updated = await db.updateSettings(req.body);
  return res.json({ settings: updated });
});

// Reset demo data to initial state
apiRouter.post('/seed/reset', (req: Request, res: Response) => {
  db.resetSeed();
  return res.json({ success: true, message: 'Demo store data reset to pristine seeded state.' });
});

// Automated Test Runner endpoint
apiRouter.get('/tests/run', async (req: Request, res: Response) => {
  const { runAutomatedTestSuite } = await import('../testRunner.ts');
  const results = await runAutomatedTestSuite();
  return res.json(results);
});
