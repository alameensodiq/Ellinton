declare module "@qore-id/react-native-qoreid-sdk" {
  export function useQoreIdSdk(opts?: { onResult?: (data: any) => void }): { launchQoreId: (formData: any) => Promise<any> };
  export function launchQoreId(formData: any): Promise<any>;
  const _default: { useQoreIdSdk: typeof useQoreIdSdk; launchQoreId: typeof launchQoreId };
  export default _default;
}
