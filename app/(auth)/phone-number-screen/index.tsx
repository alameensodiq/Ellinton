import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/app/components/Button";
import { Country, PhoneInput } from "@/app/components/inputs/PhoneInput";
import InfoText from "@/app/components/InfoText";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import { useLocalSearchParams } from "expo-router";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { registerNewUser } from "@/app/lib/thunks/authThunks";

const PhoneNumberScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { isLoading } = useAppSelector((state) => state.auth);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const { firstName, lastName, middleName } = useLocalSearchParams<{
    firstName: string;
    lastName: string;
    middleName?: string;
  }>();

  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: "NG",
    flag: "🇳🇬",
    dialCode: "+234",
    name: "Nigeria",
  });

  const countries: Country[] = [
    { code: "AF", flag: "🇦🇫", dialCode: "+93", name: "Afghanistan" },
    { code: "AL", flag: "🇦🇱", dialCode: "+355", name: "Albania" },
    { code: "DZ", flag: "🇩🇿", dialCode: "+213", name: "Algeria" },
    { code: "AD", flag: "🇦🇩", dialCode: "+376", name: "Andorra" },
    { code: "AO", flag: "🇦🇴", dialCode: "+244", name: "Angola" },
    { code: "AG", flag: "🇦🇬", dialCode: "+1", name: "Antigua and Barbuda" },
    { code: "AR", flag: "🇦🇷", dialCode: "+54", name: "Argentina" },
    { code: "AM", flag: "🇦🇲", dialCode: "+374", name: "Armenia" },
    { code: "AU", flag: "🇦🇺", dialCode: "+61", name: "Australia" },
    { code: "AT", flag: "🇦🇹", dialCode: "+43", name: "Austria" },
    { code: "AZ", flag: "🇦🇿", dialCode: "+994", name: "Azerbaijan" },

    { code: "BS", flag: "🇧🇸", dialCode: "+1", name: "Bahamas" },
    { code: "BH", flag: "🇧🇭", dialCode: "+973", name: "Bahrain" },
    { code: "BD", flag: "🇧🇩", dialCode: "+880", name: "Bangladesh" },
    { code: "BB", flag: "🇧🇧", dialCode: "+1", name: "Barbados" },
    { code: "BY", flag: "🇧🇾", dialCode: "+375", name: "Belarus" },
    { code: "BE", flag: "🇧🇪", dialCode: "+32", name: "Belgium" },
    { code: "BZ", flag: "🇧🇿", dialCode: "+501", name: "Belize" },
    { code: "BJ", flag: "🇧🇯", dialCode: "+229", name: "Benin" },
    { code: "BT", flag: "🇧🇹", dialCode: "+975", name: "Bhutan" },
    { code: "BO", flag: "🇧🇴", dialCode: "+591", name: "Bolivia" },
    { code: "BA", flag: "🇧🇦", dialCode: "+387", name: "Bosnia and Herzegovina" },
    { code: "BW", flag: "🇧🇼", dialCode: "+267", name: "Botswana" },
    { code: "BR", flag: "🇧🇷", dialCode: "+55", name: "Brazil" },
    { code: "BN", flag: "🇧🇳", dialCode: "+673", name: "Brunei" },
    { code: "BG", flag: "🇧🇬", dialCode: "+359", name: "Bulgaria" },
    { code: "BF", flag: "🇧🇫", dialCode: "+226", name: "Burkina Faso" },
    { code: "BI", flag: "🇧🇮", dialCode: "+257", name: "Burundi" },

    { code: "KH", flag: "🇰🇭", dialCode: "+855", name: "Cambodia" },
    { code: "CM", flag: "🇨🇲", dialCode: "+237", name: "Cameroon" },
    { code: "CA", flag: "🇨🇦", dialCode: "+1", name: "Canada" },
    { code: "CV", flag: "🇨🇻", dialCode: "+238", name: "Cape Verde" },
    {
      code: "CF",
      flag: "🇨🇫",
      dialCode: "+236",
      name: "Central African Republic",
    },
    { code: "TD", flag: "🇹🇩", dialCode: "+235", name: "Chad" },
    { code: "CL", flag: "🇨🇱", dialCode: "+56", name: "Chile" },
    { code: "CN", flag: "🇨🇳", dialCode: "+86", name: "China" },
    { code: "CO", flag: "🇨🇴", dialCode: "+57", name: "Colombia" },
    { code: "KM", flag: "🇰🇲", dialCode: "+269", name: "Comoros" },
    { code: "CG", flag: "🇨🇬", dialCode: "+242", name: "Congo" },
    { code: "CR", flag: "🇨🇷", dialCode: "+506", name: "Costa Rica" },
    { code: "CI", flag: "🇨🇮", dialCode: "+225", name: "Côte d’Ivoire" },
    { code: "HR", flag: "🇭🇷", dialCode: "+385", name: "Croatia" },
    { code: "CU", flag: "🇨🇺", dialCode: "+53", name: "Cuba" },
    { code: "CY", flag: "🇨🇾", dialCode: "+357", name: "Cyprus" },
    { code: "CZ", flag: "🇨🇿", dialCode: "+420", name: "Czech Republic" },

    { code: "DK", flag: "🇩🇰", dialCode: "+45", name: "Denmark" },
    { code: "DJ", flag: "🇩🇯", dialCode: "+253", name: "Djibouti" },
    { code: "DO", flag: "🇩🇴", dialCode: "+1", name: "Dominican Republic" },

    { code: "EC", flag: "🇪🇨", dialCode: "+593", name: "Ecuador" },
    { code: "EG", flag: "🇪🇬", dialCode: "+20", name: "Egypt" },
    { code: "SV", flag: "🇸🇻", dialCode: "+503", name: "El Salvador" },
    { code: "GQ", flag: "🇬🇶", dialCode: "+240", name: "Equatorial Guinea" },
    { code: "ER", flag: "🇪🇷", dialCode: "+291", name: "Eritrea" },
    { code: "EE", flag: "🇪🇪", dialCode: "+372", name: "Estonia" },
    { code: "ET", flag: "🇪🇹", dialCode: "+251", name: "Ethiopia" },

    { code: "FI", flag: "🇫🇮", dialCode: "+358", name: "Finland" },
    { code: "FR", flag: "🇫🇷", dialCode: "+33", name: "France" },

    { code: "GA", flag: "🇬🇦", dialCode: "+241", name: "Gabon" },
    { code: "GM", flag: "🇬🇲", dialCode: "+220", name: "Gambia" },
    { code: "GE", flag: "🇬🇪", dialCode: "+995", name: "Georgia" },
    { code: "DE", flag: "🇩🇪", dialCode: "+49", name: "Germany" },
    { code: "GH", flag: "🇬🇭", dialCode: "+233", name: "Ghana" },
    { code: "GR", flag: "🇬🇷", dialCode: "+30", name: "Greece" },
    { code: "GT", flag: "🇬🇹", dialCode: "+502", name: "Guatemala" },
    { code: "GN", flag: "🇬🇳", dialCode: "+224", name: "Guinea" },
    { code: "GW", flag: "🇬🇼", dialCode: "+245", name: "Guinea-Bissau" },
    { code: "GY", flag: "🇬🇾", dialCode: "+592", name: "Guyana" },

    { code: "HT", flag: "🇭🇹", dialCode: "+509", name: "Haiti" },
    { code: "HN", flag: "🇭🇳", dialCode: "+504", name: "Honduras" },
    { code: "HU", flag: "🇭🇺", dialCode: "+36", name: "Hungary" },

    { code: "IS", flag: "🇮🇸", dialCode: "+354", name: "Iceland" },
    { code: "IN", flag: "🇮🇳", dialCode: "+91", name: "India" },
    { code: "ID", flag: "🇮🇩", dialCode: "+62", name: "Indonesia" },
    { code: "IR", flag: "🇮🇷", dialCode: "+98", name: "Iran" },
    { code: "IQ", flag: "🇮🇶", dialCode: "+964", name: "Iraq" },
    { code: "IE", flag: "🇮🇪", dialCode: "+353", name: "Ireland" },
    { code: "IL", flag: "🇮🇱", dialCode: "+972", name: "Israel" },
    { code: "IT", flag: "🇮🇹", dialCode: "+39", name: "Italy" },

    { code: "JM", flag: "🇯🇲", dialCode: "+1", name: "Jamaica" },
    { code: "JP", flag: "🇯🇵", dialCode: "+81", name: "Japan" },
    { code: "JO", flag: "🇯🇴", dialCode: "+962", name: "Jordan" },

    { code: "KE", flag: "🇰🇪", dialCode: "+254", name: "Kenya" },
    { code: "KW", flag: "🇰🇼", dialCode: "+965", name: "Kuwait" },
    { code: "KG", flag: "🇰🇬", dialCode: "+996", name: "Kyrgyzstan" },

    { code: "LA", flag: "🇱🇦", dialCode: "+856", name: "Laos" },
    { code: "LV", flag: "🇱🇻", dialCode: "+371", name: "Latvia" },
    { code: "LB", flag: "🇱🇧", dialCode: "+961", name: "Lebanon" },
    { code: "LS", flag: "🇱🇸", dialCode: "+266", name: "Lesotho" },
    { code: "LR", flag: "🇱🇷", dialCode: "+231", name: "Liberia" },
    { code: "LY", flag: "🇱🇾", dialCode: "+218", name: "Libya" },
    { code: "LT", flag: "🇱🇹", dialCode: "+370", name: "Lithuania" },
    { code: "LU", flag: "🇱🇺", dialCode: "+352", name: "Luxembourg" },

    { code: "MG", flag: "🇲🇬", dialCode: "+261", name: "Madagascar" },
    { code: "MW", flag: "🇲🇼", dialCode: "+265", name: "Malawi" },
    { code: "MY", flag: "🇲🇾", dialCode: "+60", name: "Malaysia" },
    { code: "ML", flag: "🇲🇱", dialCode: "+223", name: "Mali" },
    { code: "MT", flag: "🇲🇹", dialCode: "+356", name: "Malta" },
    { code: "MX", flag: "🇲🇽", dialCode: "+52", name: "Mexico" },
    { code: "MA", flag: "🇲🇦", dialCode: "+212", name: "Morocco" },

    { code: "NA", flag: "🇳🇦", dialCode: "+264", name: "Namibia" },
    { code: "NP", flag: "🇳🇵", dialCode: "+977", name: "Nepal" },
    { code: "NL", flag: "🇳🇱", dialCode: "+31", name: "Netherlands" },
    { code: "NZ", flag: "🇳🇿", dialCode: "+64", name: "New Zealand" },
    { code: "NI", flag: "🇳🇮", dialCode: "+505", name: "Nicaragua" },
    { code: "NE", flag: "🇳🇪", dialCode: "+227", name: "Niger" },
    { code: "NG", flag: "🇳🇬", dialCode: "+234", name: "Nigeria" },
    { code: "NO", flag: "🇳🇴", dialCode: "+47", name: "Norway" },

    { code: "OM", flag: "🇴🇲", dialCode: "+968", name: "Oman" },

    { code: "PK", flag: "🇵🇰", dialCode: "+92", name: "Pakistan" },
    { code: "PA", flag: "🇵🇦", dialCode: "+507", name: "Panama" },
    { code: "PE", flag: "🇵🇪", dialCode: "+51", name: "Peru" },
    { code: "PH", flag: "🇵🇭", dialCode: "+63", name: "Philippines" },
    { code: "PL", flag: "🇵🇱", dialCode: "+48", name: "Poland" },
    { code: "PT", flag: "🇵🇹", dialCode: "+351", name: "Portugal" },

    { code: "QA", flag: "🇶🇦", dialCode: "+974", name: "Qatar" },

    { code: "RO", flag: "🇷🇴", dialCode: "+40", name: "Romania" },
    { code: "RU", flag: "🇷🇺", dialCode: "+7", name: "Russia" },
    { code: "RW", flag: "🇷🇼", dialCode: "+250", name: "Rwanda" },

    { code: "SA", flag: "🇸🇦", dialCode: "+966", name: "Saudi Arabia" },
    { code: "SN", flag: "🇸🇳", dialCode: "+221", name: "Senegal" },
    { code: "SL", flag: "🇸🇱", dialCode: "+232", name: "Sierra Leone" },
    { code: "SG", flag: "🇸🇬", dialCode: "+65", name: "Singapore" },
    { code: "ZA", flag: "🇿🇦", dialCode: "+27", name: "South Africa" },
    { code: "ES", flag: "🇪🇸", dialCode: "+34", name: "Spain" },
    { code: "SE", flag: "🇸🇪", dialCode: "+46", name: "Sweden" },
    { code: "CH", flag: "🇨🇭", dialCode: "+41", name: "Switzerland" },

    { code: "TZ", flag: "🇹🇿", dialCode: "+255", name: "Tanzania" },
    { code: "TH", flag: "🇹🇭", dialCode: "+66", name: "Thailand" },
    { code: "TG", flag: "🇹🇬", dialCode: "+228", name: "Togo" },
    { code: "TN", flag: "🇹🇳", dialCode: "+216", name: "Tunisia" },
    { code: "TR", flag: "🇹🇷", dialCode: "+90", name: "Turkey" },

    { code: "UG", flag: "🇺🇬", dialCode: "+256", name: "Uganda" },
    { code: "UA", flag: "🇺🇦", dialCode: "+380", name: "Ukraine" },
    { code: "AE", flag: "🇦🇪", dialCode: "+971", name: "United Arab Emirates" },
    { code: "GB", flag: "🇬🇧", dialCode: "+44", name: "United Kingdom" },
    { code: "US", flag: "🇺🇸", dialCode: "+1", name: "United States" },

    { code: "VN", flag: "🇻🇳", dialCode: "+84", name: "Vietnam" },

    { code: "ZM", flag: "🇿🇲", dialCode: "+260", name: "Zambia" },
    { code: "ZW", flag: "🇿🇼", dialCode: "+263", name: "Zimbabwe" },
  ];



  const handleContinue = async () => {
    const fullPhone = `${selectedCountry.dialCode}${phoneNumber}`;
    const firstNameStr = Array.isArray(firstName) ? firstName[0] : (firstName || "");
    const lastNameStr = Array.isArray(lastName) ? lastName[0] : (lastName || "");
    const middleNameStr = Array.isArray(middleName) ? middleName[0] : (middleName || "");

    const resultAction = await dispatch(
      registerNewUser({
        phone: fullPhone,
        first_name: firstNameStr,
        middle_name: middleNameStr,
        last_name: lastNameStr,
      })
    );

    if (registerNewUser.fulfilled.match(resultAction)) {
      router.push({
        pathname: "/(auth)/verify-phone-otp",
        params: { phone: fullPhone },
      });
    } else if (registerNewUser.rejected.match(resultAction)) {
      setError((resultAction.payload as string) || "Registration failed. Please try again.");
    }
  };


  return (
    <SafeAreaView className="flex-1 bg-primary-100 pt-4">
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <StatusBar />

        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <ProgressBar currentStep={1} totalSteps={2} />

          <CustomText size="xxl" className="mb-10 mt-10">
            Enter your phone number
          </CustomText>

          <PhoneInput
            value={phoneNumber}
            countries={countries}
            selectedCountry={selectedCountry}
            onSelectCountry={setSelectedCountry}
            error={error}
            onChangeText={(text) => {
              const cleaned = text.replace(/\D/g, "");
              setPhoneNumber(cleaned);
              if (error) setError("");
            }}
          />
        </ScrollView>

        <View className="px-6 pb-2">
          <InfoText
            text="Already registered?"
            actionText="Login"
            onPress={() => router.push("/(auth)/login")}
          />

          <Button
            title="Continue"
            variant="primary"
            onPress={handleContinue}
            className="w-full mt-4 mb-4"
            disabled={!phoneNumber || isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PhoneNumberScreen;
