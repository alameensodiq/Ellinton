import React from "react";
import { Text, TextProps, TextStyle } from "react-native";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CustomTextProps extends TextProps {
  children: React.ReactNode;
  className?: string;
  style?: TextStyle;
  weight?: "regular" | "medium" | "bold";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "xxl" | "xxxl";
  secondary?: boolean;
}

const fontMap = {
  regular: "Outfit",
  medium: "OutfitMedium",
  bold: "OutfitBold",
};

const sizeMap = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  xxl: "text-2xl",
  xxxl: "text-3xl",
};

const sanitizeChildren = (children: React.ReactNode): React.ReactNode => {
  if (children == null) return null;
  if (typeof children === "string" || typeof children === "number" || typeof children === "boolean") {
    return children;
  }
  if (React.isValidElement(children)) {
    return children;
  }
  if (Array.isArray(children)) {
    return children.map((item, index) => {
      if (typeof item === "object" && item !== null && !React.isValidElement(item)) {
        return <React.Fragment key={index}>{sanitizeChildren(item)}</React.Fragment>;
      }
      return item;
    });
  }
  if (typeof children === "object") {
    const obj = children as any;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (obj.message) return sanitizeChildren(obj.message);
    try {
      return JSON.stringify(children);
    } catch {
      return String(children);
    }
  }
  return String(children);
};

export default function CustomText({
  children,
  className,
  style,
  weight = "regular",
  size = "base",
  secondary = false, 
  ...rest
}: CustomTextProps) {
  const mergedClass = twMerge(
    clsx(
      sizeMap[size],
      secondary ? "text-accent-100" : "text-white",
      "mb-2",
      className
    )
  );

  return (
    <Text
      {...rest}
      className={mergedClass}
      style={[{ fontFamily: fontMap[weight] }, style]}
    >
      {sanitizeChildren(children)}
    </Text>
  );
}
