"use client";
import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, Plus, Minus, X, CheckCircle2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";

export default function OrderPage({ params }) {
  const { qrId } = params;

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState(null);

  // Auto-redirect to order status page 2s after order is placed
  useEffect(() => {
    if (!placedOrderId) return;
    const timer = setTimeout(() => {
      window.location.href = `/order-status/${placedOrderId}`;
    }, 2000);
    return () => clearTimeout(timer);
  }, [placedOrderId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["menu", qrId],
    queryFn: async () => {
      const res = await fetch(`/api/menu/${qrId}`);
      if (!res.ok) throw new Error("Menu not found or QR code expired");
      return res.json();
    },
  });

  const submitOrder = useMutation({
    mutationFn: async (orderData) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit order");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setPlacedOrderId(data.id);
      setCart([]);
      setIsCartOpen(false);
      // Notify the native app (WebView context) so it can navigate to order tracking
      if (typeof window !== "undefined" && window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: "order_placed", orderId: data.id }),
        );
      }
    },
  });

  const restaurant = data?.restaurant;
  const menuItems = data?.menuItems || [];

  const categories = useMemo(() => {
    const cats = new Set(menuItems.map((item) => item.category || "Menu"));
    return Array.from(cats);
  }, [menuItems]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing)
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean),
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  const handleCheckout = () => {
    if (!customerName.trim()) {
      alert("Please enter your name");
      return;
    }
    submitOrder.mutate({
      qr_code_id: data.qrCode.id,
      restaurant_id: restaurant.id,
      customer_name: customerName,
      notes: notes,
      total: cartTotal,
      items: cart.map((item) => ({
        menu_item_id: item.id,
        item_name: item.name,
        item_price: item.price,
        quantity: item.quantity,
        subtotal: Number(item.price) * item.quantity,
      })),
    });
  };

  // ── Loading / Error states ──────────────────────────────────────────
  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading menu...</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
        <div className="text-4xl mb-4 text-gray-300 font-bold">😕</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
        <p className="text-gray-500 max-w-xs">{error.message}</p>
      </div>
    );

  // ── Order Placed success screen ─────────────────────────────────────
  if (placedOrderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-blue-600 text-white text-center">
        <CheckCircle2 className="w-20 h-20 mb-6" />
        <h2 className="text-3xl font-bold mb-2">Order Placed!</h2>
        <p className="opacity-90 mb-8 max-w-xs">
          Your order has been sent to{" "}
          <span className="font-bold underline">{restaurant?.name}</span>.
          Taking you to your order status...
        </p>
        <a
          href={`/order-status/${placedOrderId}`}
          className="text-white underline text-sm opacity-60"
        >
          Click here if not redirected
        </a>
      </div>
    );
  }

  // ── Main menu page ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white px-6 py-8 border-bottom border-gray-100 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name}</h1>
        <p className="text-gray-500 text-sm">
          Browse the menu and place your order
        </p>
      </div>

      {/* Menu Categories */}
      <div className="p-6 space-y-10">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded-full" />
              {category}
            </h2>

            <div className="grid gap-4">
              {menuItems
                .filter((item) => (item.category || "Menu") === category)
                .map((item) => {
                  const inCart = cart.find((c) => c.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-4"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          className="w-20 h-20 rounded-xl object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {item.name}
                          </h3>
                          <span className="font-bold text-blue-600">
                            ৳{Number(item.price).toFixed(0)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        <div className="flex justify-end mt-2">
                          {inCart ? (
                            <div className="flex items-center gap-3 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="font-bold text-gray-900 text-sm">
                                {inCart.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="bg-blue-50 text-blue-600 rounded-full px-4 py-1.5 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
                            >
                              <Plus size={14} />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        ))}
      </div>

      {/* Floating Cart Bar */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-6 right-6 z-20">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-blue-600 text-white rounded-xl py-3 px-4 flex items-center justify-between font-semibold shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-2 py-0.5 rounded text-xs">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
              View Order
            </div>
            <span>৳{cartTotal.toFixed(0)}</span>
          </button>
        </div>
      )}

      {/* Checkout Sheet */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 flex flex-col justify-end">
          <div className="bg-white rounded-t-[32px] max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Order</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-400 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="space-y-4 mb-8">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-2 border-b border-gray-50"
                >
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      ৳{Number(item.price).toFixed(0)} x {item.quantity}
                    </div>
                  </div>
                  <div className="font-bold text-gray-900">
                    ৳{(Number(item.price) * item.quantity).toFixed(0)}
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 text-xl font-bold">
                <span>Total</span>
                <span className="text-blue-600">৳{cartTotal.toFixed(0)}</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  Your Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any allergies or preferences?"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 h-24 resize-none"
                />
              </div>

              <button
                disabled={submitOrder.isLoading}
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white rounded-xl py-4 font-bold shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {submitOrder.isLoading
                  ? "Submitting..."
                  : `Confirm Order (৳${cartTotal.toFixed(0)})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
