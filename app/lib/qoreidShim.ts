import { useQoreIdSdk as useNativeQoreIdSdk } from "@qore-id/react-native-qoreid-sdk";

export type QoreIdOptions = { onResult?: (data: any) => void } | undefined;

export const useQoreIdSdk = (opts?: QoreIdOptions) =>
  useNativeQoreIdSdk({
    onResult: opts?.onResult ?? (() => undefined),
  });

export default { useQoreIdSdk };
  