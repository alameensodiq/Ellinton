import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import {
  Dropdown,
  DropdownOption,
} from "@/app/components/inputs/DropdownInputs";
import { PhoneInput, Country } from "@/app/components/inputs/PhoneInput";
import Loading from "@/app/components/Loading";
import { NextOfKinPayload, submitNextOfKin } from "@/app/lib/thunks/kycThunks";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";

const NextOfKinScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  const [country, setCountry] = useState("NG");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: "NG",
    flag: "🇳🇬",
    dialCode: "+234",
    name: "Nigeria",
  });

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [genderError, setGenderError] = useState("");
  const [relationshipError, setRelationshipError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [address1Error, setAddress1Error] = useState("");
  const [countryError, setCountryError] = useState("");
  const [stateError, setStateError] = useState("");
  const [cityError, setCityError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const countryOptions: DropdownOption[] = [{ value: "NG", label: "Nigeria" }];

  const [stateOptions, setStateOptions] = useState<DropdownOption[]>([]);
  const [cityOptions, setCityOptions] = useState<DropdownOption[]>([]);

  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // New: Relationship options
  const relationshipOptions: DropdownOption[] = [
    { value: "Brother", label: "Brother" },
    { value: "Sister", label: "Sister" },
    { value: "Mother", label: "Mother" },
    { value: "Father", label: "Father" },
    { value: "Spouse", label: "Spouse" },
    { value: "Child", label: "Child" },
    { value: "Other", label: "Other" },
  ];

  // New: Gender options
  const genderOptions: DropdownOption[] = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ];

  const getLabel = (options: DropdownOption[], value: string): string => {
    return options.find((option) => option.value === value)?.label || "";
  };

  const validatePhone = (v: string) => v.length >= 10;

  const validateEmail = (v: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(v);
  };

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const response = await fetch(
          "https://nga-states-lga.onrender.com/fetch"
        );
        if (!response.ok) throw new Error("Failed to fetch states");
        const states: string[] = await response.json();

        const formattedStates = states.map((s) => ({
          value: s,
          label: s,
        }));

        setStateOptions(formattedStates);
      } catch (err) {
        setFetchError("Failed to load states. Please try again.");
        console.error(err);
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, []);

  useEffect(() => {
    if (!state) {
      setCityOptions([]);
      setCity("");
      return;
    }

    const fetchCities = async () => {
      try {
        setLoadingCities(true);
        const response = await fetch(
          `https://nga-states-lga.onrender.com/?state=${encodeURIComponent(
            state
          )}`
        );
        if (!response.ok) throw new Error("Failed to fetch cities");
        const cities: string[] = await response.json();

        const formattedCities = cities.map((city) => ({
          value: city.toLowerCase().replace(/\s+/g, " "),
          label: city,
        }));

        setCityOptions(formattedCities);
        setCity("");
      } catch (err) {
        setFetchError("Failed to load cities.");
        console.error(err);
        setCityOptions([]);
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, [state]);

  const handleContinue = async () => {
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setGenderError("");
    setRelationshipError(""); // New
    setPhoneError("");
    setAddress1Error("");
    setCountryError("");
    setStateError("");
    setCityError("");

    let hasError = false;

    if (!firstName) {
      setFirstNameError("First name is required");
      hasError = true;
    }

    if (!lastName) {
      setLastNameError("Last name is required");
      hasError = true;
    }

    if (!email) {
      setEmailError("Email is required");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError(
        "Please enter a valid email address (e.g., user@example.com)"
      );
      hasError = true;
    }

    if (!gender) {
      setGenderError("Gender is required");
      hasError = true;
    }

    if (!relationship) {
      setRelationshipError("Relationship is required");
      hasError = true;
    }

    if (!phone) {
      setPhoneError("Phone is required");
      hasError = true;
    } else if (!validatePhone(phone)) {
      setPhoneError("Invalid phone number");
      hasError = true;
    }

    if (!address1) {
      setAddress1Error("Address line 1 is required");
      hasError = true;
    }

    if (!country) {
      setCountryError("Country is required");
      hasError = true;
    }

    if (!state) {
      setStateError("State is required");
      hasError = true;
    }

    if (!city) {
      setCityError("City is required");
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    const payload: NextOfKinPayload = {
      first_name: firstName,
      last_name: lastName,
      phone: `${selectedCountry.dialCode}${phone}`,
      email,
      gender,
      relationship,
      country_code: country,
      state: getLabel(stateOptions, state),
      city: getLabel(cityOptions, city),
      address_1: address1,
      address_2: address2,
    };

    try {
      const result = await dispatch(submitNextOfKin(payload)).unwrap();
      console.log("Next of Kin submitted:", result);
      router.push({
        pathname: "/(root)/kyc/signature",
      });
    } catch (error) {
      console.error("Next of Kin submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView className="flex-1 bg-primary-100">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View className="flex-row items-center justify-between px-4 pt-4 pb-6">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "space-between",
                paddingHorizontal: 24,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <View>
                <Text className="text-2xl font-bold text-white mb-4">
                  Next of kin
                </Text>

                {fetchError ? (
                  <Text className="text-red-500 mb-4">{fetchError}</Text>
                ) : null}

                <View className="space-y-6">
                  <TextInputField
                    label="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="John"
                    autoCapitalize="words"
                    error={firstNameError}
                  />

                  <TextInputField
                    label="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                    autoCapitalize="words"
                    error={lastNameError}
                  />

                  {/* New: Email Input */}
                  <TextInputField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="john.doe@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={emailError}
                  />

                  {/* New: Gender Dropdown */}
                  <Dropdown
                    label="Gender*"
                    placeholder="Select Gender"
                    options={genderOptions}
                    selectedValue={gender}
                    onSelect={setGender}
                    error={genderError}
                  />

                  {/* Relationship Dropdown */}
                  <Dropdown
                    label="Relationship*"
                    placeholder="Select Relationship"
                    options={relationshipOptions}
                    selectedValue={relationship}
                    onSelect={setRelationship}
                    error={relationshipError}
                  />

                  <PhoneInput
                    value={phone}
                    onChangeText={setPhone}
                    error={phoneError}
                    countries={[
                      {
                        code: "NG",
                        flag: "🇳🇬",
                        dialCode: "+234",
                        name: "Nigeria",
                      },
                    ]}
                    selectedCountry={selectedCountry}
                    onSelectCountry={setSelectedCountry}
                    disabled
                  />

                  <Dropdown
                    label="Country*"
                    placeholder="Select Country"
                    options={countryOptions}
                    selectedValue={country}
                    onSelect={setCountry}
                    error={countryError}
                  />

                  <View className="flex-row gap-3 w-full">
                    <View className="flex-1">
                      <Dropdown
                        label="State*"
                        placeholder={
                          loadingStates ? "Loading states..." : "Select State"
                        }
                        options={stateOptions}
                        selectedValue={state}
                        onSelect={setState}
                        error={stateError}
                        disabled={loadingStates}
                      />
                    </View>
                    <View className="flex-1">
                      <Dropdown
                        label="City*"
                        placeholder={
                          loadingCities
                            ? "Loading cities..."
                            : !state
                            ? "Select State first"
                            : "Select City"
                        }
                        options={cityOptions}
                        selectedValue={city}
                        onSelect={setCity}
                        error={cityError}
                        disabled={!state || loadingCities}
                      />
                    </View>
                  </View>

                  <TextInputField
                    label="Address Line 1"
                    value={address1}
                    onChangeText={setAddress1}
                    placeholder="123 Main St"
                    error={address1Error}
                  />

                  <TextInputField
                    label="Address Line 2 (optional)"
                    value={address2}
                    onChangeText={setAddress2}
                    placeholder="Apt 4B"
                  />
                </View>
              </View>

              <View className="mb-6">
                <Button
                  title="Continue"
                  variant="primary"
                  onPress={handleContinue}
                  className="w-full mt-4"
                  disabled={isLoading || loadingStates || loadingCities}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      <Loading visible={isLoading} />
    </>
  );
};

export default NextOfKinScreen;
