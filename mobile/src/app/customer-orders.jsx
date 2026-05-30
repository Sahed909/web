import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  ArrowLeft,
  QrCode,
} from "lucide-react-native";

const STATUS_STEPS = [
  {
    key: "pending",
    label: "Received",
    icon: Clock,
    color: "#6B7280",
    bg: "#F3F4F6",
  },
  {
    key: "in_progress",
    label: "Preparing",
    icon: ChefHat,
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  {
    key: "ready",
    label: "Ready!",
    icon: Bell,
    color: "#10B981",
    bg: "#D1FAE5",
  },
  {
    key: "completed",
    label: "Done",
    icon: CheckCircle2,
    color: "#2563EB",
    bg: "#DBEAFE",
  },
];

export default function CustomerOrdersScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setOrder(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    // Poll every 6 seconds for live status
    const interval = setInterval(fetchOrder, 6000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  const currentStepIndex = STATUS_STEPS.findIndex(
    (s) => s.key === order?.status,
  );
  const currentStep = STATUS_STEPS[currentStepIndex] || STATUS_STEPS[0];
  const CurrentIcon = currentStep.icon;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 16,
          paddingBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <TouchableOpacity
          onPress={() => router.replace("/scan")}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <ArrowLeft size={20} color="#111827" />
          <Text style={{ fontWeight: "bold", color: "#111827" }}>
            Back to Scanner
          </Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>Your Order</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator color="#2563EB" />
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          <Text style={{ fontSize: 40, marginBottom: 10 }}>😕</Text>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
            Couldn't load order
          </Text>
          <Text
            style={{ textAlign: "center", color: "#666", marginBottom: 30 }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchOrder}
            style={{
              backgroundColor: "#2563EB",
              paddingVertical: 12,
              paddingHorizontal: 30,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: 24,
            paddingBottom: insets.bottom + 40,
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Big status card */}
          <View
            style={{
              backgroundColor: currentStep.bg,
              borderRadius: 24,
              padding: 32,
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "white",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 16,
                shadowColor: currentStep.color,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              }}
            >
              <CurrentIcon size={32} color={currentStep.color} />
            </View>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#111827",
                marginBottom: 8,
              }}
            >
              {currentStep.label}
            </Text>
            <Text
              style={{ textAlign: "center", color: "#6B7280", lineHeight: 22 }}
            >
              {order?.status === "pending" &&
                "We received your order! Preparing to start."}
              {order?.status === "in_progress" &&
                "The kitchen is working on your food right now 🍳"}
              {order?.status === "ready" &&
                "Your food is ready! Please collect from the counter 🔔"}
              {order?.status === "completed" &&
                "Enjoy your meal! Thank you for ordering 🎉"}
            </Text>
          </View>

          {/* Progress steps */}
          <View style={{ marginBottom: 40 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 20,
              }}
            >
              Progress
            </Text>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                const StepIcon = step.icon;
                return (
                  <View
                    key={step.key}
                    style={{ alignItems: "center", flex: 1 }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: done ? step.color : "#F3F4F6",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <StepIcon size={18} color={done ? "white" : "#D1D5DB"} />
                    </View>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "bold",
                        color: done ? "#111827" : "#D1D5DB",
                        textAlign: "center",
                      }}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Order summary */}
          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 20,
              padding: 24,
              borderWidth: 1,
              borderColor: "#F3F4F6",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                Order #{order?.id}
              </Text>
              <Text style={{ color: "#6B7280" }}>
                {order?.created_at
                  ? new Date(order.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                Customer:
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {order?.customer_name}
              </Text>
            </View>

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB",
                paddingTop: 20,
                marginBottom: 20,
              }}
            >
              {order?.items?.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ flex: 1, color: "#374151" }}>
                    <Text style={{ fontWeight: "bold" }}>{item.quantity}×</Text>{" "}
                    {item.item_name}
                  </Text>
                  <Text style={{ fontWeight: "bold" }}>
                    ৳{Number(item.subtotal).toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: "#E5E7EB",
                paddingTop: 20,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>Total</Text>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", color: "#2563EB" }}
              >
                ৳{Number(order?.total).toFixed(0)}
              </Text>
            </View>
          </View>

          <Text
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "#9CA3AF",
              marginTop: 24,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Updates automatically every 6 seconds
          </Text>

          {/* Scan another QR */}
          <TouchableOpacity
            onPress={() => router.replace("/scan")}
            style={{
              marginTop: 40,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 16,
              paddingVertical: 18,
            }}
          >
            <QrCode size={20} color="#111827" />
            <Text style={{ fontWeight: "bold", color: "#111827" }}>
              Scan Another QR Code
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
