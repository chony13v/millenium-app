declare module "expo-linear-gradient" {
  import type { ComponentType } from "react";
  import type { ViewProps } from "react-native";

  export interface LinearGradientProps extends ViewProps {
    colors: string[];
    locations?: number[];
    start?: [number, number];
    end?: [number, number];
  }

  export const LinearGradient: ComponentType<LinearGradientProps>;
}