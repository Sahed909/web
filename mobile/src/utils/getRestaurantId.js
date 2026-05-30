import AsyncStorage from "@react-native-async-storage/async-storage";
import { authFetch } from "./authFetch";

let _cachedRestaurantId = null;

/**
 * Gets the restaurant ID for the current user.
 * 1. Returns the in-memory cache if available (fastest).
 * 2. Falls back to AsyncStorage (persists across app restarts on same device).
 * 3. Falls back to fetching from the server (works across devices after login).
 */
export async function getRestaurantId() {
  if (_cachedRestaurantId) return _cachedRestaurantId;

  // Check device storage
  let id = await AsyncStorage.getItem("restaurant_id");
  if (id) {
    _cachedRestaurantId = id;
    return id;
  }

  // Not on this device — ask the server (requires the user to be logged in)
  try {
    const res = await authFetch("/api/restaurants?mine=true");
    if (res.ok) {
      const data = await res.json();
      if (data?.id) {
        id = data.id.toString();
        await AsyncStorage.setItem("restaurant_id", id);
        _cachedRestaurantId = id;
        return id;
      }
    }
  } catch (e) {
    console.error("[getRestaurantId] Server sync failed:", e);
  }

  return null;
}

/** Call this when the user logs out or clears their account */
export function clearRestaurantIdCache() {
  _cachedRestaurantId = null;
}
