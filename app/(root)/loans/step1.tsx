// app/(root)/loans/index.tsx  (STEP 1)

import {
  View,
  StatusBar,
  Pressable,
  Animated,
  Easing,
  ScrollView,
} from "react-native";
import React, { useEffect, useRef, useState, useMemo } from "react";
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
      className="mb-4 rounded-3xl p-4 bg-primary-400 border border-transparent"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center flex-1 pr-4">
          <View className="bg-primary-300/80 w-12 h-12 rounded-full items-center justify-center mr-3">
            <View className="w-5 h-5 rounded-full bg-white/20" />
          </View>

          <View className="flex-1">
            <View className="h-5 w-36 rounded bg-white/20 mb-2" />
            <View className="h-4 w-24 rounded-full bg-white/15" />
          </View>
        </View>

        <View className="w-6 h-6 rounded-full border border-white/20" />
      </View>

      <View className="mt-4">
        <View className="h-4 w-full rounded bg-white/15 mb-2" />
        <View className="h-4 w-32 rounded bg-white/15" />
        <View className="h-5 w-28 rounded bg-white/20 mt-4" />
      </View>
    </Animated.View>
  );
};

const Loans = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);

  const {
    products,
    isLoading: loading,
    error,
  } = useAppSelector((state) => state.loans);

  const pulse = useRef(new Animated.Value(0)).current;

  const LoanApprove = svgIcons.loanApprove;
  const Condition1 = svgIcons.loanCondtion1;
  const Condition2 = svgIcons.loanCondtion2;
  const Condition3 = svgIcons.loanCondtion3;
  const icons = [Condition1, LoanApprove, Condition2, Condition3];

  const getProductCode = (product: LoanProduct) =>
    String(product.code ?? product.productCode ?? "");

  const formatAmount = (value?: string) => {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return "N0";
    }

    return `N${amount.toLocaleString()}`;
  };

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

  const visibleProducts = useMemo(
    () =>
      products.filter(
        (product: LoanProduct) =>
          !product.name?.toLowerCase().includes("bnpl")
      ),
    [products]
  );

  const selectedProduct = useMemo(() => {
    if (!selectedLoan) return null;
    return (
      visibleProducts.find(
        (p: LoanProduct) => getProductCode(p) === selectedLoan
      ) || null
    );
  }, [visibleProducts, selectedLoan]);

  const handleContinue = () => {
    if (!selectedProduct) return;

    router.push({
      pathname: "/(root)/loans/step4",
      params: {
        productCode: getProductCode(selectedProduct),
        name: selectedProduct.name,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <Header title="Apply for loan" />

      <View className="px-6 pt-2 mb-4">
        <CustomText size="base">
          Choose the Loan product that best suits your needs. Your data will be
          retrieved from our partners to determine your eligibility.
        </CustomText>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View className="mt-2">
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
          visibleProducts.map((loan: LoanProduct, index: number) => {
            const productCode = getProductCode(loan);
            const isSelected = selectedLoan === productCode;
            const Icon = icons[index % icons.length];
            const tenor = loan.tenure ?? loan.tenor_options?.[0];
            const interestRate = Number(loan.interest_rate ?? 0);
            const rangeLabel = `${formatAmount(loan.min_amount)}-${formatAmount(
              loan.max_amount
            )}`;
            const description =
              loan.description || "Quick cash for immediate needs";

            return (
              <Pressable
                key={loan.id}
                onPress={() => setSelectedLoan(productCode)}
                className={`mb-4 rounded-3xl p-4 bg-primary-400 border ${
                  isSelected ? "border-primary-200" : "border-transparent"
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className="bg-primary-300/80 w-12 h-12 rounded-full items-center justify-center mr-3">
                      <Icon width={20} height={20} />
                    </View>

                    <View className="flex-1">
                      <CustomText weight="bold" className="text-white mb-1">
                        {loan.name}
                      </CustomText>

                      <View className="self-start rounded-full bg-primary-300/70 px-3 py-1">
                        <CustomText size="xs" className="text-white/80 mb-0">
                          {interestRate.toFixed(1)}% {tenor ? `${tenor} days` : ""}
                        </CustomText>
                      </View>
                    </View>
                  </View>

                  <View
                    className={`w-7 h-7 rounded-full border items-center justify-center ${
                      isSelected
                        ? "border-primary-200 bg-primary-200"
                        : "border-primary-300"
                    }`}
                  >
                    {isSelected && (
                      <View className="w-3 h-3 rounded-full bg-white" />
                    )}
                  </View>
                </View>

                <View className="mt-4">
                  <CustomText size="sm" className="text-white/70 leading-5 mb-2">
                    {description}
                  </CustomText>

                  <CustomText weight="bold" className="text-white mb-0">
                    {rangeLabel}
                  </CustomText>
                </View>
              </Pressable>
            );
          })}

        {!loading && !error && visibleProducts.length === 0 && (
          <CustomText size="sm" className="text-white/70 mt-6 text-center">
            No loan products found.
          </CustomText>
        )}
      </ScrollView>

      <View className="px-6 pb-6 pt-2">
        <Button
          title="Continue"
          disabled={!selectedProduct || loading}
          onPress={handleContinue}
          variant="primary"
          className="py-5"
        />
      </View>
    </SafeAreaView>
  );
};

export default Loans;
