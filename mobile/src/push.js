import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { registerPushToken } from "./api";

// Foreground notifications show a banner.
Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }),
});

// Ask permission, get this device's Expo push token, and register it so the store can notify the buyer
// about order updates. Call after login (so the token attaches to the customer). Non-fatal on failure.
export async function registerForPush() {
    try {
        if (!Device.isDevice) return;   // push tokens are only issued on real devices
        const existing = await Notifications.getPermissionsAsync();
        let status = existing.status;
        if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
        if (status !== "granted") return;

        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", { name: "default", importance: Notifications.AndroidImportance.DEFAULT });
        }
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        if (token) await registerPushToken(token, Platform.OS);
    } catch { /* non-fatal */ }
}
