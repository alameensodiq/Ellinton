import React, { useMemo, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";

type PlanType = "basic" | "target" | "group" | "fixed";

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();

  const planType = useMemo<PlanType>(() => {
    const t = (params.type || "").toLowerCase();
    if (t === "target" || t === "group" || t === "fixed" || t === "basic")
      return t;
    return "basic";
  }, [params.type]);

  // Navigate to products screen immediately
  useEffect(() => {
    router.replace({
      pathname: "/(root)/savings/products",
      params: {
        type: planType,
      },
    });
  }, [router, planType]);

  return null;
}
