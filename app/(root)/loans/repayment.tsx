import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Contacts from "expo-contacts";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import AmountInput from "@/app/components/inputs/AmountInput";
import {
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
} from "react-native";

import { providers, formatNigerianPhone } from "@/app/lib/utils";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { LoanRepayment } from "@/app/lib/thunks/loansThunks"
import CustomText from "@/app/components/CustomText";
import OtpInput from "@/app/components/inputs/OtpInput";
import Loading from "@/app/components/Loading";

export default function BuyAirtime() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const params = useLocalSearchParams();
    const cleanPin = (value: string) => value.replace(/\s/g, "");

    // ✅ Get loanId from navigation params
    const loanId = params.loanId as string;
    const [pin, setPin] = useState("");
    const [validating, setValidating] = useState(false);

    console.log(loanId)
    const [error, setError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorMessagePin, setErrorMessagePin] = useState("");
    const user = useAppSelector((state) => state.auth.user);

    const [phoneNumber, setPhoneNumber] = useState(user?.phone ?? "+234");
    const [amount, setAmount] = useState("");

    const generateIdempotencyKey = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const handlePinChange = (value: string) => {
        const trimmed = cleanPin(value);
        setPin(trimmed);

        if (error && trimmed.length === 4) {
            setError(false);
            setErrorMessagePin("");
        }
    };


    const handleContinue = async () => {
        setErrorMessage("");
        setErrorMessagePin("");

        if (!pin || pin.length !== 4) {
            setErrorMessagePin("Please enter a valid 4-digit PIN");
            setError(true);
            return;
        }

        // ✅ Validate amount
        const numericAmount = parseFloat(amount);

        if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
            setErrorMessage("Please enter a valid amount");
            return;
        }
        try {
            setValidating(true);
            console.log({ amount: numericAmount, idempotencyKey: generateIdempotencyKey(), loanId: loanId, narration: 'Early Repayment', transactionPin: pin })
            const res: any = await dispatch(LoanRepayment({ amount: numericAmount, idempotencyKey: generateIdempotencyKey(), loanId: loanId, narration: 'Early Repayment', transactionPin: pin })).unwrap();
            console.log(res)
            router.replace({
                pathname: "/(root)/loans/repayment-success",
                params: {
                    status: String(res?.status ?? res?.data?.status),
                    amount: String(res?.amountPaid ?? res?.data?.amountPaid),
                    oustanding: String(res?.outstandingBalance ?? res?.data?.outstandingBalance),
                    message: "Loan repayment submitted successfully.",
                },
            });
        } catch (error: any) {
            console.log(error)
            const message =
                error?.data?.message ||
                error?.message ||
                error?.payload ||
                "Loan repayment failed.";
            setErrorMessage(message);
            setValidating(false);
        }
    };
    return (
        <SafeAreaView className="flex-1 bg-primary-100">
            <Header title="Loan Repayment" showClose showBack={false} />
              <Loading visible={validating} />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View className="flex-1 p-4">
                        <View className="mb-6">
                            <Text className="text-white text-sm mb-3">Amount</Text>
                            <AmountInput value={amount} onChange={setAmount} placeholder="0" />
                            {errorMessage && (
                                <CustomText className="text-red-500 mt-2 text-sm" weight="medium">
                                    {errorMessage}
                                </CustomText>
                            )}
                        </View>

                        <View className="mb-6">
                            <Text className="text-white text-sm mb-3">Transaction PIN</Text>
                            <OtpInput
                                digitCount={4}
                                value={pin}
                                onChange={handlePinChange}
                                error={error}
                                inputStyle="w-20 h-16"
                            />
                            {errorMessage && (
                                <CustomText className="text-red-500 mt-2 text-sm" weight="medium">
                                    {errorMessage}
                                </CustomText>
                            )}
                        </View>

                        <View className="mt-auto pb-4">
                            <Button
                                title="Continue"
                                variant="primary"
                                onPress={handleContinue}
                                disabled={!phoneNumber || !amount}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );

}
