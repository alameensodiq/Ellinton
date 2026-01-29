import { View, StatusBar, Pressable, Animated, Easing } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/app/components/header-back";
import { svgIcons } from "@/app/assets/icons/icons";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";

import { fetchLoanProducts, LoanProduct } from "@/app/lib/thunks/loansThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useRouter } from "expo-router";

const LoanCardSkeleton = ({
  opacity,
}: {
  opacity: Animated.AnimatedInterpolation<string | number>;
}) => {
  return (
    <Animated.View
      style={{ opacity }}
      className="mb-4 rounded-2xl p-4 bg-primary-400 border border-transparent"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* icon circle */}
          <View className="bg-primary-300 p-2 rounded-full mr-3">
            <View className="w-5 h-5 rounded-full bg-white/20" />
          </View>

          <View className="flex-1">
            {/* title line */}
            <View className="h-4 w-48 rounded bg-white/20 mb-2" />
            {/* subtitle line */}
            <View className="h-3 w-56 rounded bg-white/15" />
          </View>
        </View>

        {/* radio circle */}
        <View className="w-5 h-5 rounded-full border-2 border-white/20" />
      </View>
    </Animated.View>
  );
};

const Loans = () => {
  const dispatch = useAppDispatch();
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);

  const {
    products,
    isLoading: loading,
    error,
  } = useAppSelector((state) => state.loans);
    console.log(products);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    dispatch(fetchLoanProducts());
  }, [dispatch]);

  useEffect(() => {
    if (!loading) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [loading, pulse]);

  const skeletonOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });
const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <Header title="Apply for loan" />

      <View className="px-6 mb-4">
        <CustomText size="base">
          Choose the Loan product that best suits your needs. Your data will be
          retrieved from our partners to determine your eligibility.
        </CustomText>
      </View>

      <View className="px-6 flex-1">
        {/* ✅ Skeleton loader (instead of ActivityIndicator) */}
        {loading && (
          <View className="mt-2">
            <LoanCardSkeleton opacity={skeletonOpacity} />
            <LoanCardSkeleton opacity={skeletonOpacity} />
            <LoanCardSkeleton opacity={skeletonOpacity} />
            <LoanCardSkeleton opacity={skeletonOpacity} />
          </View>
        )}

        {error && !loading && (
          <CustomText size="sm" className="text-red-500 mt-4">
            {error}
          </CustomText>
        )}

        {!loading &&
          !error &&
          products.map((loan: LoanProduct) => {
            const isSelected = selectedLoan === loan.productCode;
            const Icon = svgIcons.chip;

            return (
              <Pressable
                key={loan.id}
                onPress={() => setSelectedLoan(loan.productCode)}
                className={`mb-4 rounded-2xl p-4 bg-primary-400 border ${
                  isSelected ? "border-primary-600" : "border-transparent"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-primary-300 p-2 rounded-full mr-3">
                      <Icon width={20} height={20} />
                    </View>

                    <View className="flex-1">
                      <CustomText weight="bold" className="text-white">
                        {loan.name}
                      </CustomText>

                      <CustomText size="xs" className="text-white/70">
                        Product Code: {loan.productCode} • Inst:{" "}
                        {loan.institutionCode}
                      </CustomText>
                    </View>
                  </View>

                  <View
                    className={`w-5 h-5 rounded-full border-2 ${
                      isSelected
                        ? "border-primary-600 bg-primary-600"
                        : "border-white/40"
                    }`}
                  />
                </View>
              </Pressable>
            );
          })}

        {!loading && !error && products.length === 0 && (
          <CustomText size="sm" className="text-white/70 mt-6 text-center">
            No loan products found.
          </CustomText>
        )}
      </View>

      <View className="px-6 pb-6">
        <Button
          title="Continue"
          disabled={!selectedLoan || loading}
          onPress={()=>router.push("/(root)/loans/step2")}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
};

export default Loans;
