import { useRouter, useLocalSearchParams } from "expo-router";
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
import { verifyUserBvn } from "@/app/lib/thunks/authThunks";
import Button from "@/app/components/Button";
import TextInputField from "@/app/components/inputs/TextInputField";
import {
  Dropdown,
  DropdownOption,
} from "@/app/components/inputs/DropdownInputs";
import Loading from "@/app/components/Loading";
import ErrorModal from "@/app/components/ErrorModal";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";
import { useAppDispatch } from "@/app/lib/hooks/useAppDispatch";
import { genderOptions } from "@/app/lib/utils";

const EmailIdentityScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading: authLoading, user } = useAppSelector(
    (state) => state.auth
  );
  const { userId } = useLocalSearchParams();


  const [gender, setGender] = useState("");
  const [genderError, setGenderError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bvn, setBvn] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [country] = useState("NG");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [localGovernment, setLocalGovernment] = useState("");

  const [stateOptions, setStateOptions] = useState<DropdownOption[]>([]);
  const [localGovernmentOptions, setLocalGovernmentOptions] = useState<
    DropdownOption[]
  >([]);

  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingLGAs, setLoadingLGAs] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [bvnError, setBvnError] = useState("");
  const [address1Error, setAddress1Error] = useState("");
  const [stateError, setStateError] = useState("");
  const [localGovernmentError, setLocalGovernmentError] = useState("");

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [apiError, setApiError] = useState("");

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
          label: s.replace(/([A-Z])/g, " $1").trim(),
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
      setLocalGovernmentOptions([]);
      setLocalGovernment("");
      return;
    }

    const fetchLGAs = async () => {
      try {
        setLoadingLGAs(true);
        const response = await fetch(
          `https://nga-states-lga.onrender.com/?state=${encodeURIComponent(
            state
          )}`
        );
        if (!response.ok) throw new Error("Failed to fetch LGAs");
        const lgas: string[] = await response.json();

        const formattedLGAs = lgas.map((lga) => ({
          value: lga.toLowerCase().replace(/\s+/g, " "),
          label: lga,
        }));

        setLocalGovernmentOptions(formattedLGAs);
        setLocalGovernment("");
      } catch (err) {
        setFetchError("Failed to load local governments.");
        console.error(err);
        setLocalGovernmentOptions([]);
      } finally {
        setLoadingLGAs(false);
      }
    };

    fetchLGAs();
  }, [state]);

  const handleBack = () => router.back();

  const validateBvn = (bvn: string) => /^\d{11}$/.test(bvn);

  const handleContinue = async () => {
    // Reset errors
    setGenderError("");
    setFirstNameError("");
    setLastNameError("");
    setBvnError("");
    setAddress1Error("");
    setStateError("");
    setLocalGovernmentError("");

    let hasError = false;

    if (!gender) {
      setGenderError("Gender is required");
      hasError = true;
    }
    if (!firstName) {
      setFirstNameError("First name is required");
      hasError = true;
    }
    if (!lastName) {
      setLastNameError("Last name is required");
      hasError = true;
    }
    if (!bvn) {
      setBvnError("BVN is required");
      hasError = true;
    } else if (!validateBvn(bvn)) {
      setBvnError("BVN must be 11 digits");
      hasError = true;
    }
    if (!address1) {
      setAddress1Error("Address line 1 is required");
      hasError = true;
    }
    if (!state) {
      setStateError("State is required");
      hasError = true;
    }
    if (!localGovernment) {
      setLocalGovernmentError("Local government is required");
      hasError = true;
    }

    if (hasError) return;

    try {
      await dispatch(
        verifyUserBvn({
          userId: (userId as string) || (user?.id as string),
          bvn,
          first_name: firstName,
          last_name: lastName,
          gender,
          state,
          city: state,
          local_government: localGovernment,
          address_1: address1,
          address_2: address2,
          country_code: country,
        })
      ).unwrap();

      router.push({
        pathname: "/(auth)/facial-verification",
        params: { userId: userId as string|| user?.id },
      });
    } catch (err: any) {
      setApiError(err?.message || "Verification failed. Please try again.");
      setShowErrorModal(true);
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
              <TouchableOpacity onPress={handleBack}>
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
              showsVerticalScrollIndicator={false}
            >
              <View>
                <Text className="text-2xl font-bold text-white mb-4">
                  Enter your details
                </Text>

                {fetchError ? (
                  <Text className="text-red-500 mb-4">{fetchError}</Text>
                ) : null}

                <View className="space-y-6">
                  <Dropdown
                    label="Gender"
                    placeholder="Select"
                    options={genderOptions}
                    selectedValue={gender}
                    onSelect={setGender}
                    error={genderError}
                  />

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

                  <TextInputField
                    label="BVN"
                    value={bvn}
                    onChangeText={(text) => setBvn(text.replace(/\D/g, ""))}
                    placeholder="12345678901"
                    keyboardType="numeric"
                    maxLength={11}
                    error={bvnError}
                  />

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

                  <Dropdown
                    label="Local Government*"
                    placeholder={
                      loadingLGAs
                        ? "Loading LGAs..."
                        : !state
                        ? "Select State first"
                        : "Select Local Government"
                    }
                    options={localGovernmentOptions}
                    selectedValue={localGovernment}
                    onSelect={setLocalGovernment}
                    error={localGovernmentError}
                    disabled={!state || loadingLGAs}
                  />

                  <TextInputField
                    label="Address Line 1*"
                    value={address1}
                    onChangeText={setAddress1}
                    placeholder="123 Main St"
                    error={address1Error}
                  />

                  <TextInputField
                    label="Address Line 2"
                    value={address2}
                    onChangeText={setAddress2}
                    placeholder="Apt/Suite (Optional)"
                  />
                </View>
              </View>

              <View className="mb-6">
                <Button
                  title="Continue"
                  variant="primary"
                  onPress={handleContinue}
                  className="w-full mt-4"
                  disabled={authLoading || loadingStates}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      <Loading visible={authLoading || loadingStates || loadingLGAs} />
      <ErrorModal
        visible={showErrorModal}
        title="Verification Error"
        message={apiError}
        onDismiss={() => {
          setShowErrorModal(false);
          setApiError("");
        }}
      />
    </>
  );
};

export default EmailIdentityScreen;
