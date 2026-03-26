import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Share,
  Image,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import { captureRef } from "react-native-view-shot";
import BottomSheet from "@/app/components/BottomSheet";
import * as Sharing from "expo-sharing";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

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
}

function toAscii(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "?");
}

function escapePdfText(value: string) {
  return toAscii(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function base64ToHex(base64: string) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let buffer = 0;
  let bits = 0;
  let hex = "";

  for (const char of base64.replace(/\s+/g, "")) {
    if (char === "=") break;

    const value = chars.indexOf(char);
    if (value < 0) continue;

    buffer = (buffer << 6) | value;
    bits += 6;

    while (bits >= 8) {
      bits -= 8;
      const byte = (buffer >> bits) & 0xff;
      hex += byte.toString(16).padStart(2, "0").toUpperCase();
    }
  }

  return hex;
}

// function buildReceiptPdf(
//   lines: string[],
//   logo?: {
//     hex: string;
//     width: number;
//     height: number;
//   }
// ) {
//   const imageWidth = 180;
//   const imageHeight = logo ? (logo.height / logo.width) * imageWidth : 0;
//   const textStartY = logo ? 700 : 780;
//   const contentLines = [
//     ...(logo
//       ? [
//           "q",
//           `${imageWidth} 0 0 ${imageHeight.toFixed(2)} 50 740 cm`,
//           "/Im1 Do",
//           "Q",
//         ]
//       : []),
//     "BT",
//     "/F1 12 Tf",
//     `50 ${textStartY} Td`,
//     "16 TL",
//     ...lines.map((line, index) =>
//       index === 0 ? `(${escapePdfText(line)}) Tj` : `T* (${escapePdfText(line)}) Tj`
//     ),
//     "ET",
//   ];

//   const stream = `${contentLines.join("\n")}\n`;
//   const objects = [
//     "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
//     "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n",
//     `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >>${
//       logo ? " /XObject << /Im1 5 0 R >>" : ""
//     } >> /Contents ${logo ? "6" : "5"} 0 R >>\nendobj\n`,
//     "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
//     ...(logo
//       ? [
//           `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${logo.hex.length + 1} >>\nstream\n${logo.hex}>\nendstream\nendobj\n`,
//           `6 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`,
//         ]
//       : [`5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`]),
//   ];

//   let pdf = "%PDF-1.4\n";
//   const offsets = [0];

//   objects.forEach((object) => {
//     offsets.push(pdf.length);
//     pdf += object;
//   });

//   const xrefOffset = pdf.length;
//   pdf += `xref\n0 ${objects.length + 1}\n`;
//   pdf += "0000000000 65535 f \n";
//   offsets.slice(1).forEach((offset) => {
//     pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
//   });
//   pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

//   return pdf;
// }

// USE THIS VERSION FOR EXACT ALIGNMENT
function buildReceiptPdf(
  lines: string[],
  logo?: { hex: string; width: number; height: number }
) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  const content = [];

  // Helper for text escaping
  const esc = (t: string) => t.replace(/[\\()]/g, "\\$&");

  // 1. HEADER (LOGO LEFT, TITLE RIGHT)
  if (logo) {
    const logoW = 80;
    const logoH = (logo.height / logo.width) * logoW;
    content.push(
      `q 1 0 0 1 ${margin} ${pageHeight - margin - logoH} cm ${logoW} 0 0 ${logoH} 0 0 cm /Im1 Do Q`
    );
  }

  content.push("BT");
  content.push("/F2 14 Tf 0.2 rg"); // Helvetica-Bold
  // Move to right side for Title
  content.push(
    `${pageWidth - margin - 180} ${pageHeight - margin - 20} Td (TRANSACTION RECEIPT) Tj`
  );
  content.push("ET");

  // 2. GREEN/RED ACCENT BAR
  const statusLine = lines.find((l) => l.startsWith("Status:")) || "";
  const isSuccessful = statusLine.includes("SUCCESSFUL");
  content.push(
    `q ${isSuccessful ? "0.1 0.5 0.1" : "0.8 0.1 0.1"} rg ${margin} ${pageHeight - 160} 3 50 re f Q`
  );

  // 3. TOTAL AMOUNT
  const amountLine =
    (lines.find((l) => l.startsWith("Amount:")) || "").split(": ")[1] || "0.00";
  content.push("BT");
  content.push(
    `${margin + 15} ${pageHeight - 130} Td /F1 9 Tf 0.5 rg (TOTAL AMOUNT) Tj`
  );
  content.push(`0 -25 Td /F2 22 Tf 0 rg (${esc(amountLine)}) Tj`);
  content.push("ET");

  // 4. DATA GRID (Key-Value Alignment)
  // We use a fixed displacement to ensure keys and values line up perfectly
  let currentY = pageHeight - 200;
  const dataKeys = ["Date", "Reference", "Type", "Status"];

  dataKeys.forEach((key) => {
    const val =
      (lines.find((l) => l.startsWith(`${key}:`)) || "").split(": ")[1] || "";
    content.push(
      `BT ${margin} ${currentY} Td /F2 9 Tf 0.3 rg (${key.toUpperCase()}) Tj ET`
    );
    content.push(
      `BT ${margin + 100} ${currentY} Td /F1 10 Tf 0 rg (${esc(val)}) Tj ET`
    );
    currentY -= 18;
  });

  // 5. TRANSFER DETAILS
  currentY -= 20;
  content.push(
    `BT ${margin} ${currentY} Td /F2 11 Tf 0.2 rg (TRANSFER DETAILS) Tj ET`
  );

  currentY -= 25;
  const sender =
    (lines.find((l) => l.startsWith("Sender:")) || "").split(": ")[1] || "";
  content.push(`BT ${margin} ${currentY} Td /F1 9 Tf 0.5 rg (FROM) Tj ET`);
  content.push(
    `BT ${margin + 100} ${currentY} Td /F1 10 Tf 0 rg (${esc(sender)}) Tj ET`
  );

  currentY -= 25;
  const beneficiary =
    (lines.find((l) => l.startsWith("Beneficiary:")) || "").split(": ")[1] ||
    "";
  const acc =
    (lines.find((l) => l.startsWith("Account:")) || "").split(": ")[1] || "";
  const bank =
    (lines.find((l) => l.startsWith("Bank:")) || "").split(": ")[1] || "";

  content.push(`BT ${margin} ${currentY} Td /F1 9 Tf 0.5 rg (TO) Tj ET`);
  content.push(
    `BT ${margin + 100} ${currentY} Td /F1 10 Tf 0 rg (${esc(beneficiary)}) Tj`
  );
  content.push(`0 -12 Td (${esc(acc)}) Tj`);
  content.push(`0 -12 Td (${esc(bank)}) Tj ET`);

  // 6. FOOTER
  content.push(`BT 1 0 0 1 0 0 Tm /F1 8 Tf 0.6 rg`);
  content.push(
    `${margin} ${margin} Td (This is a secure electronic receipt from Ellington Bank. No signature required.) Tj ET`
  );

  const stream = content.join("\n");
  // ... rest of your object/xref logic
}

