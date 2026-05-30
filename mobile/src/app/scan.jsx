import { View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeftRight } from "lucide-react-native";

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);

    if (data && data.includes("/order/")) {
      router.push({ pathname: "/order-view", params: { url: data } });
      setTimeout(() => setScanned(false), 2000);
    } else {
      alert(
        "This QR code is not a valid QRMenu order code. Please scan a QRMenu code.",
      );
      setScanned(false);
    }
  };

  const switchMode = async () => {
    await AsyncStorage.removeItem("app_mode");
    router.replace("/mode-select");
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: "black" }} />;
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
          padding: 40,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Camera Access Needed
        </Text>
        <Text style={{ textAlign: "center", color: "#666", marginBottom: 30 }}>
          We need your camera to scan QR codes at restaurants.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{
            backgroundColor: "#000",
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Allow Camera
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={switchMode}>
          <Text style={{ color: "#666" }}>Switch mode</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar style="light" />

      {/* Camera */}
      <CameraView
        style={{ flex: 1 }}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* Overlay */}
      <View
        style={{
          position: "absolute",
          inset: 0,
          justifyContent: "space-between",
          paddingTop: insets.top,
        }}
      >
        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
            Scan to Order
          </Text>
          <TouchableOpacity
            onPress={switchMode}
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeftRight size={16} color="white" />
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Switch Mode
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scanner frame */}
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 250, height: 250, position: "relative" }}>
            {[
              { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
              { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
              { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
              {
                bottom: 0,
                right: 0,
                borderBottomWidth: 3,
                borderRightWidth: 3,
              },
            ].map((style, i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  width: 40,
                  height: 40,
                  borderColor: scanned ? "#10B981" : "#FFFFFF",
                  ...style,
                }}
              />
            ))}
          </View>
          {scanned && (
            <View
              style={{
                backgroundColor: "#10B981",
                paddingVertical: 6,
                paddingHorizontal: 16,
                borderRadius: 20,
                marginTop: 20,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>
                ✓ Scanned
              </Text>
            </View>
          )}
        </View>

        {/* Bottom hint */}
        <View
          style={{
            padding: 40,
            alignItems: "center",
            paddingBottom: insets.bottom + 40,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", opacity: 0.8 }}>
            Point your camera at the QR code on the restaurant's table or menu
          </Text>
        </View>
      </View>
    </View>
  );
}
