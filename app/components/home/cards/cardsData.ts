import { ImageSourcePropType } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Images from "../../../assets/images";
import { AccountInfo } from "@/app/lib/thunks/accountThunks";

export interface ActionButton {
  icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialIcons.glyphMap;
  label: string;
  iconLibrary: "Ionicons" | "MaterialIcons";
  onPress?: () => void;
}

export interface CardData {
  id: number;
  title: string;
  balance: string;
  cardNumber?: string;
  displayCardNumber?: string;
  gradientColors: [string, string];
  image: ImageSourcePropType;
  imagePosition?: "bottom-right" | "top-right";
  actions?: ActionButton[];
}

const formatMoney = (n: any) => {
  const val = Number(n || 0);
  return val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// ✅ add savingsTotal param
export const getCardsData = (
  accountInfo?: AccountInfo | null,
  savingsTotal: number = 0,
  pointBalance: number = 0
): CardData[] => {
  const firstCardBalance =
    accountInfo?.accountBalance !== undefined &&
    accountInfo.accountBalance !== null
      ? formatMoney(accountInfo.accountBalance)
      : "0.00";

  const firstCardAccountNumber = accountInfo?.accountNumber || "";
  const firstCardDisplayNumber = firstCardAccountNumber
    ? `${firstCardAccountNumber.substring(0, 5)}****`
    : "";

  return [
    {
      id: 1,
      title: "Available balance",
      balance: firstCardBalance,
      cardNumber: firstCardAccountNumber,
      displayCardNumber: firstCardDisplayNumber,
      gradientColors: ["#181905", "#515220"],
      image: Images.landing_balance_card1,
      actions: [
        {
          icon: "arrow-forward",
          label: "Transfer",
          iconLibrary: "Ionicons",
        },
        {
          icon: "account-balance",
          label: "Accounts",
          iconLibrary: "MaterialIcons",
        },
      ],
    },
    {
      id: 2,
      title: "Total savings",
      // ✅ real total savings here
      balance: formatMoney(savingsTotal),
      gradientColors: ["#333419", "#18180C"],
      imagePosition: "top-right",
      image: Images.landing_balance_card2,
      actions: [
        {
          icon: "arrow-forward",
          label: "Create Plan",
          iconLibrary: "Ionicons",
        },
        {
          icon: "account-balance",
          label: "View plans",
          iconLibrary: "MaterialIcons",
        },
      ],
    },
    {
      id: 3,
      title: "Point wallets",
      balance: formatMoney(pointBalance),
      gradientColors: ["#333419", "#18180C"],
      imagePosition: "top-right",
      image: Images.landing_balance_card3,
      actions: [
        {
          icon: "wallet",
          label: "Wallet",
          iconLibrary: "Ionicons",
        },
      ],
    },
  ];
};
