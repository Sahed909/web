import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ArrowLeft } from "lucide-react-native";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { authFetch } from "@/utils/authFetch";

export default function SetupScreen() {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSetup = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await authFetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create restaurant");
      const data = await res.json();
      if (data.id) {
        await AsyncStorage.setItem("restaurant_id", data.id.toString());
        router.replace("/(tabs)");
      }
    } catch (e) {
      Alert.alert("Error", "Could not set up restaurant. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = async () => {
    await AsyncStorage.removeItem("app_mode");
    router.replace("/mode-select");
  };

  return (
    <KeyboardAvoidingAnimatedView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      behavior="padding"
    >
      <StatusBar style="dark" />

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top }}>
        {/* Back */}
        <TouchableOpacity
          onPress={goBack}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 20,
            marginBottom: 40,
          }}
        >
          <ArrowLeft size={20} color="#6B7280" />
          <Text style={{ fontSize: 16, color: "#6B7280" }}>Back</Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#111827",
            marginBottom: 12,
          }}
        >
          Set up your restaurant
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#6B7280",
            lineHeight: 24,
            marginBottom: 40,
          }}
        >
          Enter your restaurant name to get started. You can always change this
          later.
        </Text>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: "#374151",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Restaurant Name
          </Text>
          <TextInput
            autoFocus
            value={name}
            onChangeText={setName}
            placeholder="e.g. The Pizza Place"
            style={{
              backgroundColor: "#F9FAFB",
              borderWidth: 1.5,
              borderColor: "#E5E7EB",
              borderRadius: 16,
              padding: 18,
              fontSize: 16,
              color: "#111827",
            }}
          />
        </View>

        <TouchableOpacity
          onPress={handleSetup}
          disabled={!name.trim() || submitting}
          style={{
            backgroundColor: !name.trim() || submitting ? "#93C5FD" : "#2563EB",
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: "center",
            shadowColor: "#2563EB",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "bold" }}>
            {submitting ? "Setting up..." : "Get Started"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}
