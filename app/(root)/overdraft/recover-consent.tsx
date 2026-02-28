// app/(root)/overdraft/recover-consent.tsx
import React, { useMemo, useState } from "react";
import { View, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";

import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { applyOverdraft } from "@/app/lib/thunks/overdraftThunks";

const SECTIONS = [
  {
    title: "YOUR DATA IS PROTECTED",
    body: "All our banking and investment procedures happen through encrypted technology and robust firewalls that ensure the protection of your data.",
  },
  {
    title: "YOUR RIGHTS ARE SERVED",
    body: "We ensure that you are enjoying all the personal and financial rights in banking regarding the service you prefer.",
  },
  {
    title: "YOU WILL BE INFORMED",
    body: "You will be updated on every transaction within your account, along with trends, offers, and promotions. Real-time alerts on security and policy changes will be sent to you.",
  },
  {
    title: "THE CONTROL IS IN YOUR HANDS",
    body: "Complete control of your banking will be in your hands while we make it easier for you. Timely notifications on every action happening will be sent to you, and you can use multiple platforms to manage the account.",
  },
];

export default function RecoverConsentScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const content = useMemo(() => SECTIONS, []);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const onAccept = async () => {
    if (submitting) return;

    setErr("");
    setSubmitting(true);

    try {
      await dispatch(applyOverdraft({}) as any).unwrap();

      router.push("/(root)/overdraft/setup");
    } catch (e: any) {
      setErr(typeof e === "string" ? e : e?.message || "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onDecline = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <Header title="Recover consent" />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 170 }}
      >
        {content.map((s) => (
          <View key={s.title} className="mb-7">
            <CustomText
              size="xs"
              weight="medium"
              className="text-white/80 tracking-wide"
            >
              {s.title}
            </CustomText>

            <CustomText size="sm" secondary className="mt-2 leading-6">
              {s.body}
            </CustomText>
          </View>
        ))}
      </ScrollView>

      <View className="absolute left-0 right-0 bottom-0 px-5 pb-8 pt-4 bg-primary-100">
        {!!err && (
          <CustomText size="sm" className="text-red-400 mb-3">
            {err}
          </CustomText>
        )}

        <Button
          title={submitting ? "Please wait..." : "Accept"}
          variant="primary"
          onPress={onAccept}
          disabled={submitting}
          className="rounded-full"
        />

        <View className="mt-4">
          <Button
            title="Decline"
            variant="secondary"
            onPress={onDecline}
            disabled={submitting}
            className="rounded-full"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
