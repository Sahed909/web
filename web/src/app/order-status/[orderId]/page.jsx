"use client";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  BellRing,
  ArrowLeft,
} from "lucide-react";

const STATUS_STEPS = [
  {
    key: "pending",
    label: "Order Received",
    icon: Clock,
    color: "text-gray-500",
    bg: "bg-gray-100",
    ring: "ring-gray-300",
  },
  {
    key: "in_progress",
    label: "Preparing",
    icon: ChefHat,
    color: "text-amber-500",
    bg: "bg-amber-50",
    ring: "ring-amber-300",
  },
  {
    key: "ready",
    label: "Ready!",
    icon: BellRing,
    color: "text-green-500",
    bg: "bg-green-50",
    ring: "ring-green-300",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    color: "text-blue-500",
    bg: "bg-blue-50",
    ring: "ring-blue-300",
  },
];

export default function OrderStatusPage({ params }) {
  const { orderId } = params;
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setOrder(data);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 6000);
    return () => clearInterval(interval);
  }, [orderId]);

  const currentIndex =
    STATUS_STEPS.findIndex((s) => s.key === order?.status) ?? 0;

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
        <p className="text-red-500 mb-4 font-medium">{error}</p>
        <a href="/" className="text-blue-600 underline">
          Go back
        </a>
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400 font-medium">
          Loading your order...
        </div>
      </div>
    );

  const currentStep = STATUS_STEPS[currentIndex] || STATUS_STEPS[0];
  const CurrentIcon = currentStep.icon;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10 flex items-center gap-3">
        <a
          href="javascript:history.back()"
          className="p-2 -ml-2 text-gray-400 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </a>
        <h1 className="text-lg font-bold text-gray-900">Order Status</h1>
      </div>

      <div className="p-6">
        {/* Big status indicator */}
        <div className="flex flex-col items-center text-center mb-12">
          <div
            className={`w-24 h-24 ${currentStep.bg} ${currentStep.color} rounded-full flex items-center justify-center mb-6 ring-8 ${currentStep.ring} ring-opacity-20`}
          >
            <CurrentIcon size={44} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentStep.label}
          </h2>
          <p className="text-gray-500 max-w-xs mx-auto">
            {order.status === "pending" &&
              "We received your order and will start preparing it shortly."}
            {order.status === "in_progress" &&
              "Our kitchen is working on your order right now!"}
            {order.status === "ready" &&
              "Your order is ready! Please collect it from the counter."}
            {order.status === "completed" &&
              "Enjoy your meal! Thank you for ordering with us."}
          </p>
        </div>

        {/* Progress stepper */}
        <div className="flex justify-between items-start px-2 mb-12 max-w-sm mx-auto">
          {STATUS_STEPS.map((step, i) => {
            const isDone = i <= currentIndex;
            const StepIcon = step.icon;
            return (
              <div
                key={step.key}
                className="flex flex-col items-center flex-1 relative"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center z-10 mb-2 ${isDone ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-300"}`}
                >
                  <StepIcon size={20} />
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider text-center ${isDone ? "text-gray-900" : "text-gray-300"}`}
                >
                  {step.label}
                </span>

                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className={`absolute h-0.5 top-5 left-[50%] right-[-50%] z-0 ${i < currentIndex ? "bg-blue-600" : "bg-gray-100"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
              <p className="text-xs text-gray-500">
                {new Date(order.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="pb-4 border-b border-gray-200">
              <span className="text-sm text-gray-500">Customer:</span>{" "}
              <span className="text-sm font-bold text-gray-900">
                {order.customer_name}
              </span>
            </div>

            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-700">
                  <span className="font-bold text-gray-400">
                    {item.quantity}x
                  </span>{" "}
                  {item.item_name}
                </span>
                <span className="font-medium text-gray-900">
                  ৳{Number(item.subtotal).toFixed(0)}
                </span>
              </div>
            ))}

            <div className="pt-4 border-t border-gray-200 flex justify-between items-center font-bold text-lg">
              <span>Total</span>
              <span className="text-blue-600">
                ৳{Number(order.total).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-8 uppercase tracking-widest">
          This page refreshes automatically every 6 seconds
        </p>
      </div>
    </div>
  );
}
