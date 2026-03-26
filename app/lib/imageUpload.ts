import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";

interface PrepareImageForUploadOptions {
  maxBytes: number;
  startWidth?: number;
  minWidth?: number;
  initialCompress?: number;
  minCompress?: number;
}

interface PreparedImageUpload {
  uri: string;
  size: number;
  base64: string;
  dataUri: string;
}

export const prepareImageForUpload = async (
  uri: string,
  {
    maxBytes,
    startWidth = 960,
    minWidth = 420,
    initialCompress = 0.6,
    minCompress = 0.2,
  }: PrepareImageForUploadOptions
): Promise<PreparedImageUpload> => {
  let width = startWidth;
  let compress = initialCompress;

  let output = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width } }],
    { compress, format: ImageManipulator.SaveFormat.JPEG }
  );

  let info = await FileSystem.getInfoAsync(output.uri);
  let size = (info as { size?: number })?.size ?? 0;

  while (size > maxBytes && (width > minWidth || compress > minCompress)) {
    if (width > minWidth) {
      width = Math.max(minWidth, Math.floor(width * 0.85));
    }

    if (compress > minCompress) {
      compress = Math.max(minCompress, Number((compress - 0.08).toFixed(2)));
    }

    output = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width } }],
      { compress, format: ImageManipulator.SaveFormat.JPEG }
    );

    info = await FileSystem.getInfoAsync(output.uri);
    size = (info as { size?: number })?.size ?? 0;
  }

  const base64 =
    (await FileSystem.readAsStringAsync(output.uri, {
      encoding: "base64",
    })) || "";

  return {
    uri: output.uri,
    size,
    base64,
    dataUri: `data:image/jpeg;base64,${base64}`,
  };
};
