import React, { useState, useRef, useEffect } from "react";
import { View, TextInput } from "react-native";

interface OtpInputProps {
  digitCount?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
  inputStyle?: string;
  secure?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  showSoftInputOnFocus?: boolean;
  caretHidden?: boolean;
textContentType?: "oneTimeCode";
autoComplete?: "sms-otp";
}

const OtpInput: React.FC<OtpInputProps> = ({
  digitCount = 6,
  value,
  onChange,
  error = false,
  autoFocus = true,
  inputStyle = "w-14 h-14 ",
  secure = false,
  onFocus,
  onBlur,
  showSoftInputOnFocus = true,
  caretHidden = false,
  textContentType = "oneTimeCode",
  autoComplete = "sms-otp"
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    const newValue = value.split("");
    newValue[index] = text;
    onChange(newValue.join(""));

    if (text && index < digitCount - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };


  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  return (
    <View className="space-y-4">
      <View className="flex-row justify-between">
        {Array.from({ length: digitCount }, (_, index) => (
          <TextInput
            key={index}
            ref={(ref: any) => (inputRefs.current[index] = ref)}
            className={`${inputStyle} text-center rounded-2xl text-white text-lg font-semibold bg-primary-400 border-2 border-primary-300 ${
              error
                ? "border-2 border-red-500  text-white"
                : "bg-primary-400 text-white"
            }`}
            value={value[index] || ""}
            onChangeText={(text) =>
              handleChange(text.replace(/[^0-9]/g, ""), index)
            }
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
            secureTextEntry={secure}
            onFocus={onFocus}
            onBlur={onBlur}
            showSoftInputOnFocus={showSoftInputOnFocus}
            caretHidden={caretHidden}
            textContentType={textContentType as any}
            autoComplete={autoComplete}
          />
        ))}
      </View>
    </View>
  );
};

export default OtpInput;
