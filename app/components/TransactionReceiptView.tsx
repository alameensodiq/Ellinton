import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import { captureRef } from "react-native-view-shot";
import BottomSheet from "@/app/components/BottomSheet";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as Clipboard from "expo-clipboard";

export interface ReceiptViewData {
  amount?: number | string;
  type: string;
  status?: string;
  sender: string;
  beneficiary: string;
  beneficiaryAccount: string;
  beneficiaryBank: string;
  date: string;
  referenceNo: string;
  senderBank?: string;
  senderAccount?: string;
  sessionId?: string;
  narration?: string;
  remark?: string;
}

function getStatusDetails(status?: string) {
  const s = (status || "").toUpperCase();
  if (s.includes("FAIL") || s.includes("REJECT")) {
    return {
      icon: require("../assets/failedtrans.png"),
      label: "TRANSACTION FAILED",
    };
  }
  if (s.includes("PEND") || s.includes("PROCESS")) {
    return {
      icon: require("../assets/pendingtrans.png"),
      label: "TRANSACTION PENDING",
    };
  }
  if (s.includes("REVERS") || s.includes("REFUND")) {
    return {
      icon: require("../assets/reversedtrans.png"),
      label: "TRANSACTION REVERSED",
    };
  }
  return {
    icon: require("../assets/successtrans.png"),
    label: "TRANSACTION SUCCESSFUL",
  };
}

function formatAmount(val?: number | string) {
  if (val === undefined || val === null || val === "") return "0";
  const str = String(val).replace(/₦/g, "").replace(/,/g, "").trim();
  const num = parseFloat(str);
  if (isNaN(num)) return str;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

import { parseFlexibleDate } from "@/app/lib/utils";

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  const d = parseFlexibleDate(dateStr) || new Date(dateStr);
  if (!d || isNaN(d.getTime())) return dateStr;

  const day = d.getDate().toString().padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

const DetailRow = ({
  label,
  value,
  subValue,
  onCopy,
}: {
  label: string;
  value: string;
  subValue?: string;
  onCopy?: () => void;
}) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingVertical: 9,
    }}
  >
    <Text
      style={{
        fontSize: 14,
        fontWeight: "600",
        color: "#2B2D12",
        flex: 1,
      }}
    >
      {label}
    </Text>
    <View style={{ flex: 1.6, alignItems: "flex-end" }}>
      <TouchableOpacity
        disabled={!onCopy}
        onPress={onCopy}
        activeOpacity={0.7}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "#1C1E0A",
            textAlign: "right",
          }}
        >
          {value}
        </Text>
        {onCopy && (
          <Ionicons
            name="copy-outline"
            size={15}
            color="#1C1E0A"
            style={{ marginLeft: 6 }}
          />
        )}
      </TouchableOpacity>
      {!!subValue && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: "#3B3D14",
            textAlign: "right",
            marginTop: 2,
          }}
        >
          {subValue}
        </Text>
      )}
    </View>
  </View>
);

const ScallopedEdge = ({
  backgroundColor = "#FAF9EE",
}: {
  backgroundColor?: string;
}) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-around",
      overflow: "hidden",
      height: 14,
      marginTop: 24,
      marginBottom: -7,
      width: "100%",
    }}
  >
    {Array.from({ length: 22 }).map((_, i) => (
      <View
        key={i}
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: backgroundColor,
        }}
      />
    ))}
  </View>
);

