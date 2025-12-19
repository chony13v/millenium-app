import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useIsFocused } from "@react-navigation/native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

type RingColors = {
  track: string;
  progress: string;
  dotActive: string;
  dotInactive: string;
  background?: string;
};

type Props = {
  progress: number;
  size: number;
  strokeWidth: number;
  dotCount: number;
  colors: RingColors;
  title: string;
  valueText: string;
  gapDegrees?: number;
  subtitle?: string;
  showDots?: boolean;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const clamp01 = (value: number) => {
  "worklet";
  return Math.min(Math.max(value, 0), 1);
};

export const CircularPointsRing: React.FC<Props> = ({
  progress,
  size,
  strokeWidth,
  dotCount,
  colors,
  title,
  valueText,
  gapDegrees = 0,
  subtitle,
  showDots = true,
}) => {
  const clampedProgress = clamp01(progress);
  const isFocused = useIsFocused();
  const center = size / 2;
  const progressSV = useSharedValue(clampedProgress);

  const radius = useMemo(
    () => Math.max((size - strokeWidth) / 2, 0),
    [size, strokeWidth]
  );
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const dotSize = Math.max(strokeWidth * 0.45, 5);
  const gapRadians = useMemo(
    () => (Math.min(Math.max(gapDegrees, 0), 330) * Math.PI) / 180,
    [gapDegrees]
  );
  const gapHalf = gapRadians > 0 ? (circumference * (gapDegrees / 360)) / 2 : 0;
  const gapLength = useMemo(() => {
    const clampedGap = Math.min(Math.max(gapDegrees, 0), 330);
    return circumference * (clampedGap / 360);
  }, [circumference, gapDegrees]);
  const dashLength = useMemo(() => {
    if (gapLength <= 0.0001) return circumference;
    return Math.max(circumference - gapLength, 0);
  }, [circumference, gapLength]);
  const dashArray = useMemo(() => {
    if (gapLength <= 0.0001) {
      return `${circumference} ${circumference}`;
    }
    return `${dashLength} ${circumference}`;
  }, [circumference, dashLength, gapLength]);

  const detailMarkerSize = Math.max(10, strokeWidth * 0.55);
  const detailMarkers = useMemo(() => {
    const ratios = [0, 0.25, 0.75];
    return ratios.map((ratio) => {
      const angle = ratio * 2 * Math.PI - Math.PI / 2;
      return {
        key: ratio,
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
      };
    });
  }, [center, radius]);

  useEffect(() => {
    if (!isFocused) return;
    progressSV.value = withTiming(clampedProgress, {
      duration: 1500,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [clampedProgress, isFocused, progressSV]);

  const strokeOffset = useDerivedValue(
    () => (1 - progressSV.value) * circumference
  );
  const strokeDashoffsetValue = useDerivedValue(
    () => (gapHalf > 0 ? strokeOffset.value + gapHalf : strokeOffset.value)
  );

  const trackOpacity = useDerivedValue(() =>
    interpolate(
      progressSV.value,
      [0, 0.3, 0.7, 1],
      [0.22, 0.18, 0.12, 0.1],
      Extrapolation.CLAMP
    )
  );
  const highlightOpacity = useDerivedValue(() =>
    interpolate(
      progressSV.value,
      [0, 0.3, 0.7, 1],
      [0.14, 0.12, 0.08, 0.06],
      Extrapolation.CLAMP
    )
  );
  const textureOpacity = useDerivedValue(() =>
    interpolate(
      progressSV.value,
      [0, 0.3, 0.7, 1],
      [0.1, 0.09, 0.06, 0.04],
      Extrapolation.CLAMP
    )
  );
  const highlightStrokeWidth = Math.max(1, strokeWidth * 0.25);
  const textureStrokeWidth = Math.max(1, strokeWidth * 0.18);
  const textureDashArray = `${Math.max(1, strokeWidth * 0.6)} ${Math.max(
    1,
    strokeWidth * 1.0
  )}`;

  const endX = useDerivedValue(() => {
    const angleRange = 2 * Math.PI - gapRadians;
    const start = -Math.PI / 2 + gapRadians / 2;
    const angle = start + clamp01(progressSV.value) * angleRange;
    return center + radius * Math.cos(angle);
  });

  const endY = useDerivedValue(() => {
    const angleRange = 2 * Math.PI - gapRadians;
    const start = -Math.PI / 2 + gapRadians / 2;
    const angle = start + clamp01(progressSV.value) * angleRange;
    return center + radius * Math.sin(angle);
  });

  const trackAnimatedProps = useAnimatedProps(() => ({
    opacity: trackOpacity.value,
  }));
  const highlightAnimatedProps = useAnimatedProps(() => ({
    opacity: highlightOpacity.value,
  }));
  const textureAnimatedProps = useAnimatedProps(() => ({
    opacity: textureOpacity.value,
  }));
  const progressAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffsetValue.value,
  }));
  const endPointAnimatedProps = useAnimatedProps(() => ({
    cx: endX.value,
    cy: endY.value,
  }));

  const dots = useMemo(() => {
    return Array.from({ length: dotCount }).map((_, index) => {
      const ratio = index / dotCount;
      const angle = ratio * 2 * Math.PI - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { ratio, x, y, key: `dot-${index}` };
    });
  }, [center, dotCount, radius]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Tienes ${valueText} puntos redimibles, progreso ${Math.round(
        clampedProgress * 100
      )}%`}
      style={[
        styles.ringContainer,
        {
          width: size,
          height: size,
          backgroundColor: colors.background ?? "transparent",
        },
      ]}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="trackGradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <Stop offset="0%" stopColor={colors.track} stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#0d152c" stopOpacity={0.95} />
          </LinearGradient>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#ff2d55" stopOpacity="1" />
            <Stop offset="50%" stopColor="#ff3b2f" stopOpacity="1" />
            <Stop offset="100%" stopColor="#ff6b3d" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#trackGradient)"
          strokeWidth={strokeWidth + 2}
          animatedProps={trackAnimatedProps}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={gapLength > 0 ? gapLength / 2 : 0}
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={highlightStrokeWidth}
          animatedProps={highlightAnimatedProps}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={gapLength > 0 ? gapLength / 2 : 0}
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={textureStrokeWidth}
          animatedProps={textureAnimatedProps}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={textureDashArray}
          strokeDashoffset={gapLength > 0 ? gapLength / 2 : 0}
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth + 4}
          opacity={0.22}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          animatedProps={progressAnimatedProps}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          animatedProps={progressAnimatedProps}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
        <AnimatedCircle
          r={strokeWidth * 0.7}
          fill={colors.progress}
          opacity={0.22}
          animatedProps={endPointAnimatedProps}
        />
        <AnimatedCircle
          r={strokeWidth * 0.42}
          fill="#ffffff"
          opacity={1}
          animatedProps={endPointAnimatedProps}
        />
      </Svg>

      {showDots &&
        dots.map((dot) => (
          <Dot
            key={dot.key}
            dot={dot}
            dotSize={dotSize}
            colors={colors}
            progressSV={progressSV}
          />
        ))}

      <View style={styles.centerContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { fontSize: Math.min(size * 0.18, 46) }]}>
          {valueText}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {detailMarkers.map((marker) => (
        <View
          key={marker.key}
          style={[
            styles.startMarker,
            {
              width: detailMarkerSize,
              height: detailMarkerSize,
              left: marker.x - detailMarkerSize / 2,
              top: marker.y - detailMarkerSize / 2,
            },
          ]}
        >
          <View
            style={[
              styles.startMarkerGlow,
              {
                backgroundColor: colors.progress,
                opacity: 0.5,
              },
            ]}
          />
          <View style={[styles.startMarkerDot, { backgroundColor: "#fff" }]} />
        </View>
      ))}
    </View>
  );
};

type DotProps = {
  dot: { ratio: number; x: number; y: number };
  dotSize: number;
  colors: RingColors;
  progressSV: SharedValue<number>;
};

const AnimatedView = Animated.createAnimatedComponent(View);

const Dot = React.memo(({ dot, dotSize, colors, progressSV }: DotProps) => {
  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(
        progressSV.value,
        [dot.ratio - 0.001, dot.ratio, dot.ratio + 0.001],
        [0.12, 0.12, 1],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            progressSV.value,
            [dot.ratio - 0.001, dot.ratio, dot.ratio + 0.001],
            [0.85, 0.85, 1.25],
            Extrapolation.CLAMP
          ),
        },
      ],
    }),
    [dot.ratio, progressSV]
  );

  return (
    <View
      style={[
        styles.dot,
        {
          width: dotSize,
          height: dotSize,
          left: dot.x - dotSize / 2,
          top: dot.y - dotSize / 2,
        },
      ]}
    >
      <View
        style={[
          styles.dotCircle,
          {
            backgroundColor: colors.dotInactive,
            borderRadius: dotSize / 2,
          },
        ]}
      />
      <AnimatedView
        style={[
          styles.dotCircle,
          {
            backgroundColor: colors.dotActive,
            borderRadius: dotSize / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
});

Dot.displayName = "Dot";

const styles = StyleSheet.create({
  ringContainer: {
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  title: {
    color: "rgba(255,255,255,0.92)",
    fontFamily: "barlow-semibold",
    fontSize: 13,
    letterSpacing: 0.6,
  },
  value: {
    color: "#fff",
    fontFamily: "barlow-extrabold",
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "barlow-semibold",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  dot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  dotCircle: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  startMarker: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  startMarkerGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
    opacity: 0.35,
  },
  startMarkerDot: {
    width: "55%",
    height: "55%",
    borderRadius: 999,
  },
});
