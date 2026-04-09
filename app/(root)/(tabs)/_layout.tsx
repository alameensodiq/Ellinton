import { Tabs } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Linking } from "react-native";
import { usePreventScreenCapture } from "expo-screen-capture";

const CUSTOMER_CARE_NUMBER = "2347047007086";

export default function TabsLayout() {
  usePreventScreenCapture();
  const openWhatsApp = async () => {
    const url = `https://wa.me/${CUSTOMER_CARE_NUMBER}`;
    await Linking.openURL(url);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#969841",
        tabBarInactiveTintColor: "#FFFFFF",
        tabBarStyle: {
          backgroundColor: "#3F401B",
          borderTopColor: "#4a4b20",
          height: 90,
          paddingBottom: 20
        },
        headerShown: false
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" color={color} size={size} />
          )
        }}
      />

      <Tabs.Screen
        name="cards"
        options={{
          title: "Cards",
          tabBarLabel: "Cards",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="credit-card-outline"
              color={color}
              size={size}
            />
          )
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarLabel: "Transactions",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="receipt-text-outline"
              color={color}
              size={size}
            />
          )
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Live Chat",
          tabBarLabel: "Live Chat",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chat" color={color} size={size} />
          )
        }}
        // listeners={{
        //   tabPress: (e) => {
        //     e.preventDefault();
        //     openWhatsApp();
        //   }
        // }}
      />

      {/* <Tabs.Screen
        name="support"
        options={{
          title: "Talk to us",
          tabBarLabel: "Talk to us",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="whatsapp" color={color} size={size} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            openWhatsApp(); 
          },
        }}
      /> */}
    </Tabs>
  );
}
