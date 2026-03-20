import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StatusBar, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Header from "@/app/components/header-back";
import Button from "@/app/components/Button";
import CustomText from "@/app/components/CustomText";
import TextInputField from "@/app/components/inputs/TextInputField";
import {
  Dropdown,
  DropdownOption,
} from "@/app/components/inputs/DropdownInputs";
import { useAppSelector } from "@/app/lib/hooks/useAppSelector";

const countryOptions: DropdownOption[] = [{ value: "Nigeria", label: "Nigeria" }];

const Step5 = () => {
  const router = useRouter();
  const params = useLocalSearchParams<Record<string, string>>();
  const user = useAppSelector((state) => state.auth.user);

  const [address, setAddress] = useState(user?.address_1 || "");
  const [country, setCountry] = useState("Nigeria");
  const [state, setState] = useState(user?.state || "");
  const [lga, setLga] = useState(user?.local_government || "");

  const [stateOptions, setStateOptions] = useState<DropdownOption[]>([]);
  const [lgaOptions, setLgaOptions] = useState<DropdownOption[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingLgas, setLoadingLgas] = useState(false);

  const [addressError, setAddressError] = useState("");
  const [stateError, setStateError] = useState("");
  const [lgaError, setLgaError] = useState("");
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoadingStates(true);
        const response = await fetch("https://nga-states-lga.onrender.com/fetch");
        if (!response.ok) {
          throw new Error("Failed to fetch states");
        }

        const states: string[] = await response.json();
        setStateOptions(states.map((item) => ({ value: item, label: item })));
      } catch (error) {
        setFetchError("Failed to load states. Please try again.");
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, []);

  useEffect(() => {
    if (!state) {
      setLga("");
      setLgaOptions([]);
      return;
    }

    const fetchLgas = async () => {
      try {
        setLoadingLgas(true);
        const response = await fetch(
          `https://nga-states-lga.onrender.com/?state=${encodeURIComponent(state)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch LGAs");
        }

        const lgas: string[] = await response.json();
        setLgaOptions(
          lgas.map((item) => ({
            value: item.toLowerCase(),
            label: item,
          }))
        );
      } catch (error) {
        setFetchError("Failed to load LGAs. Please try again.");
        setLgaOptions([]);
      } finally {
        setLoadingLgas(false);
      }
    };

    fetchLgas();
  }, [state]);

  const canContinue = useMemo(
    () => !!address.trim() && !!state && !!lga,
    [address, state, lga]
  );

  const handleContinue = () => {
    let hasError = false;

    if (!address.trim()) {
      setAddressError("Enter your address");
      hasError = true;
    } else {
      setAddressError("");
    }

    if (!state) {
      setStateError("Select a state");
      hasError = true;
    } else {
      setStateError("");
    }

    if (!lga) {
      setLgaError("Select an LGA");
      hasError = true;
    } else {
      setLgaError("");
    }

    if (hasError) {
      return;
    }

    router.push({
      pathname: "/(root)/loans/credit-check",
      params: {
        ...params,
        country,
        address: address.trim(),
        state,
        lga,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-100">
      <StatusBar barStyle="light-content" />
      <Header title="Residential Address" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="px-6 mb-4">
          <CustomText size="base">
            Enter the address details to use for this loan application.
          </CustomText>
          {!!fetchError && (
            <CustomText size="sm" className="text-red-500 mt-2">
              {fetchError}
            </CustomText>
          )}
        </View>

        <View className="px-6 flex-1">
          <Dropdown
            label="Country"
            options={countryOptions}
            selectedValue={country}
            onSelect={setCountry}
          />

          <Dropdown
            label="State"
            placeholder={loadingStates ? "Loading states..." : "Select state"}
            options={stateOptions}
            selectedValue={state}
            onSelect={(value) => {
              setState(value);
              setStateError("");
              setLga("");
            }}
            error={stateError}
            searchable
            disabled={loadingStates}
          />

          <Dropdown
            label="LGA"
            placeholder={loadingLgas ? "Loading LGAs..." : "Select LGA"}
            options={lgaOptions}
            selectedValue={lga}
            onSelect={(value) => {
              setLga(value);
              setLgaError("");
            }}
            error={lgaError}
            searchable
            disabled={!state || loadingLgas}
          />

          <TextInputField
            label="Address"
            value={address}
            onChangeText={(value) => {
              setAddress(value);
              setAddressError("");
            }}
            placeholder="Enter your residential address"
            error={addressError}
          />
        </View>

        <View className="px-6 pb-6">
          <Button
            title="Continue"
            onPress={handleContinue}
            variant="primary"
            disabled={!canContinue}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Step5;
