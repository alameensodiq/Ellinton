import React, { useState, useEffect } from "react";
import {
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import AmountInput from "@/app/components/inputs/AmountInput";
import ProgressBar from "@/app/components/ProgressBar";
import CustomText from "@/app/components/CustomText";
import TextInputField from "@/app/components/inputs/TextInputField";
import { svgIcons } from "@/app/assets/icons/icons";
import { useRouter } from "expo-router";
import {
  Dropdown,
  DropdownOption,
} from "@/app/components/inputs/DropdownInputs";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import SelectableButton from "@/app/components/SelectableButton";

export const brands = [
  {
    value: "mastercard",
    label: "Mastercard",
    icon: svgIcons.master_card,
    selected: true,
  },
  {
    value: "visa",
    label: "Visa",
    icon: svgIcons.visa,
    selected: false,
  },
  {
    value: "verve",
    label: "Verve",
    icon: svgIcons.verve,
    selected: false,
  },
];

const countries: DropdownOption[] = [{ value: "ng", label: "Nigeria" }];

export default function PhysicalCardCreateStep1() {
  const [selectedBrand, setSelectedBrand] = useState("mastercard");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("ng");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [address1, setAddress1] = useState("");
  const [isEditable, setIsEditable] = useState(false);

  const [stateOptions, setStateOptions] = useState<DropdownOption[]>([]);
  const [cityOptions, setCityOptions] = useState<DropdownOption[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  console.log(user)

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const res = await fetch("https://nga-states-lga.onrender.com/fetch");
        if (res.ok) {
          const data: string[] = await res.json();
          setStateOptions(data.map((item) => ({ value: item.toLowerCase(), label: item })));
        }
      } catch (e) {
        // Fallback default Nigerian states list
        const fallbackStates = [
          "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
          "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
          "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
          "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
          "Taraba", "Yobe", "Zamfara"
        ];
        setStateOptions(fallbackStates.map((s) => ({ value: s.toLowerCase(), label: s })));
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    if (!state) {
      setCityOptions([]);
      return;
    }
    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const selectedStateLabel = stateOptions.find((s) => s.value === state.toLowerCase())?.label || state;
        const res = await fetch(`https://nga-states-lga.onrender.com/?state=${encodeURIComponent(selectedStateLabel)}`);
        if (res.ok) {
          const data: string[] = await res.json();
          const mapped = data.map((c) => ({ value: c.toLowerCase(), label: c }));
          if (city && !mapped.some((c) => c.value === city.toLowerCase())) {
            const currentCityLabel = user?.city || user?.local_government || city;
            mapped.unshift({ value: city.toLowerCase(), label: currentCityLabel });
          }
          setCityOptions(mapped);
        }
      } catch (e) {
        const currentCityLabel = user?.city || user?.local_government || city || "Ikeja";
        setCityOptions([{ value: city.toLowerCase() || "ikeja", label: currentCityLabel }]);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [state, stateOptions]);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setCountry(user.country_code?.toLowerCase() || "ng");
      const userState = (user.state || "Lagos").toLowerCase();
      const userCity = (user.city || user.local_government || "Ikeja").toLowerCase();
      setState(userState);
      setCity(userCity);
      setAddress1(user.address_1 || "");

      const currentCityLabel = user.city || user.local_government || "Ikeja";
      setCityOptions((prev) =>
        prev.some((c) => c.value === userCity)
          ? prev
          : [{ value: userCity, label: currentCityLabel }, ...prev]
      );
    }
  }, [user]);

  const handleChangeDetails = () => {
    setIsEditable(true);
  };

  const handleContinue = () => {
    const selectedBrandObj = brands.find((b) => b.value === selectedBrand);

    router.push({
      pathname: "/(root)/cards/physical-card/step2",
      params: {
        firstName,
        lastName,
        brand: selectedBrandObj?.value || "mastercard",
        country,
        state,
        city,
        address1,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <View className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.select({ ios: "padding", android: "padding" })}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ProgressBar currentStep={1} totalSteps={2} />

            <CustomText size="xl" className="mb-10">
              Choose card type
            </CustomText>

            <TextInputField
              label="First name (BVN name)"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              disabled={!isEditable}
            />

            <TextInputField
              label="Last name (BVN name)"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              disabled={!isEditable}
            />

            <View className="mb-6">
              <CustomText size="lg">Select brand</CustomText>
              <View className="flex-row flex-wrap gap-4">
                {brands.map((brand) => {
                  const BrandIcon = brand.icon;
                  return (
                    <SelectableButton
                      key={brand.value}
                      item={{
                        value: brand.value,
                        label: brand.label,
                        icon: <BrandIcon width={24} height={24} />,
                      }}
                      selected={selectedBrand === brand.value}
                      onPress={() => setSelectedBrand(brand.value)}
                    />
                  );
                })}
              </View>
            </View>

            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <CustomText size="lg">Billing address</CustomText>
                {!isEditable && (
                  <Pressable onPress={handleChangeDetails}>
                    <CustomText size="sm" className="text-accent-100 underline">
                      Change details
                    </CustomText>
                  </Pressable>
                )}
              </View>

              <Dropdown
                label="Country *"
                options={countries}
                selectedValue={country}
                onSelect={setCountry}
                disabled={!isEditable}
              />

              <View className="flex-row gap-4 mb-6">
                <View className="flex-1">
                  <Dropdown
                    label="State *"
                    placeholder={loadingStates ? "Loading..." : "Select state"}
                    options={stateOptions}
                    selectedValue={state}
                    onSelect={(val) => {
                      setState(val);
                      setCity("");
                    }}
                    searchable
                    disabled={!isEditable || loadingStates}
                  />
                </View>
                <View className="flex-1">
                  <Dropdown
                    label="City *"
                    placeholder={loadingCities ? "Loading..." : "Select city"}
                    options={cityOptions}
                    selectedValue={city}
                    onSelect={setCity}
                    searchable
                    disabled={!isEditable || loadingCities}
                  />
                </View>
              </View>

              <TextInputField
                label="Address 1"
                value={address1}
                onChangeText={setAddress1}
                placeholder="Enter address"
                disabled={!isEditable}
              />
            </View>
            <Button
              title="Continue"
              variant="primary"
              onPress={handleContinue}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
