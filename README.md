# AURA | Full-Stack Modern E-Commerce Platform

A production-style, design-forward full-stack e-commerce web application featuring a customer-facing storefront, shopping cart, atomic checkout, customer accounts, order management, inventory movement tracking, and a real-time admin analytics dashboard.

---

## 1. Architecture Overview

### Frontend
- **Framework:** React 19 with TypeScript & Vite
- **Styling:** Tailwind CSS v4 with design-system constraints (WCAG AA accessibility, zero-pill metadata, clean tabular numbers)
- **Visuals:** High-fidelity studio product photography generated with studio lighting
- **State & Context:** React Context (`AuthContext`, `CartContext`) with persistent client caches
- **Data Visualization:** Recharts (Revenue trajectories, Category volumes, Order distribution)
- **Micro-delights:** `canvas-confetti` order celebrations, print-ready CSS invoice generation

### Backend & API
- **API Server:** Node.js / Express mounted with Vite middlewares on port 3000
- **Database Engine:** ACID-transactional file-backed storage with atomic write locking and audit logs
- **Django Compatibility:** Reference Django REST Framework backend included in `backend_django/` (`models.py`, `serializers.py`, `seed_demo_data.py`)
- **Inventory Engine:** Atomic decrement on purchase, idempotent restoration on order cancellation or return, and full audit logs for every stock movement.

---

## 2. Default Demo Credentials & Roles

| Role | Username / Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `root` | Full CRUD, Inventory Adjustments, Order Fulfillment, Financial Analytics, Refunds |
| **VIP Customer** | `elena.rostova@designlab.io` | *(1-click / demo)* | Order History, Cancellation, Reviews, Wishlist, Saved Addresses |
| **Customer** | `marcus.vance@archstudio.com` | *(1-click / demo)* | Order History, Saved Addresses, Live Tracking |

> **Security Notice:** The `admin` / `root` credentials are for local development and demonstration purposes only. Rotate credentials before deploying to production clusters.

---

## 3. Quick Start & Execution

### Running the Live App (Express + Vite)
```bash
# 1. Install dependencies
npm install

# 2. Run the unified full-stack server
npm run dev
# The application will be accessible at http://localhost:3000
```

### Running Automated Test Suite
Visit the automated test runner in the browser or via curl:
```bash
curl http://localhost:3000/api/tests/run
```

This verifies:
1. Seed database state
2. Atomic stock deductions during checkout
3. Rejection of attempts to over-sell or buy out-of-stock units
4. Idempotent inventory restoration upon cancellation (prevents double restoration)
5. Coupon bounds and validation.

---

## 4. Key Functional Modules

1. **Customer Storefront:**
   - 3-zone Header Contract (`AURA.` wordmark, clean links, cart/account/admin triggers).
   - Campaign Hero, curated disciplines, featured studio signature pieces, bestsellers, and verified customer evaluations.
   - Live product search with SKU lookups and keyword suggestions.
2. **Catalog & Filters:**
   - Price slider ($50 to $800+), availability filters (in-stock only), category selectors, and sort orders (price, rating, bestseller, new release).
   - Responsive layouts for mobile, tablet, and desktop.
3. **Contiguous Purchase Module (PDP):**
   - High-res photography, specifications matrix, stock availability, stepper bounds, "Add to Cart", and "Instant Buy Now".
   - Verified collector review submissions with dynamic average score recalculation.
4. **Shopping Cart & Checkout:**
   - Free worldwide shipping threshold tracker ($150).
   - Server-side coupon verification (`WELCOME10` for 10% off, `SAVE20` for $20 off, `STUDIO50` for $50 off).
   - Atomic checkout transaction with card sandbox, COD, or Stripe dev modes.
   - Printable HTML tax invoices.
5. **Admin Operations Suite:**
   - Real calculated analytics: Revenue Today, 7-Day, 30-Day, Total Orders, Average Order Value, Low Stock Alerts.
   - Interactive charts: 14-day sales area curve and category distribution.
   - Stock Movements Log: Audit trail recording timestamp, product, delta, reason, order ID, and user.
   - Manual Stock Adjustment modal with mandatory audit reason.
   - Order fulfillment tracking and refund management.
   - Demo database reset button.
