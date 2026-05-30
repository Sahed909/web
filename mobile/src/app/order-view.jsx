import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import { useState, useRef } from "react";

export default function OrderViewScreen() {
  const { url } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "order_placed" && data.orderId) {
        router.replace({
          pathname: "/customer-orders",
          params: { orderId: String(data.orderId) },
        });
      }
    } catch (e) {
      // Not our message, ignore
    }
  };

  if (!url) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text style={{ marginBottom: 20 }}>No URL provided.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: "#2563EB",
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: "white" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      {/* Top bar */}
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
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            padding: 4,
          }}
        >
          <ArrowLeft size={20} color="#111827" />
          <Text style={{ fontWeight: "bold", color: "#111827" }}>
            Back to Scanner
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setError(false);
            setLoading(true);
            webviewRef.current?.reload();
          }}
          style={{ padding: 4 }}
        >
          <RotateCcw size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading && !error && (
        <View
          style={{
            position: "absolute",
            top: 200,
            left: 0,
            right: 0,
            alignItems: "center",
            zIndex: 1,
          }}
        >
          <ActivityIndicator color="#2563EB" />
          <Text style={{ marginTop: 10, color: "#999" }}>Loading menu...</Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
            Couldn't load menu
          </Text>
          <Text
            style={{ textAlign: "center", color: "#666", marginBottom: 30 }}
          >
            Make sure you're connected to the internet and the QR code is still
            valid.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setError(false);
              setLoading(true);
              webviewRef.current?.reload();
            }}
            style={{
              backgroundColor: "#2563EB",
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 28,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        style={{ flex: 1, opacity: loading || error ? 0 : 1 }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        onMessage={handleMessage}
      />
    </View>
  );
}
