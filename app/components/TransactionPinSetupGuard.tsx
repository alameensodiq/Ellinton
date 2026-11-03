import React from "react";
import { Modal, View } from "react-native";
import { useRouter, useSegments } from "expo-router";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

export default function TransactionPinSetupGuard() {
  const router = useRouter();
  const segments = useSegments();
  const requiresTransactionPinSetup = useAppSelector(
    (state) => state.auth.requiresTransactionPinSetup
  );

  const currentRoute = String(segments[segments.length - 1] ?? "");
  const isRootTransactionRoute = segments[0] === "(root)" &&
    (currentRoute.toLowerCase().includes("authorize") ||
      currentRoute.toLowerCase().includes("confirm"));
  const visible = requiresTransactionPinSetup === true && isRootTransactionRoute;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => undefined}
    >
      <View className="flex-1 bg-black/60 justify-center items-center p-6">
        <View className="w-full max-w-[420px] rounded-2xl bg-primary-400 p-6 items-center">
          <CustomText weight="bold" size="lg" className="text-center">
            Create a transaction PIN first
          </CustomText>
          <CustomText size="sm" className="text-center mt-3 mb-6">
            You need a transaction PIN to authorize payments and transfers.
          </CustomText>
          <Button
            title="Create PIN"
            onPress={() => router.push("/(root)/accounts/create-transaction-pin")}
            variant="primary"
            className="w-full"
          />
        </View>
      </View>
    </Modal>
  );
}
