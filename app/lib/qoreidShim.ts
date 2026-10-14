export type QoreIdOptions = { onResult?: (data: any) => void } | undefined;

export const useQoreIdSdk = (_opts?: QoreIdOptions) => {
  const onResult = _opts?.onResult;

  const launchQoreId = async (formData: any) => {
    try {
      // Try dynamic import if package is present
      const mod = await import("@qore-id/react-native-qoreid-sdk");
      if (mod) {
        // If the package exposes the hook, use it
        if (typeof mod.useQoreIdSdk === "function") {
          const hook = mod.useQoreIdSdk({ onResult });
          if (hook && typeof hook.launchQoreId === "function") {
            return hook.launchQoreId(formData);
          }
        }
        // If package exposes a direct launch function
        if (typeof mod.launchQoreId === "function") {
          return mod.launchQoreId(formData);
        }
      }
    } catch (e: any) {
      // Module not available or native install missing
      // Silently warn and call onResult with an error so caller can handle UX
      // eslint-disable-next-line no-console
      console.warn("QoreID SDK not available:", e?.message || e);
    }

    // Fallback behaviour: notify caller and return null
    if (typeof onResult === "function") {
      setTimeout(() => onResult({ status: "error", message: "QoreID SDK not installed" }), 0);
    }
    return null;
  };

  return { launchQoreId };
};

export default { useQoreIdSdk };
