import { Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";

const CUSTOMER_CARE_NUMBER = "2347042678421"; 
export default function ProfileScreen() {
  useEffect(() => {
    const openWhatsApp = async () => {
      const url = `https://wa.me/${CUSTOMER_CARE_NUMBER}`;

      try {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert(
            "WhatsApp not installed",
            "Please install WhatsApp to contact customer care."
          );
        }
      } catch (e) {
        console.error("Failed to open WhatsApp", e);
      }
    };

    openWhatsApp();
  }, []);

  return <SafeAreaView className="flex-1 bg-primary-100" />;
}
