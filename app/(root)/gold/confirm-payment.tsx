import React, { useMemo } from "react";
import { View, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import AmountCard from "@/app/components/home/cards/AmountCard";
import CustomText from "@/app/components/CustomText"; 

const toNumber = (s: string) => Number((s || "").replace(/,/g, "")) || 0;

const formatMoney = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

function numberToWords(num: number) {
  const n = Math.floor(Math.abs(num));
  if (n === 0) return "zero";

  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  const chunkToWords = (x: number) => {
    let out: string[] = [];
    const hundred = Math.floor(x / 100);
    const rest = x % 100;

    if (hundred) out.push(ones[hundred], "hundred");

    if (rest >= 10 && rest < 20) {
      out.push(teens[rest - 10]);
      return out.join(" ");
    }

    const t = Math.floor(rest / 10);
    const o = rest % 10;

    if (t) out.push(tens[t]);
    if (o) out.push(ones[o]);

    return out.join(" ").trim();
  };

  const parts: string[] = [];

  const billions = Math.floor(n / 1_000_000_000);
  const millions = Math.floor((n % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1_000);
  const remainder = n % 1_000;

  if (billions) parts.push(chunkToWords(billions), "billion");
  if (millions) parts.push(chunkToWords(millions), "million");
  if (thousands) parts.push(chunkToWords(thousands), "thousand");
  if (remainder) parts.push(chunkToWords(remainder));

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

const moneyWords = (n: number) => `${numberToWords(n)} naira`;

function Row({
  label,
  value,
  words,
  noBorder,
}: {
  label: string;
  value: string;
  words: string;
  noBorder?: boolean;
}) {
  return (
    <View className={`py-4 ${noBorder ? "" : "border-b border-white/10"}`}>
      <View className="flex-row items-center justify-between">
        <CustomText className="text-white/80 mb-0" size="base" weight="regular">
          {label}
        </CustomText>

        <CustomText className="mb-0" size="base" weight="bold">
          {value}
        </CustomText>
      </View>

      <CustomText
        className="text-white/50 mt-1 mb-0"
        size="xs"
        weight="regular"
      >
        {words}
      </CustomText>
    </View>
  );
}

export default function ConfirmPayment() {
  const params = useLocalSearchParams<Record<string, string>>();
  const router = useRouter();

  const transactionType = params.type === "sell" ? "sell" : params.type === "withdraw" ? "withdraw" : "buy";
  const transactionTitle = transactionType === "sell" ? "Sell Gold" : transactionType === "withdraw" ? "Withdraw Gold" : "Buy Gold";
  const deliveryAddress = params.delivery_address || "";

  const amountFormatted = params.amount || "0";
  const amountRaw = params.amountRaw || amountFormatted;
  const gramsParam = params.grams || "0";

  const amount = useMemo(() => toNumber(amountRaw), [amountRaw]);

  const taxRate = 0.05;
  const tax = useMemo(() => Math.round(amount * taxRate), [amount]);
  const goldValue = useMemo(() => Math.max(amount - tax, 0), [amount, tax]);

  const gramsText = useMemo(() => {
    const g = Number(gramsParam) || 0;
    return g.toFixed(2);
  }, [gramsParam]);

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title={`Confirm ${transactionTitle.toLowerCase()}`} />

      <View className="flex-1 px-6 pt-6">
        <View className="mb-4">
          <AmountCard
            amount={`${amountFormatted}`}
            description={moneyWords(amount)}
          />
        </View>

        <View className="rounded-2xl bg-primary-400 px-5 py-2 mb-6">
          <Row
            label="Amount Payable"
            value={`₦${formatMoney(amount)}`}
            words={moneyWords(amount)}
          />

          <View className="py-4 border-b border-white/10">
            <View className="flex-row items-center justify-between">
              <CustomText className="text-white/80 mb-0" size="base">
                Gold Quantity
              </CustomText>

              <CustomText className="mb-0" size="base" weight="bold">
                {gramsText} gms
              </CustomText>
            </View>

            <CustomText className="text-white/50 mt-1 mb-0" size="xs">
              {gramsText} grams
            </CustomText>
          </View>

          <Row
            label="Gold Value"
            value={`₦${formatMoney(goldValue)}`}
            words={moneyWords(goldValue)}
          />

          <Row
            label="Bank Tax (5%)"
            value={`₦${formatMoney(tax)}`}
            words={moneyWords(tax)}
          />

          <Row
            label="Net Amount Payable"
            value={`₦${formatMoney(amount)}`}
            words={moneyWords(amount)}
            noBorder
          />
        </View>

        <View className="flex-1 justify-end pb-8">
          <Button
            title={transactionTitle}
            variant="primary"
            onPress={() =>
              router.push({
                pathname: "/(root)/gold/authorize",
                params: {
                  amount: String(amountFormatted),
                  grams: String(gramsText),
                  amountRaw: String(amount),
                  tax: String(tax),
                  goldValue: String(goldValue),
                  type: String(transactionType),
                  delivery_address: deliveryAddress,
                },
              })
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
