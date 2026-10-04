import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  ShoppingBag,
  CheckCircle,
  X,
  CreditCard,
  Truck,
  ArrowRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { api } from '../../services/api';
import { Product, Order } from '../../types';

interface StorefrontPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: () => void;
}

export const StorefrontPreviewModal: React.FC<StorefrontPreviewModalProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPublicCatalog();
    }
  }, [isOpen]);

  const loadPublicCatalog = async () => {
    try {
      setIsLoading(true);
      const res = await api.getCustomerCatalog();
      setProducts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleCheckout = async () => {
    if (!cart.length) return;
    try {
      setIsPlacingOrder(true);
      const res = await api.placeCustomerOrder({
        customerId: 'cust-1',
        paymentMethod: 'credit_card',
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          recipientName: 'Rachel Adams (Customer)',
          street: '742 Evergreen Terrace',
          city: 'Springfield',
          state: 'OR',
          zip: '97477',
          country: 'United States',
        },
      });

      setPlacedOrder(res.order);
      setCart([]);
      onOrderPlaced(); // notifies parent to refresh dashboard/orders
    } catch (err) {
      console.error(err);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!isOpen) return null;

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">MarketHub Storefront Simulator</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                  LIVE SHARED DB
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Customer-facing website using the same backend routes (`/api/public/*`) and database.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Products List (2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Customer Storefront Catalog ({products.length})
              </h4>
              <span className="text-[11px] text-neutral-500">Only Active listings are displayed</span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-neutral-400">Loading catalog...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-between"
                  >
                    <div>
                      <img
                        src={p.images[0]}
                        alt={p.title}
                        className="w-full h-28 object-cover rounded-lg mb-2 bg-neutral-900"
                      />
                      <h5 className="text-xs font-semibold text-white line-clamp-1">{p.title}</h5>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Sold by {p.sellerName}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-xs">
                        ${p.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.stock <= 0}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[11px] font-semibold transition-colors disabled:opacity-40"
                      >
                        {p.stock > 0 ? '+ Add' : 'Sold Out'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart & Order Simulator (1 col) */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                  Buyer Cart
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  {cart.reduce((s, i) => s + i.quantity, 0)} items
                </span>
              </div>

              {placedOrder ? (
                <div className="my-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Order Simulated!</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-snug">
                    Order <strong>{placedOrder.orderNumber}</strong> was written to the shared database.
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Switch to <strong>Orders</strong> or <strong>Dashboard</strong> in the admin console to inspect it immediately.
                  </p>
                  <button
                    onClick={() => setPlacedOrder(null)}
                    className="w-full mt-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                  >
                    Simulate Another Order
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  Cart is empty. Click "+ Add" on any listing.
                </div>
              ) : (
                <div className="my-3 space-y-2 max-h-60 overflow-y-auto divide-y divide-neutral-900">
                  {cart.map((item, idx) => (
                    <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                      <div className="truncate max-w-[130px]">
                        <div className="text-neutral-200 font-medium truncate">{item.product.title}</div>
                        <div className="text-[10px] text-neutral-500">Qty: {item.quantity}</div>
                      </div>
                      <span className="font-mono text-white">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && !placedOrder && (
              <div className="pt-3 border-t border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Subtotal:</span>
                  <span className="font-mono text-white font-bold">${cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Shipping:</span>
                  <span>{cartSubtotal > 75 ? 'FREE' : '$5.99'}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isPlacingOrder}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isPlacingOrder ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Place Customer Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