const ReceiptRow = ({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) => (
  <View className="flex-row justify-between items-center py-4 border-b border-primary-300">
    <Text className="text-accent-100 text-sm">{label}</Text>
    <Text
      className={`text-sm font-semibold max-w-44 ${
        label === "Status" && value === "SUCCESSFUL"
          ? "text-green-200 bg-green-100 rounded-xl px-2 py-1"
          : highlight
            ? "text-accent-100"
            : "text-white"
      }`}
    >
      {value}
    </Text>
  </View>
);

export default function TransactionReceiptView({
  receiptData,
  onBack
}: {
  receiptData: ReceiptViewData;
  onBack: () => void;
}) {
  const fullViewRef = useRef<View>(null);
  const [shareBottomSheetVisible, setShareBottomSheetVisible] = useState(false);

  const handleSharePress = () => setShareBottomSheetVisible(true);
  const closeBottomSheet = () => setShareBottomSheetVisible(false);

  const shareAsImage = async () => {
    try {
      if (!fullViewRef.current) return;

      const uri = await captureRef(fullViewRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile"
      });

      await Share.share({
        url: `file://${uri}`,
        message: `Transfer Receipt\nAmount: ₦${receiptData.amount}\nTo: ${receiptData.beneficiary}\nReference: ${receiptData.referenceNo}`
      });

      closeBottomSheet();
    } catch (error) {
      console.error("Error sharing image:", error);
      Alert.alert("Error", "Failed to capture and share image.");
    }
  };

  const shareAsPdf = async () => {
    try {
      let RNFS: any;
      try {
        const rnfsModule = require("react-native-fs");
        RNFS = rnfsModule.default ?? rnfsModule;
      } catch {
        Alert.alert(
          "Unavailable",
          "PDF receipt sharing is not supported in Expo Go. Use a development build to enable PDF export."
        );
        return;
      }

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        Alert.alert(
          "Unavailable",
          "PDF sharing is not available on this device."
        );
        return;
      }

      const pdfLines = [
        "Ellington Bank Transaction Receipt",
        "",
        `Amount: NGN ${toAscii(String(receiptData.amount ?? ""))}`,
        `Type: ${toAscii(receiptData.type)}`,
        `Status: ${toAscii(receiptData.status || "")}`,
        `Sender: ${toAscii(receiptData.sender)}`,
        `Beneficiary: ${toAscii(receiptData.beneficiary)}`,
        `Beneficiary account: ${toAscii(receiptData.beneficiaryAccount)}`,
        `Beneficiary bank: ${toAscii(receiptData.beneficiaryBank)}`,
        `Date: ${toAscii(receiptData.date)}`,
        `Reference No: ${toAscii(receiptData.referenceNo)}`
      ].filter((line) => !line.endsWith(": "));

      const logoAsset = Image.resolveAssetSource(
        require("../assets/logo1.png")
      );
      const logoImage = await manipulateAsync(
        logoAsset.uri,
        [{ resize: { width: 224 } }],
        {
          compress: 1,
          format: SaveFormat.JPEG,
          base64: true
        }
      );

      const pdfContents = buildReceiptPdf(
        pdfLines,
        logoImage.base64
          ? {
              hex: base64ToHex(logoImage.base64),
              width: logoImage.width,
              height: logoImage.height
            }
          : undefined
      );
      const filePath = `${RNFS.CachesDirectoryPath}/transfer-receipt-${Date.now()}.pdf`;

      await RNFS.writeFile(filePath, pdfContents, "ascii");
      await Sharing.shareAsync(`file://${filePath}`, {
        mimeType: "application/pdf",
        dialogTitle: "Share Receipt",
        UTI: "com.adobe.pdf"
      });

      closeBottomSheet();
    } catch (error) {
      console.error("Error sharing PDF:", error);
      Alert.alert("Error", "Failed to generate and share PDF receipt.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        <TouchableOpacity
          onPress={onBack}
          className="w-10 h-10 rounded-full items-center justify-center bg-primary-400 mt-2"
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Image
          source={require("../assets/logo1.png")}
          style={{ width: 100, height: 100, marginTop: 16 }}
          resizeMode="contain"
        />

        <View ref={fullViewRef} collapsable={false}>
          <View className="bg-primary-400 rounded-2xl p-6 mt-4">
            <ReceiptRow label="Amount" value={`₦${receiptData.amount ?? ""}`} />
            <ReceiptRow label="Type" value={receiptData.type} />
            <ReceiptRow
              label="Status"
              value={receiptData.status || ""}
              highlight
            />
            <ReceiptRow label="Sender" value={receiptData.sender} />
            {!!receiptData.beneficiary && (
              <ReceiptRow label="Beneficiary" value={receiptData.beneficiary} />
            )}
            {!!receiptData.beneficiaryAccount && (
              <ReceiptRow
                label="Beneficiary account"
                value={receiptData.beneficiaryAccount}
              />
            )}
            {!!receiptData.beneficiaryBank && (
              <ReceiptRow
                label="Beneficiary bank"
                value={receiptData.beneficiaryBank}
              />
            )}
            <ReceiptRow label="Date" value={receiptData.date} />

            <View className="flex-row justify-between items-center py-4">
              <Text className="text-accent-100 text-sm">Reference No.</Text>
              <View className="flex-row items-center">
                <Text className="text-white text-base font-semibold mr-2 max-w-44">
                  {receiptData.referenceNo}
                </Text>
                <TouchableOpacity>
                  <Ionicons name="copy-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View className="px-0 pb-6 mt-6 mb-8">
          <Button
            title="Share receipt"
            variant="secondary"
            onPress={handleSharePress}
            className="rounded-2xl flex-row justify-center"
            icon={<Ionicons name="share-outline" size={20} color="#2a2a1a" />}
          />
        </View>
      </ScrollView>

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
