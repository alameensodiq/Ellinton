import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import CustomText from "@/app/components/CustomText";
import Button from "@/app/components/Button";
import Sheet from "@/app/components/Sheet";
import BottomSheet from "@/app/components/BottomSheet";

const { width, height } = Dimensions.get("window");
const SLIDE_INTERVAL_MS = 3000;

type Slide = { key: string; title: string; desc: string };

const OFFER_SECTIONS = [
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
  {
    title: "YOUR MONEY AND DATA ARE INTACT",
    body: "Your hard-earned savings and personal data are secured with the utmost care. The latest encryption technology and protocols are implemented to avoid unauthorized access from fraudsters.",
  },
];

export default function OverdraftIntro() {
  const router = useRouter();

  const slides: Slide[] = useMemo(
    () => [
      {
        key: "1",
        title: "Spend with Confidence",
        desc: "Life happens. Use your Safety Net to complete essential transactions like Airtime or Bills even when your balance is zero.",
      },
      {
        key: "2",
        title: "No manual transfers\nrequired.",
        desc: "When you receive money, our system automatically “sweeps” the inflow to clear your balance. It’s that simple.",
      },
      {
        key: "3",
        title: "Better habits, bigger nets.",
        desc: "When you receive money, our system automatically “sweeps” the inflow to clear your balance starting with interest, then principal. It’s that simple.",
      },
    ],
    []
  );

  const listRef = useRef<FlatList<Slide>>(null);
  const timerRef = useRef<any>(null);
  const lastUserScrollAtRef = useRef(0);

  const [activeIndex, setActiveIndex] = useState(0);
  const [termsOpen, setTermsOpen] = useState(false);

  const scrollTo = (i: number) => {
    listRef.current?.scrollToOffset({ offset: i * width, animated: true });
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastUserScrollAtRef.current < 1200) return;

      setActiveIndex((prev) => {
        const next = prev === slides.length - 1 ? 0 : prev + 1;
        scrollTo(next);
        return next;
      });
    }, SLIDE_INTERVAL_MS);
  };

  useEffect(() => {
    startTimer();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / width);

    lastUserScrollAtRef.current = Date.now();
    setActiveIndex(i);
    startTimer();
  };

  const onContinue = () => {
    if (activeIndex < slides.length - 1) {
      const next = activeIndex + 1;
      lastUserScrollAtRef.current = Date.now();
      setActiveIndex(next);
      scrollTo(next);
      startTimer();
      return;
    }

    stopTimer();
    setTermsOpen(true);
  };

  const onAccept = () => {
    setTermsOpen(false);
    router.push("/(root)/overdraft/recover-consent");
  };

  

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      {/* TOP INDICATOR */}
      <View className="px-5 pt-2">
        <View className="flex-row gap-3">
          {slides.map((s, i) => {
            const active = i === activeIndex;
            return (
              <Pressable
                key={s.key}
                onPress={() => {
                  lastUserScrollAtRef.current = Date.now();
                  setActiveIndex(i);
                  scrollTo(i);
                  startTimer();
                }}
                className={`flex-1 h-1.5 rounded-full ${
                  active ? "bg-primary-200" : "bg-white/15"
                }`}
              />
            );
          })}
        </View>
      </View>

      {/* SLIDES */}
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(i) => i.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1">
            <View className="absolute top-44 inset-0">
              <View
                style={{
                  width: width * 1.5,
                  height: width * 1.5,
                  borderRadius: width * 0.75,
                  alignSelf: "center",
                  marginTop: -width * 0.55,
                  opacity: 0.9,
                }}
                className="bg-primary-400"
              />
              <View
                style={{ height: Math.max(220, height * 0.28) }}
                className="absolute bottom-0 left-0 right-0 bg-primary-100/85"
              />
            </View>

            <View className="flex-1 px-8 justify-center">
              <View className="items-center">
                <CustomText
                  size="xl"
                  weight="bold"
                  className="text-center leading-8"
                >
                  {item.title}
                </CustomText>

                <CustomText
                  size="sm"
                  secondary
                  className="text-center mt-4 leading-6 max-w-[320px]"
                >
                  {item.desc}
                </CustomText>

                <View className="w-full mt-8">
                  <Button
                    title="Continue"
                    variant="primary"
                    onPress={onContinue}
                    className="rounded-full"
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      />

      <BottomSheet
        visible={termsOpen}
        onClose={() => {
          setTermsOpen(false);
          startTimer();
        }}
        hideshowButton
      >
        {/* Title */}
        <View className="items-center mb-4">
          <CustomText size="base" weight="bold">
            Offer letter
          </CustomText>
        </View>

        {/* Body */}
        {OFFER_SECTIONS.map((s) => (
          <View key={s.title} className="mb-6">
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

        <View className="mt-6 ">
          <Button
            title="Accept and continue"
            variant="primary"
            onPress={onAccept}
            className="rounded-full"
          />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
