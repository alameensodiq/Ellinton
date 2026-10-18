import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Header from "@/app/components/header-back";

const C = {
  bgPage: "#3F401B",
  bgDark: "#969841",
  green: "#21D184",
  white: "#FFFFFF",
};

export default function TransactionPinSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <Header title="Transaction PIN" />
      <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(33,209,132,0.16)", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <MaterialCommunityIcons name="check" size={42} color={C.green} />
        </View>
        <Text style={{ color: C.white, fontFamily: "OutfitBold", fontSize: 24, textAlign: "center" }}>PIN created successfully</Text>
        <Text style={{ color: "#D1D1D1", fontFamily: "Outfit", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12, maxWidth: 310 }}>
          Your transaction PIN is ready to use for approving transfers and other secure actions.
        </Text>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Pressable
          onPress={() => router.replace("/(root)/accounts/security")}
          style={{ backgroundColor: C.bgDark, paddingVertical: 15, borderRadius: 14, alignItems: "center" }}
        >
          <Text style={{ color: C.white, fontFamily: "OutfitBold", fontSize: 15 }}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
