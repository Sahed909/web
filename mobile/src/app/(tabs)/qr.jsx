import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
  Dimensions,
  TextInput,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Trash2,
  Share as ShareIcon,
  ArrowLeftRight,
  X,
  Printer,
  LogOut,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import {
  getRestaurantId,
  clearRestaurantIdCache,
} from "@/utils/getRestaurantId";
import { useAuth } from "@/utils/auth/useAuth";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SheetInput = Platform.OS === "web" ? TextInput : BottomSheetTextInput;

export default function QrTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [appUrl, setAppUrl] = useState("");
  const [selectedQr, setSelectedQr] = useState(null);

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["60%"], []);
  const [generating, setGenerating] = useState(false);

  const [qrLabel, setQrLabel] = useState("");
  const [qrType, setQrType] = useState("permanent");
  const [expiryHours, setExpiryHours] = useState("");

  useEffect(() => {
    const baseUrl =
      process.env.EXPO_PUBLIC_BASE_URL ||
      process.env.EXPO_PUBLIC_PROXY_BASE_URL ||
      "";
    setAppUrl(baseUrl);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const id = await getRestaurantId();
      if (id) {
        setRestaurantId(id);
        const res = await fetch(`/api/qr-codes?restaurant_id=${id}`);
        const data = await res.json();
        setQrs(data || []);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const openSheet = () => {
    setQrLabel("");
    setQrType("permanent");
    setExpiryHours("");
    bottomSheetRef.current?.expand();
  };

  const createQr = async () => {
    if (!qrLabel.trim()) {
      Alert.alert("Missing info", "Please enter a name for this QR code.");
      return;
    }
    if (qrType === "time_based") {
      const hrs = parseFloat(expiryHours);
      if (!expiryHours || isNaN(hrs) || hrs <= 0) {
        Alert.alert(
          "Missing info",
          "Please enter a valid number of hours for expiry.",
        );
        return;
      }
    }
    setGenerating(true);
    try {
      await fetch("/api/qr-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          type: qrType,
          expires_in_hours:
            qrType === "time_based" ? parseFloat(expiryHours) : null,
          label: qrLabel.trim(),
        }),
      });
      bottomSheetRef.current?.close();
      loadData();
    } catch (e) {
      Alert.alert("Error", "Could not generate QR code");
    } finally {
      setGenerating(false);
    }
  };

  const deleteQr = async (id) => {
    Alert.alert(
      "Delete QR Code",
      "Customers won't be able to scan it anymore.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`/api/qr-codes/${id}`, { method: "DELETE" });
              if (selectedQr?.id === id) setSelectedQr(null);
              loadData();
            } catch (e) {
              Alert.alert("Error", "Could not delete QR code");
            }
          },
        },
      ],
    );
  };

  const shareLink = async (qrId) => {
    try {
      const url = `${appUrl}/order/${qrId}`;
      await Share.share({ message: `Order from our menu here: ${url}` });
    } catch (error) {
      console.log(error);
    }
  };

  const printQr = async (qrId) => {
    const url = `${appUrl}/api/print-qr/${qrId}`;
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

  const getQrImageUrl = (qrId, size = 250) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(`${appUrl}/order/${qrId}`)}`;

  const renderStatus = (qr) => {
    if (!qr.is_active) return { label: "Inactive", color: "#6B7280" };
    if (qr.type === "time_based") {
      const expired = new Date(qr.expires_at) < new Date();
      if (expired) return { label: "Expired", color: "#EF4444" };
      return { label: "Active · Temp", color: "#F59E0B" };
    }
    return { label: "Active", color: "#10B981" };
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
            QR Codes
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
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
            <Text
              style={{ fontSize: 12, fontWeight: "bold", color: "#6B7280" }}
            >
              Switch
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={openSheet}
            style={{
              backgroundColor: "#EFF6FF",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Plus size={14} color="#2563EB" />
            <Text
              style={{ fontSize: 12, fontWeight: "bold", color: "#2563EB" }}
            >
              Generate QR
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* QR List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 100,
        }}
      >
        {qrs.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: "#9CA3AF",
              marginTop: 100,
              lineHeight: 22,
            }}
          >
            No QR codes yet.{"\n"}Generate one so customers can view your menu.
          </Text>
        ) : (
          qrs.map((qr) => {
            const status = renderStatus(qr);
            return (
              <TouchableOpacity
                key={qr.id}
                onPress={() => setSelectedQr(qr)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: "row",
                  gap: 14,
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                {/* QR thumbnail */}
                <Image
                  source={getQrImageUrl(qr.id, 80)}
                  style={{ width: 60, height: 60, borderRadius: 8 }}
                />

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#111827",
                      marginBottom: 2,
                    }}
                  >
                    {qr.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "bold",
                      color: status.color,
                    }}
                  >
                    {status.label}
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => shareLink(qr.id)}
                    style={{
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <ShareIcon size={14} color="#6B7280" />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#6B7280",
                      }}
                    >
                      Share
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteQr(qr.id)}
                    style={{
                      borderWidth: 1,
                      borderColor: "#FEE2E2",
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Trash2 size={14} color="#EF4444" />
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#EF4444",
                      }}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Full Screen QR Modal */}
      <Modal visible={!!selectedQr} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "#111827", padding: 24 }}>
          {/* Close */}
          <TouchableOpacity
            onPress={() => setSelectedQr(null)}
            style={{
              position: "absolute",
              top: insets.top + 16,
              right: 24,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.15)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <X size={24} color="white" />
          </TouchableOpacity>

          {selectedQr && (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "white",
                  marginBottom: 8,
                }}
              >
                {selectedQr.label}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: renderStatus(selectedQr).color,
                  fontWeight: "bold",
                  marginBottom: 40,
                }}
              >
                {renderStatus(selectedQr).label}
              </Text>

              {/* Big QR */}
              <View
                style={{
                  backgroundColor: "white",
                  padding: 20,
                  borderRadius: 24,
                  marginBottom: 40,
                }}
              >
                <Image
                  source={getQrImageUrl(selectedQr.id, 400)}
                  style={{
                    width: SCREEN_WIDTH - 120,
                    height: SCREEN_WIDTH - 120,
                  }}
                />
              </View>

              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  textAlign: "center",
                  marginBottom: 40,
                  lineHeight: 22,
                }}
              >
                Show this QR code to your customers.{"\n"}They scan it to view
                your menu and order.
              </Text>

              {/* Buttons */}
              <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
                <TouchableOpacity
                  onPress={() => shareLink(selectedQr.id)}
                  style={{
                    flex: 1,
                    backgroundColor: "#2563EB",
                    borderRadius: 14,
                    paddingVertical: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <ShareIcon size={18} color="white" />
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Share Link
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => printQr(selectedQr.id)}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderRadius: 14,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Printer size={18} color="white" />
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Print
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Generate QR Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: "#E5E7EB" }}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#111827",
              marginBottom: 24,
            }}
          >
            Generate New QR Code
          </Text>

          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            QR Name *
          </Text>
          <SheetInput
            value={qrLabel}
            onChangeText={setQrLabel}
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              color: "#111827",
              marginBottom: 20,
            }}
            placeholder="e.g. Table 5, Main Counter..."
          />

          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Expiry
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={() => setQrType("permanent")}
              style={{
                flex: 1,
                backgroundColor: qrType === "permanent" ? "#EFF6FF" : "#FFFFFF",
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: qrType === "permanent" ? "#BFDBFE" : "#E5E7EB",
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  color: qrType === "permanent" ? "#2563EB" : "#6B7280",
                }}
              >
                Permanent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setQrType("time_based")}
              style={{
                flex: 1,
                backgroundColor:
                  qrType === "time_based" ? "#EFF6FF" : "#FFFFFF",
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: qrType === "time_based" ? "#BFDBFE" : "#E5E7EB",
              }}
            >
              <Text
                style={{
                  fontWeight: "bold",
                  color: qrType === "time_based" ? "#2563EB" : "#6B7280",
                }}
              >
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {qrType === "time_based" && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Hours
              </Text>
              <SheetInput
                value={expiryHours}
                onChangeText={setExpiryHours}
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  color: "#111827",
                }}
                placeholder="How many hours until it expires?"
              />
            </View>
          )}

          <TouchableOpacity
            onPress={createQr}
            disabled={generating}
            style={{
              backgroundColor: "#2563EB",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
              {generating ? "Generating..." : "Generate QR"}
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
