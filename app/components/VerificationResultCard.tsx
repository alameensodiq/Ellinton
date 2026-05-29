import React from "react";
import { View, Text } from "react-native";

interface CustomerInfo {
  firstName: string;
  lastName: string;
  customerName: string;
  meterNumber: string;
  accountNumber: string;
  customerType: string;
  canVend: boolean;
  address: string;
  minimumVend: string;
  tariffDescription: string;
}

interface ValidationResultCardProps {
  billerName: string;
  customer: CustomerInfo;
  paid: boolean;
  statusCode: string;
  minPayableAmount: number;
  outstandingAmount: number;
}

export default function ValidationResultCard({
  billerName,
  customer,
  paid,
  statusCode,
  minPayableAmount,
  outstandingAmount,
}: ValidationResultCardProps) {
  return (
    <View className="bg-primary-400 rounded-2xl p-4 mb-4">
      <View className="pt-3">
        {/* Biller Name & Status */}
        <View className="mb-3">
          <Text className="text-white font-bold text-lg">{billerName}</Text>
          <Text className={`text-xs ${statusCode === "00" ? "text-green-400" : "text-red-400"}`}>
            {statusCode === "00" ? "✓ Verified" : "✗ Failed"}
          </Text>
        </View>

        {/* Customer Details */}
        <View className="flex-row justify-between mb-2 py-3 border-b border-primary-300">
          <Text className="text-accent-200 text-sm">Customer Name</Text>
          <Text className="text-white font-semibold">{customer.customerName}</Text>
        </View>

        <View className="flex-row justify-between mb-2 py-3 border-b border-primary-300">
          <Text className="text-accent-200 text-sm">Meter Number</Text>
          <Text className="text-white font-semibold">{customer.meterNumber}</Text>
        </View>

        <View className="flex-row justify-between mb-2 py-3 border-b border-primary-300">
          <Text className="text-accent-200 text-sm">Account Number</Text>
          <Text className="text-white font-semibold">{customer.accountNumber}</Text>
        </View>

        <View className="flex-row justify-between mb-2 py-3 border-b border-primary-300">
          <Text className="text-accent-200 text-sm">Customer Type</Text>
          <Text className="text-white font-semibold">{customer.customerType}</Text>
        </View>

        <View className="flex-row justify-between mb-2 py-3 border-b border-primary-300">
          <Text className="text-accent-200 text-sm">Address</Text>
          <Text className="text-white font-semibold text-right flex-1 ml-4" numberOfLines={2}>
            {customer.address}
          </Text>
        </View>

        <View className="flex-row justify-between mb-2 py-3 border-b border-primary-300">
          <Text className="text-accent-200 text-sm">Tariff</Text>
          <Text className="text-white font-semibold text-right flex-1 ml-4" numberOfLines={2}>
            {customer.tariffDescription}
          </Text>
        </View>

        {/* Amount Details */}
        <View className="flex-row justify-between py-3 mb-2 border-b border-primary-300">
          <Text className="text-accent-200 text-sm">Min Payable Amount</Text>
          <Text className="text-accent-200 font-semibold">
            ₦{minPayableAmount.toLocaleString()}
          </Text>
        </View>

        {outstandingAmount > 0 && (
          <View className="flex-row justify-between py-3 mb-2 border-b border-primary-300">
            <Text className="text-accent-200 text-sm">Outstanding Amount</Text>
            <Text className="text-red-400 font-semibold">
              ₦{outstandingAmount.toLocaleString()}
            </Text>
          </View>
        )}

        {/* Vending Status */}
        <View className="flex-row justify-between items-center mt-3">
          <Text className="text-white font-semibold">Can Vend</Text>
          <Text className={`font-bold text-lg ${customer.canVend ? "text-green-400" : "text-red-400"}`}>
            {customer.canVend ? "Yes" : "No"}
          </Text>
        </View>
      </View>
    </View>
  );
}