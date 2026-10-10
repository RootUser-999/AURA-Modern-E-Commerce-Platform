import React from 'react';
import { X, Printer, Download, CheckCircle, Package } from 'lucide-react';
import { Order } from '../types';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-12 flex items-center justify-center">
      <div onClick={onClose} className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden p-6 sm:p-10 my-8">
        {/* Controls - Hidden during print */}
        <div className="flex justify-between items-center pb-6 mb-6 border-b border-stone-200 no-print">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
            <Package className="w-4 h-4 text-stone-900" />
            <span>Official Studio Tax Invoice</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Invoice
            </button>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body (matches print styling) */}
        <div className="space-y-8 text-stone-900">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <span className="font-extrabold text-2xl tracking-tighter text-stone-950">
                AURA<span className="text-indigo-600">.</span>
              </span>
              <p className="text-xs text-stone-500 mt-1">Contemporary Design & Tech Objects</p>
              <p className="text-xs text-stone-500">concierge@aurastudio.com</p>
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">INVOICE</h1>
              <p className="text-xs font-mono font-bold text-indigo-600 mt-1">#{order.orderNumber}</p>
              <p className="text-xs text-stone-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              <p className="text-xs font-semibold text-emerald-600 uppercase mt-0.5">Payment: {order.paymentStatus}</p>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-4 border-t border-stone-200">
            <div>
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-2">Billed & Shipped To</h3>
              <p className="font-semibold text-stone-900">{order.customerName}</p>
              <p className="text-stone-600">{order.shippingAddress.street}</p>
              <p className="text-stone-600">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p className="text-stone-600">{order.shippingAddress.country}</p>
              <p className="text-stone-500 mt-1">{order.customerEmail}</p>
            </div>

            <div className="text-right">
              <h3 className="font-bold text-stone-900 uppercase tracking-wider text-[11px] mb-2">Order Information</h3>
              <p className="text-stone-600">Status: <strong className="uppercase font-mono">{order.status}</strong></p>
              <p className="text-stone-600">Payment: <strong className="uppercase font-mono">{order.paymentMethod}</strong></p>
              <p className="text-stone-600">Fulfillment: {order.shippingMethod}</p>
              {order.trackingNumber && (
                <p className="text-stone-600 mt-1">
                  Tracking: <strong className="font-mono text-indigo-600">{order.trackingNumber}</strong> ({order.carrier})
                </p>
              )}
            </div>
          </div>

          {/* Line items table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 font-mono text-[11px] uppercase">
                <th className="py-2.5">Item Description</th>
                <th className="py-2.5">SKU</th>
                <th className="py-2.5 text-right">Price</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 font-medium text-stone-900">{item.productName}</td>
                  <td className="py-3 font-mono text-stone-500">{item.productSku}</td>
                  <td className="py-3 font-mono text-right tabular-nums">${item.unitPrice.toFixed(2)}</td>
                  <td className="py-3 font-mono text-center tabular-nums">{item.quantity}</td>
                  <td className="py-3 font-mono text-right font-semibold tabular-nums">${item.lineTotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end pt-4 border-t border-stone-200 text-xs">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({order.couponCode || 'Promo'}):</span>
                  <span className="font-mono tabular-nums">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Shipping:</span>
                <span className="font-mono tabular-nums">
                  {order.shippingFee === 0 ? 'Free' : `$${order.shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Estimated Tax:</span>
                <span className="font-mono tabular-nums">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-stone-950 pt-2 border-t border-stone-300">
                <span>Total Amount:</span>
                <span className="font-mono text-base tabular-nums">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="pt-8 border-t border-stone-200 text-center text-[11px] text-stone-400">
            <p>Thank you for shopping with AURA Studio. All items include our standard 2-year warranty.</p>
            <p className="mt-0.5">For inquiries or warranty service, contact concierge@aurastudio.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};
