import { db } from './db.ts';

export async function runAutomatedTestSuite(): Promise<{ passed: boolean; results: { name: string; status: 'pass' | 'fail'; message?: string }[] }> {
  const results: { name: string; status: 'pass' | 'fail'; message?: string }[] = [];

  function assert(condition: boolean, name: string, detail?: string) {
    if (condition) {
      results.push({ name, status: 'pass' });
    } else {
      results.push({ name, status: 'fail', message: detail || 'Assertion failed' });
    }
  }

  try {
    // Test 1: Seed data initialization
    const products = db.getProducts();
    assert(products.length >= 10, 'Initial products seeded', `Found ${products.length} products`);

    const users = db.getUsers();
    assert(users.some((u) => u.username === 'admin'), 'Admin user exists in database');

    // Test 2: Stock deduction on checkout transaction
    const testProd = products.find((p) => p.stock >= 5);
    if (!testProd) throw new Error('No test product available');

    const stockBefore = testProd.stock;
    const checkoutResult = await db.executeCheckoutTransaction({
      userId: 'usr-001',
      customerName: 'Automated Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '+1 555-000-0000',
      shippingAddress: {
        street: '123 Test Ave',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'United States',
      },
      items: [
        {
          id: 'test-item-1',
          productId: testProd.id,
          productName: testProd.name,
          productSku: testProd.sku,
          productImage: testProd.images[0] || '',
          unitPrice: testProd.price,
          quantity: 2,
          lineTotal: testProd.price * 2,
        },
      ],
      subtotal: testProd.price * 2,
      discount: 0,
      couponCode: null,
      shippingFee: 0,
      shippingMethod: 'Test Standard',
      tax: 0,
      total: testProd.price * 2,
      status: 'pending',
      paymentStatus: 'paid',
      paymentMethod: 'card',
    });

    assert(checkoutResult.success, 'Atomic checkout transaction succeeds');
    const updatedProd = db.getProduct(testProd.id);
    assert(updatedProd?.stock === stockBefore - 2, 'Inventory correctly deducted by 2 units', `Expected ${stockBefore - 2}, got ${updatedProd?.stock}`);

    // Test 3: Prevention of over-selling
    const excessiveCheckout = await db.executeCheckoutTransaction({
      userId: 'usr-001',
      customerName: 'Greedy Buyer',
      customerEmail: 'greedy@example.com',
      customerPhone: '+1 555-000-0000',
      shippingAddress: {
        street: '123 Test Ave',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
        country: 'United States',
      },
      items: [
        {
          id: 'excessive-item',
          productId: testProd.id,
          productName: testProd.name,
          productSku: testProd.sku,
          productImage: testProd.images[0] || '',
          unitPrice: testProd.price,
          quantity: 9999, // Way more than available
          lineTotal: testProd.price * 9999,
        },
      ],
      subtotal: testProd.price * 9999,
      discount: 0,
      shippingFee: 0,
      shippingMethod: 'Test',
      tax: 0,
      total: testProd.price * 9999,
      status: 'pending',
      paymentStatus: 'paid',
      paymentMethod: 'card',
    });

    assert(!excessiveCheckout.success, 'Rejects purchase exceeding stock limits');

    // Test 4: Order cancellation restores inventory
    if (checkoutResult.order) {
      const cancelResult = await db.updateOrderStatus(
        checkoutResult.order.id,
        'cancelled',
        'Test Suite',
        'Automated cancellation test'
      );
      assert(cancelResult.success, 'Order cancellation succeeds');
      const restoredProd = db.getProduct(testProd.id);
      assert(restoredProd?.stock === stockBefore, 'Inventory restored to original count upon cancellation', `Expected ${stockBefore}, got ${restoredProd?.stock}`);

      // Test 5: Double cancellation idempotency (does not restore inventory twice)
      await db.updateOrderStatus(
        checkoutResult.order.id,
        'cancelled',
        'Test Suite',
        'Repeated cancellation'
      );
      const afterDoubleCancel = db.getProduct(testProd.id);
      assert(afterDoubleCancel?.stock === stockBefore, 'Double cancellation does not double-restore stock', `Expected ${stockBefore}, got ${afterDoubleCancel?.stock}`);
    }

    // Test 6: Coupon validation
    const validCoupon = db.getCouponByCode('WELCOME10');
    assert(!!validCoupon, 'Coupon WELCOME10 exists and is valid');

    const invalidCoupon = db.getCouponByCode('NON_EXISTENT_CODE');
    assert(!invalidCoupon, 'Invalid coupon rejected');

  } catch (err: any) {
    results.push({ name: 'Suite Exception', status: 'fail', message: err.message });
  }

  const allPassed = results.every((r) => r.status === 'pass');
  return { passed: allPassed, results };
}
