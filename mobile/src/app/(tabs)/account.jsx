import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogOut, User, Store, ShieldCheck } from "lucide-react-native";
import { useAuth } from "@/utils/auth/useAuth";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { authFetch } from "@/utils/authFetch";

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, auth } = useAuth();
  const user = auth?.user;

  const { data: restaurantData } = useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => {
      const res = await authFetch("/api/restaurants");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!auth,
  });

  const restaurant = restaurantData?.restaurant;

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          signOut();
          router.replace("/mode-select");
        },
      },
    ]);
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: insets.top }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>
          Account
        </Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
        {/* User Info Card */}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: restaurant ? 16 : 0,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#EFF6FF",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <User size={26} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}
                numberOfLines={1}
              >
                {user?.name || "Restaurant Owner"}
              </Text>
              <Text
                style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}
                numberOfLines={1}
              >
                {user?.email || ""}
              </Text>
            </View>
          </View>

          {restaurant && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F0FDF4",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Store size={18} color="#16A34A" style={{ marginRight: 10 }} />
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#15803D" }}
              >
                {restaurant.name}
              </Text>
            </View>
          )}
        </View>

        {/* Security note */}
        <View
          style={{
            backgroundColor: "#EFF6FF",
            borderRadius: 14,
            padding: 16,
            marginBottom: 24,
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <ShieldCheck
            size={20}
            color="#2563EB"
            style={{ marginRight: 10, marginTop: 1 }}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#1D4ED8",
                marginBottom: 2,
              }}
            >
              Your data is saved & secured
            </Text>
            <Text style={{ fontSize: 12, color: "#3B82F6", lineHeight: 18 }}>
              Your login session is stored securely on this device. You'll stay
              logged in automatically next time you open the app.
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FEF2F2",
            borderRadius: 14,
            padding: 16,
            borderWidth: 1,
            borderColor: "#FECACA",
          }}
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#DC2626" style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#DC2626" }}>
            Log Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
