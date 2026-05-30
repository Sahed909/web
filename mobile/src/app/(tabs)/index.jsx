import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ArrowLeftRight,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import {
  getRestaurantId,
  clearRestaurantIdCache,
} from "@/utils/getRestaurantId";
import { useAuth } from "@/utils/auth/useAuth";

const SheetInput = Platform.OS === "web" ? TextInput : BottomSheetTextInput;

export default function MenuTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const bottomSheetRef = useRef(null);
  const snapPoints = useMemo(() => ["75%"], []);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: "",
    quantity: "1",
    price: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const id = await getRestaurantId();
      if (id) {
        setRestaurantId(id);
        const res = await fetch(`/api/menu-items?restaurant_id=${id}`);
        const data = await res.json();
        setItems(data || []);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (item = null) => {
    if (item) {
      setEditingItem(item);
      setForm({
        name: item.name,
        quantity: item.quantity?.toString() || "1",
        price: item.price.toString(),
        description: item.description || "",
      });
    } else {
      setEditingItem(null);
      setForm({ name: "", quantity: "1", price: "", description: "" });
    }
    bottomSheetRef.current?.expand();
  };

  const closeForm = () => bottomSheetRef.current?.close();

  const saveItem = async () => {
    if (!form.name || !form.price) return;
    try {
      const payload = {
        restaurant_id: restaurantId,
        name: form.name,
        quantity: parseInt(form.quantity || "1", 10),
        price: parseFloat(form.price),
        description: form.description,
      };
      if (editingItem) {
        payload.id = editingItem.id;
        await fetch("/api/menu-items", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/menu-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      closeForm();
      loadData();
    } catch (e) {
      Alert.alert("Error", "Could not save menu item");
    }
  };

  const deleteItem = async (id) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`/api/menu-items?id=${id}`, { method: "DELETE" });
            loadData();
          } catch (e) {
            Alert.alert("Error", "Could not delete item");
          }
        },
      },
    ]);
  };

  const toggleAvailability = async (item) => {
    setTogglingId(item.id);
    try {
      await fetch("/api/menu-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, is_available: !item.is_available }),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_available: !i.is_available } : i,
        ),
      );
    } catch (e) {
      Alert.alert("Error", "Could not update item");
    } finally {
      setTogglingId(null);
    }
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  const categories = [...new Set(items.map((i) => i.category || "General"))];

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
            Menu
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
            onPress={() => openForm()}
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
              Add Item
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Item list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 100,
        }}
      >
        {items.length === 0 ? (
          <Text
            style={{
              textAlign: "center",
              color: "#9CA3AF",
              marginTop: 100,
              lineHeight: 22,
            }}
          >
            No menu items yet.{"\n"}Add your first dish!
          </Text>
        ) : (
          categories.map((category) => (
            <View key={category} style={{ marginBottom: 32 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "bold",
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 16,
                }}
              >
                {category}
              </Text>
              {items
                .filter((i) => (i.category || "General") === category)
                .map((item) => (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 16,
                      padding: 16,
                      borderWeight: 1,
                      borderColor: "#F3F4F6",
                      marginBottom: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#111827",
                          flex: 1,
                        }}
                      >
                        {item.name}
                      </Text>
                      {!item.is_available && (
                        <View
                          style={{
                            backgroundColor: "#FEF2F2",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                            marginRight: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "bold",
                              color: "#EF4444",
                            }}
                          >
                            OFF MENU
                          </Text>
                        </View>
                      )}
                    </View>

                    {item.description ? (
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#6B7280",
                          lineHeight: 18,
                          marginBottom: 12,
                        }}
                      >
                        {item.description}
                      </Text>
                    ) : null}

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "bold",
                          color: "#111827",
                        }}
                      >
                        ৳{Number(item.price).toFixed(0)}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => openForm(item)}
                          style={{
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: "#F3F4F6",
                          }}
                        >
                          <Edit2 size={16} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deleteItem(item.id)}
                          style={{
                            padding: 8,
                            borderRadius: 8,
                            backgroundColor: "#FEF2F2",
                          }}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => toggleAvailability(item)}
                          disabled={togglingId === item.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: item.is_available
                              ? "#D1FAE5"
                              : "#E5E7EB",
                            backgroundColor: item.is_available
                              ? "#ECFDF5"
                              : "#F3F4F6",
                          }}
                        >
                          {togglingId === item.id ? (
                            <ActivityIndicator size="small" color="#6B7280" />
                          ) : item.is_available ? (
                            <>
                              <Eye size={14} color="#10B981" />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "bold",
                                  color: "#10B981",
                                }}
                              >
                                Listed
                              </Text>
                            </>
                          ) : (
                            <>
                              <EyeOff size={14} color="#6B7280" />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "bold",
                                  color: "#6B7280",
                                }}
                              >
                                Hidden
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Item Bottom Sheet */}
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
            {editingItem ? "Edit Item" : "Add Menu Item"}
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
            Name *
          </Text>
          <SheetInput
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              color: "#111827",
              marginBottom: 14,
            }}
            placeholder="Item Name"
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
            Price (BDT) *
          </Text>
          <SheetInput
            value={form.price}
            onChangeText={(t) => setForm({ ...form, price: t })}
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              color: "#111827",
              marginBottom: 14,
            }}
            placeholder="0.00"
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
            Description
          </Text>
          <SheetInput
            value={form.description}
            onChangeText={(t) => setForm({ ...form, description: t })}
            multiline
            style={{
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              color: "#111827",
              height: 80,
              marginBottom: 20,
              textAlignVertical: "top",
            }}
            placeholder="Short description..."
          />

          <TouchableOpacity
            onPress={saveItem}
            style={{
              backgroundColor: "#2563EB",
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: "center",
              marginTop: 10,
            }}
          >
            <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
              Save Item
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}
