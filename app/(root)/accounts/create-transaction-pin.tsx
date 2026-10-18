import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Header from "@/app/components/header-back";
import OtpInput from "@/app/components/inputs/OtpInput";
import ErrorModal from "@/app/components/ErrorModal";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { createUserTransactionPin } from "@/app/lib/thunks/authThunks";

const C = {
  bgPage: "#3F401B",
  bgDark: "#969841",
  white: "#FFFFFF",
  textPrimary: "#2A2B0F",
  textSub: "#7A7B5A",
};

export default function CreateTransactionPinScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const value = step === "create" ? pin : confirmPin;
  const setValue = (nextValue: string) => {
    if (step === "create") setPin(nextValue);
    else setConfirmPin(nextValue);
  };

  const handleContinue = async () => {
    if (value.length !== 4) return;

    if (step === "create") {
      setConfirmPin("");
      setStep("confirm");
      return;
    }

    if (confirmPin !== pin) {
      setConfirmPin("");
      setErrorMessage("The PINs do not match. Please try again.");
      return;
    }

    if (!user?.id) {
      setErrorMessage("Your account details are unavailable. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(createUserTransactionPin({ userId: user.id, pin })).unwrap();
      router.replace("/(root)/accounts/transaction-pin-success");
    } catch (error: unknown) {
      setErrorMessage(typeof error === "string" ? error : "Unable to create your transaction PIN. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgPage }}>
      <Header title="Create Transaction PIN" />

      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 44 }}>
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(251,205,88,0.18)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <MaterialCommunityIcons name="shield-key-outline" size={31} color="#FBCD58" />
          </View>
          <Text style={{ color: C.white, fontFamily: "OutfitBold", fontSize: 23, textAlign: "center" }}>
            {step === "create" ? "Create your PIN" : "Confirm your PIN"}
          </Text>
          <Text style={{ color: "#D1D1D1", fontFamily: "Outfit", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 10, maxWidth: 300 }}>
            {step === "create"
              ? "Set a secure 4-digit PIN to approve your transfers."
              : "Enter the same 4-digit PIN again to confirm it."}
          </Text>
        </View>

        <View style={{ alignItems: "center", marginTop: 42 }}>
          <OtpInput
            digitCount={4}
            value={value}
            onChange={setValue}
            secure
            autoFocus
            inputStyle="w-14 h-14 text-lg"
          />
        </View>

        <View style={{ marginTop: "auto", paddingBottom: 24 }}>
          {step === "confirm" && (
            <Pressable onPress={() => { setStep("create"); setConfirmPin(""); }} style={{ alignItems: "center", paddingVertical: 12 }}>
              <Text style={{ color: "#FBCD58", fontFamily: "OutfitBold", fontSize: 13 }}>Change PIN</Text>
            </Pressable>
          )}
          <Pressable
            disabled={value.length !== 4 || isSubmitting}
            onPress={handleContinue}
            style={{ backgroundColor: C.bgDark, opacity: value.length === 4 && !isSubmitting ? 1 : 0.55, paddingVertical: 15, borderRadius: 14, alignItems: "center" }}
          >
            <Text style={{ color: C.white, fontFamily: "OutfitBold", fontSize: 15 }}>
              {isSubmitting ? "Creating PIN..." : step === "create" ? "Continue" : "Create Transaction PIN"}
            </Text>
          </Pressable>
        </View>
      </View>

      <ErrorModal
        visible={Boolean(errorMessage)}
        title="Transaction PIN"
        message={errorMessage}
        onDismiss={() => setErrorMessage("")}
      />
    </SafeAreaView>
  );
}
