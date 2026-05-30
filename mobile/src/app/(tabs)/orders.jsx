import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Alert,
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeftRight, Printer, Trash2, LogOut } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import {
  getRestaurantId,
  clearRestaurantIdCache,
} from "@/utils/getRestaurantId";
import { useAuth } from "@/utils/auth/useAuth";

const BASE_URL =
  process.env.EXPO_PUBLIC_BASE_URL ||
  process.env.EXPO_PUBLIC_PROXY_BASE_URL ||
  "";

export default function OrdersTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const opacityMap = useRef({});

  const getOpacity = useCallback((order) => {
    if (!opacityMap.current[order.id]) {
      opacityMap.current[order.id] = new Animated.Value(
        order.status === "completed" ? 0.35 : 1,
      );
    }
    return opacityMap.current[order.id];
  }, []);

  const animateComplete = useCallback((orderId) => {
    const anim = opacityMap.current[orderId];
    if (anim) {
      Animated.timing(anim, {
        toValue: 0.35,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const animateRestore = useCallback((orderId) => {
    const anim = opacityMap.current[orderId];
    if (anim) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const id = await getRestaurantId();
      if (id) {
        const res = await fetch(`/api/orders?restaurant_id=${id}`);
        const data = await res.json();
        const newOrders = data || [];

        newOrders.forEach((order) => {
          if (!opacityMap.current[order.id]) {
            opacityMap.current[order.id] = new Animated.Value(
              order.status === "completed" ? 0.35 : 1,
            );
          }
        });

        setOrders(newOrders);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const updateStatus = async (order, status) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status } : o)),
      );
      if (status === "completed") {
        animateComplete(order.id);
      } else {
        animateRestore(order.id);
      }

      await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      Alert.alert("Error", "Could not update order status");
      loadData();
    }
  };

  const deleteOrder = (orderId) => {
    Alert.alert("Delete Order", "Are you sure you want to delete this order?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
            await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
          } catch (e) {
            Alert.alert("Error", "Could not delete order");
            loadData();
          }
        },
      },
    ]);
  };

  const printOrder = async (orderId) => {
    const url = `${BASE_URL}/api/print-order/${orderId}`;
    await Linking.openURL(url);
  };

  const switchMode = async () => {
    await AsyncStorage.removeItem("app_mode");
    router.replace("/mode-select");
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("app_mode");
    await AsyncStorage.removeItem("restaurant_id");
    clearRestaurantIdCache();
    signOut();
    router.replace("/mode-select");
  };

  const statusConfig = {
    pending: { label: "Pending", color: "#6B7280" },
    in_progress: { label: "Preparing", color: "#F59E0B" },
    ready: { label: "Ready", color: "#10B981" },
    completed: { label: "Completed", color: "#2563EB" },
  };

  const renderStatusBar = (order) => {
    const steps = ["pending", "in_progress", "ready", "completed"];
    return (
      <View
        style={{
          flexDirection: "row",
          gap: 6,
          flexWrap: "wrap",
          marginTop: 12,
        }}
      >
        {steps.map((s) => {
          const cfg = statusConfig[s];
          const isActive = order.status === s;
          return (
            <TouchableOpacity
              key={s}
              onPress={() => !isActive && updateStatus(order, s)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isActive ? cfg.color : "#E5E7EB",
                backgroundColor: isActive ? cfg.color + "18" : "#FFFFFF",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color: isActive ? cfg.color : "#6B7280",
                }}
              >
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827" }}>
            Live Orders
          </Text>
        </View>
        <TouchableOpacity
          onPress={switchMode}
          style={{
            backgroundColor: "#F3F4F6",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ArrowLeftRight size={14} color="#6B7280" />
          <Text style={{ fontSize: 12, fontWeight: "bold", color: "#6B7280" }}>
            Switch
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: "#9CA3AF",
              marginTop: 100,
              lineHeight: 22,
            }}
          >
            No orders yet.{"\n"}Pull to refresh.
          </Text>
        ) : (
          orders.map((order) => {
            const opacity = getOpacity(order);
            return (
              <Animated.View
                key={order.id}
                style={{
                  opacity,
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 16,
                  borderWeight: 1,
                  borderColor: "#F3F4F6",
                  marginBottom: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                }}
              >
                {/* Top row */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 14,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "#111827",
                      }}
                    >
                      {order.customer_name}
                    </Text>
                    <Text
                      style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}
                    >
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "#2563EB",
                      }}
                    >
                      ৳{Number(order.total).toFixed(0)}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => printOrder(order.id)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          backgroundColor: "#F3F4F6",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Printer size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => deleteOrder(order.id)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 8,
                          backgroundColor: "#FEF2F2",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Items */}
                <View
                  style={{
                    backgroundColor: "#F9FAFB",
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 12,
                  }}
                >
                  {order.items?.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ flex: 1, fontSize: 13, color: "#4B5563" }}>
                        <Text style={{ fontWeight: "bold" }}>
                          {item.quantity}×
                        </Text>{" "}
                        {item.item_name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: "#4B5563",
                        }}
                      >
                        ৳{Number(item.subtotal).toFixed(0)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Notes */}
                {order.notes ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#F59E0B",
                      fontStyle: "italic",
                      marginBottom: 12,
                    }}
                  >
                    Note: {order.notes}
                  </Text>
                ) : null}

                {/* Status buttons */}
                {renderStatusBar(order)}
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