export default function TransactionReceiptView({
  receiptData,
  onBack,
}: {
  receiptData: ReceiptViewData;
  onBack: () => void;
}) {
  const fullViewRef = useRef<View>(null);
  const [shareBottomSheetVisible, setShareBottomSheetVisible] = useState(false);

  const handleSharePress = () => setShareBottomSheetVisible(true);
  const closeBottomSheet = () => setShareBottomSheetVisible(false);

  const statusInfo = getStatusDetails(receiptData.status);
  const formattedDate =
    formatDate(receiptData.date) ||
    receiptData.date ||
    formatDate(new Date().toISOString());

  const senderAccountAndBank = [
    receiptData.senderAccount,
    receiptData.senderBank,
  ]
    .filter(Boolean)
    .join(" | ");

  console.log(senderAccountAndBank)

  const beneficiaryAccountAndBank = [
    receiptData.beneficiaryAccount,
    receiptData.beneficiaryBank,
  ]
    .filter(Boolean)
    .join(" | ");

  const copyReference = async () => {
    if (receiptData.referenceNo) {
      await Clipboard.setStringAsync(receiptData.referenceNo);
      Alert.alert("Copied", "Reference number copied to clipboard.");
    }
  };

  const shareAsImage = async () => {
    try {
      if (!fullViewRef.current) return;

      const uri = await captureRef(fullViewRef.current, {
        format: "png",
        quality: 1.0,
      });

      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share Receipt Image",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device.");
      }

      closeBottomSheet();
    } catch (error) {
      console.error("Error sharing image:", error);
      Alert.alert("Error", "Failed to capture and share image.");
    }
  };

  const shareAsPdf = async () => {
    try {
      if (!fullViewRef.current) return;

      const imageBase64 = await captureRef(fullViewRef.current, {
        format: "png",
        quality: 1.0,
        result: "base64",
      });

      const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            *, *:before, *:after {
              box-sizing: border-box;
            }
            html, body { 
              margin: 0; 
              padding: 0; 
              width: 100%;
              height: 100%;
              background-color: #FAF9EE; 
              display: flex;
              justify-content: center;
              align-items: center;
              overflow: hidden;
            }
            .receipt-wrapper {
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 0;
              box-sizing: border-box;
              overflow: hidden;
            }
            img { 
              max-width: 100%;
              max-height: 800px;
              width: auto;
              height: auto;
              object-fit: contain;
              display: block; 
              margin: 0 auto;
              page-break-before: avoid !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          <div class="receipt-wrapper">
            <img src="data:image/png;base64,${imageBase64}" />
          </div>
        </body>
      </html>
    `;

      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false,
      });

      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Transaction Receipt",
        UTI: "com.adobe.pdf",
      });

      closeBottomSheet();
    } catch (error) {
      console.error("PDF Error:", error);
      Alert.alert("Error", "Failed to generate PDF. Sharing as image instead.");
      shareAsImage();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF9EE" }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        <TouchableOpacity
          onPress={onBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.05)",
            marginTop: 8,
            marginBottom: 12,
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#1C1E0A" />
        </TouchableOpacity>

        {/* Capturable Receipt Container */}
        <View
          ref={fullViewRef}
          collapsable={false}
          style={{
            backgroundColor: "#FAF9EE",
            paddingTop: 8,
            paddingHorizontal: 4,
            paddingBottom: 4,
          }}
        >
          {/* Top Floating Badge with Logo */}
          <View style={{ alignItems: "center", zIndex: 10, marginBottom: -30 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#333517",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Image
                source={require("../assets/receiptlogo.png")}
                style={{ width: 34, height: 34 }}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Olive Receipt Card */}
          <View
            style={{
              backgroundColor: "#74782B",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingHorizontal: 22,
              paddingTop: 44,
              paddingBottom: 0,
              overflow: "hidden",
            }}
          >
            {/* Status Header */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Image
                source={statusInfo.icon}
                style={{ width: 22, height: 22, marginRight: 8 }}
                resizeMode="contain"
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#1C1E0A",
                  letterSpacing: 0.6,
                }}
              >
                {statusInfo.label}
              </Text>
            </View>

            {/* Main Amount */}
            <Text
              style={{
                fontSize: 34,
                fontWeight: "800",
                color: "#1C1E0A",
              }}
            >
              ₦ {formatAmount(receiptData.amount)}
            </Text>

            {/* Date & Time */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: "#454817",
                marginTop: 4,
                marginBottom: 20,
              }}
            >
              {formattedDate}
            </Text>

            {/* Horizontal Line Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: "rgba(28, 30, 10, 0.14)",
                marginBottom: 20,
              }}
            />

            {/* Section Title */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#1C1E0A",
                letterSpacing: 0.6,
                marginBottom: 12,
              }}
            >
              TRANSACTION DETAILS
            </Text>

            {/* Details Rows */}
            <DetailRow
              label="Transaction type"
              value={receiptData.type || "Credit"}
            />

            {!!receiptData.referenceNo && (
              <DetailRow
                label="Reference No."
                value={receiptData.referenceNo}
                onCopy={copyReference}
              />
            )}

            {!!receiptData.sessionId && (
              <DetailRow
                label="Session ID"
                value={receiptData.sessionId}
              />
            )}

            {!!(receiptData.narration || receiptData.remark) && (
              <DetailRow
                label="Narration"
                value={receiptData.narration || receiptData.remark || ""}
              />
            )}

            {!!receiptData.sender && (
              <DetailRow
                label="Sender Details"
                value={receiptData.sender.toUpperCase()}
                subValue={senderAccountAndBank || undefined}
              />
            )}


            {!!receiptData.beneficiary && (
              <DetailRow
                label="Recipient Details"
                value={receiptData.beneficiary.toUpperCase()}
                subValue={beneficiaryAccountAndBank || undefined}
              />
            )}

            {/* Disclaimer & Legal Text */}
            <View style={{ marginTop: 24, paddingBottom: 4 }}>
              <Text
                style={{
                  fontSize: 11,
                  lineHeight: 16,
                  color: "#4A4D1A",
                  marginBottom: 12,
                }}
              >
                Disclaimer: This transaction is subject to standard bank verification. While successfully processed, completion may be affected by external factors beyond our control. The Bank assumes no liability for such factors.
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  lineHeight: 16,
                  color: "#4A4D1A",
                  marginBottom: 12,
                }}
              >
                Ellington Microfinance Bank is licensed by the Central Bank of Nigeria (CBN) and insured by the Nigerian Deposits Insurance Corporation (NDIC).
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  lineHeight: 16,
                  color: "#4A4D1A",
                }}
              >
                Contact Support: support@ellingtonbank.com. +234-8000000000
              </Text>
            </View>

            {/* Bottom Scalloped Sawtooth Edge */}
            <ScallopedEdge backgroundColor="#FAF9EE" />
          </View>
        </View>

        {/* Share Button Below Receipt Card */}
        <View style={{ marginTop: 20, marginBottom: 12 }}>
          <Button
            title="Share receipt"
            variant="secondary"
            onPress={handleSharePress}
            className="rounded-2xl flex-row justify-center"
            icon={<Ionicons name="share-outline" size={20} color="#2a2a1a" />}
          />
        </View>
      </ScrollView>

      {/* Share Options Bottom Sheet */}
      <BottomSheet
        visible={shareBottomSheetVisible}
        onClose={closeBottomSheet}
        title="Share Receipt"
        hideshowButton
      >
        <TouchableOpacity
          className="flex-row items-center justify-center py-4"
          onPress={shareAsPdf}
        >
          <Ionicons name="document-text-outline" size={24} color="#FFF" />
          <Text className="text-lg font-semibold text-white ml-2">PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-center py-4"
          onPress={shareAsImage}
        >
          <Ionicons name="image-outline" size={24} color="#FFF" />
          <Text className="text-lg font-semibold text-white ml-2">Image</Text>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}
