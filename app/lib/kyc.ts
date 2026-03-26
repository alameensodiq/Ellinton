export type KycUpgradeRoute = "/(root)/kyc" | "/(root)/kyc/utility-bills";

export const getKycLevel = (kycLevel?: number | null) => {
  if (kycLevel === 2) return 2;
  if (kycLevel === 3) return 3;
  return 1;
};

export const getTransferTierLimit = (kycLevel?: number | null) => {
  const level = getKycLevel(kycLevel);

  if (level === 1) return 50000;
  if (level === 2) return 100000;

  return null;
};

export const getTierLabel = (kycLevel?: number | null) =>
  `Tier ${getKycLevel(kycLevel)}`;

export const getKycUpgradeRoute = (
  kycLevel?: number | null
): KycUpgradeRoute | null => {
  const level = getKycLevel(kycLevel);

  if (level === 1) return "/(root)/kyc";
  if (level === 2) return "/(root)/kyc/utility-bills";

  return null;
};
