import React from "react";
import { useWindowDimensions } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

type ConfettiBurstProps = {
  runKey: number;
  colors?: string[];
  count?: number;
  onComplete?: () => void;
};

// Reusable confetti burst that matches the existing animation used in la metodologia.
// It renders only when runKey > 0; increment runKey to trigger a new burst.
export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({
  runKey,
  colors = ["#007BFF", "#FF0000"],
  count = 60,
  onComplete,
}) => {
  const { width, height } = useWindowDimensions();

  if (runKey <= 0) return null;

  return (
    <ConfettiCannon
      key={`confetti-${runKey}`}
      autoStart
      fadeOut
      count={count}
      origin={{ x: width / 2, y: height }}
      colors={colors}
      onAnimationEnd={onComplete}
    />
  );
};
