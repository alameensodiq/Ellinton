import React, { useEffect, useRef } from "react";
import { View, StatusBar, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/app/components/header-back";
import CustomText from "@/app/components/CustomText";
import { svgIcons } from "@/app/assets/icons/icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { runCreditCheck } from "@/app/lib/thunks/loansThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";

const CreditScore = () => {
  const LoanIcon = svgIcons.loanfail;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const params = useLocalSearchParams<Record<string, string>>();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ])
    );

    loop.start();

    dispatch(
      runCreditCheck({
        networkProvider: params.provider,
        productCode: params.productCode,
      })
    )
      .unwrap()
      .then((res) => {
        console.log("✅ CREDIT CHECK SUCCESS RESPONSE:", res);

        loop.stop();
       router.replace({
         pathname: "/(root)/loans/credit-check-success",
         params: {
           ...params,
           creditCheck: JSON.stringify(res), 
         },
       });

      })
      .catch((err) => {
        loop.stop();
        router.replace({
          pathname: "/(root)/loans/credit-check-fail",
          params: { ...params },
        });
      });

    return () => loop.stop();
  }, [dispatch, params.productCode, params.provider, router, progress]);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["20%", "85%"],
  });

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Credit Appraisal" />

      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-5">
          <LoanIcon width={70} height={70} />
        </View>

        <CustomText
          weight="bold"
          size="xl"
          className="text-center text-white mb-2"
        >
          Running Credit Appraisal...
        </CustomText>

        <CustomText
          size="sm"
          secondary
          className="text-center text-white/75 mb-8 leading-5"
        >
          We are assessing your credit worthiness for the salah loan. This may
          take a few moments
        </CustomText>

        <View className="w-full rounded-xl bg-primary-400 px-4 py-3">
          <View className="h-2 rounded-full bg-primary-500/40 overflow-hidden">
            <Animated.View
              className="h-full bg-primary-300"
              style={{ width: widthInterpolate }}
            />
          </View>

          <CustomText size="sm" secondary className="text-white/75 mt-3">
            Please wait while we process your {"\n"} application
          </CustomText>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CreditScore;
