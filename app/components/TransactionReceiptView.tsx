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

function buildReceiptPdf(
  lines: string[],
  logo?: {
    hex: string;
    width: number;
    height: number;
  }
) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;

  // Calculate logo dimensions
  const logoWidth = 120;
  const logoHeight = logo ? (logo.height / logo.width) * logoWidth : 0;
  const logoX = (pageWidth - logoWidth) / 2;
  const logoY = pageHeight - margin - 20;

  // Extract data from lines
  const title = lines[0];
  const dateLine = lines.find((l) => l.startsWith("Date:")) || "";
  const refLine = lines.find((l) => l.startsWith("Reference:")) || "";
  const amountLine = lines.find((l) => l.startsWith("Amount:")) || "";
  const typeLine = lines.find((l) => l.startsWith("Type:")) || "";
  const statusLine = lines.find((l) => l.startsWith("Status:")) || "";
  const senderLine = lines.find((l) => l.startsWith("Sender:")) || "";
  const beneficiaryLine = lines.find((l) => l.startsWith("Beneficiary:")) || "";
  const accountLine = lines.find((l) => l.startsWith("Account:")) || "";
  const bankLine = lines.find((l) => l.startsWith("Bank:")) || "";

  const status = statusLine.split(": ")[1] || "";
  const isSuccessful = status === "SUCCESSFUL";

  // Start building PDF content
  const content = [];

  // Add logo
  if (logo) {
    content.push("q");
    content.push(
      `${logoWidth} 0 0 ${logoHeight.toFixed(2)} ${logoX} ${logoY} cm`
    );
    content.push("/Im1 Do");
    content.push("Q");
  }

  // Start text
  content.push("BT");

  // Title
  const titleY = logo ? logoY - logoHeight - 25 : pageHeight - margin - 30;
  content.push("/F2 20 Tf");
  content.push(`${margin} ${titleY} Td`);
  content.push(`(${escapePdfText(title)}) Tj`);

  // Subtitle
  content.push("/F1 9 Tf");
  content.push(`0 -12 Td`);
  content.push(`(${escapePdfText("OFFICIAL TRANSACTION RECEIPT")}) Tj`);

  // Divider
  content.push(`0 -15 Td`);
  content.push("0.8 0.8 0.8 rg");
  content.push(`${margin} ${titleY - 45} ${pageWidth - margin * 2} 0.5 re`);
  content.push("f");
  content.push("0 0 0 rg");

  // Date and Reference row
  content.push(`0 -25 Td`);
  content.push("/F1 9 Tf");
  content.push(`(${escapePdfText(dateLine)}) Tj`);
  content.push(`0 -12 Td`);
  content.push(`(${escapePdfText(refLine)}) Tj`);

  // Main card background (light gray)
  const cardY = titleY - 95;
  content.push("q");
  content.push("0.96 0.96 0.96 rg");
  content.push(`${margin} ${cardY - 5} ${pageWidth - margin * 2} 210 re`);
  content.push("f");
  content.push("Q");

  // Amount section (highlighted)
  content.push(`0 -25 Td`);
  content.push("/F2 28 Tf");
  content.push(`(${escapePdfText(amountLine.split(": ")[0] + ":")}) Tj`);
  content.push("/F2 32 Tf");
  content.push(` ${escapePdfText(amountLine.split(": ")[1])} Tj`);

  // Type and Status row
  content.push(`0 -35 Td`);
  content.push("/F1 11 Tf");
  content.push(`(${escapePdfText(typeLine)}) Tj`);

  // Status with color
  if (isSuccessful) {
    content.push("0.2 0.6 0.2 rg");
  } else {
    content.push("0.8 0.4 0.2 rg");
  }
  content.push(` ${escapePdfText(statusLine)} Tj`);
  content.push("0 0 0 rg");

  // Divider line
  content.push(`0 -15 Td`);
  content.push("0.9 0.9 0.9 rg");
  content.push(`${margin} ${cardY + 95} ${pageWidth - margin * 2} 0.5 re`);
  content.push("f");
  content.push("0 0 0 rg");

  // Sender section
  content.push(`0 -20 Td`);
  content.push("/F2 10 Tf");
  content.push(`(${escapePdfText("FROM")}) Tj`);
  content.push(`0 -12 Td`);
  content.push("/F1 11 Tf");
  content.push(`(${escapePdfText(senderLine)}) Tj`);

  // Beneficiary section
  content.push(`0 -25 Td`);
  content.push("/F2 10 Tf");
  content.push(`(${escapePdfText("TO")}) Tj`);
  content.push(`0 -12 Td`);
  content.push("/F1 11 Tf");
  content.push(`(${escapePdfText(beneficiaryLine)}) Tj`);
  content.push(`0 -12 Td`);
  content.push(`(${escapePdfText(accountLine)}) Tj`);
  content.push(`0 -12 Td`);
  content.push(`(${escapePdfText(bankLine)}) Tj`);

  // Footer note
  const footerY = cardY - 50;
  content.push("Q");
  content.push("BT");
  content.push(`0 -${pageHeight - footerY} Td`);
  content.push("/F1 8 Tf");
  content.push("0.5 0.5 0.5 rg");
  content.push(
    `(${escapePdfText("This is an electronically generated receipt. No signature required.")}) Tj`
  );
  content.push(`0 -10 Td`);
  content.push(
    `(${escapePdfText("Thank you for banking with Ellington Bank")}) Tj`
  );

  content.push("ET");

  const stream = content.join("\n");

  // PDF Objects
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>${
      logo ? " /XObject << /Im1 6 0 R >>" : ""
    } >> /Contents ${logo ? "7" : "6"} 0 R >>\nendobj\n`,
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    ...(logo
      ? [
          `6 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${logo.hex.length + 1} >>\nstream\n${logo.hex}>\nendstream\nendobj\n`,
          `7 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`
        ]
      : [
          `6 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`
        ])
  ];

  // Build PDF
  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += obj;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
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
