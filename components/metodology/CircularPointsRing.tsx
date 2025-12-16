import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { useIsFocused } from "@react-navigation/native";

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

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

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
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const animatedStrokeOffset = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();
  const center = size / 2;
  const [endPoint, setEndPoint] = useState({ x: center, y: center });
  const rafRef = useRef<number | null>(null);

  const radius = useMemo(
    () => Math.max((size - strokeWidth) / 2, 0),
    [size, strokeWidth]
  );
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);
  const dotSize = Math.max(strokeWidth * 0.45, 5);
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

  const animateStroke = useCallback(() => {
    const targetProgress = clampedProgress;
    const targetOffset = (1 - targetProgress) * circumference;
    animatedProgress.setValue(0);
    animatedStrokeOffset.setValue(circumference);
    Animated.parallel([
      Animated.timing(animatedProgress, {
        toValue: targetProgress,
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedStrokeOffset, {
        toValue: targetOffset,
        duration: 1500,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [animatedProgress, animatedStrokeOffset, circumference, clampedProgress]);

  useEffect(() => {
    if (!isFocused) return;
    animateStroke();
  }, [animateStroke, isFocused, progress]);

  const updateEndPoint = useCallback(
    (value: number) => {
      const gapRadians = (Math.min(Math.max(gapDegrees, 0), 330) * Math.PI) / 180;
      const angleRange = 2 * Math.PI - gapRadians;
      const start = -Math.PI / 2 + gapRadians / 2;
      const angle = start + clamp01(value) * angleRange;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      setEndPoint((prev) =>
        Math.abs(prev.x - x) < 0.5 && Math.abs(prev.y - y) < 0.5
          ? prev
          : { x, y }
      );
    },
    [center, gapDegrees, radius]
  );

  useEffect(() => {
    updateEndPoint(clampedProgress);
  }, [clampedProgress, updateEndPoint]);

  useEffect(() => {
    const listenerId = animatedProgress.addListener(({ value }) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => updateEndPoint(value));
    });
    return () => {
      animatedProgress.removeListener(listenerId);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animatedProgress, updateEndPoint]);

  const trackOpacity = useMemo(
    () =>
      animatedProgress.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [0.22, 0.18, 0.12, 0.1],
        extrapolate: "clamp",
      }),
    [animatedProgress]
  );
  const highlightOpacity = useMemo(
    () =>
      animatedProgress.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [0.14, 0.12, 0.08, 0.06],
        extrapolate: "clamp",
      }),
    [animatedProgress]
  );
  const textureOpacity = useMemo(
    () =>
      animatedProgress.interpolate({
        inputRange: [0, 0.3, 0.7, 1],
        outputRange: [0.1, 0.09, 0.06, 0.04],
        extrapolate: "clamp",
      }),
    [animatedProgress]
  );
  const highlightStrokeWidth = Math.max(1, strokeWidth * 0.25);
  const textureStrokeWidth = Math.max(1, strokeWidth * 0.18);
  const textureDashArray = `${Math.max(1, strokeWidth * 0.6)} ${Math.max(
    1,
    strokeWidth * 1.0
  )}`;

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
          opacity={trackOpacity}
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
          opacity={highlightOpacity}
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
          opacity={textureOpacity}
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
          strokeDashoffset={
            gapLength > 0
              ? Animated.add(animatedStrokeOffset, gapLength / 2)
              : animatedStrokeOffset
          }
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
          strokeDashoffset={
            gapLength > 0
              ? Animated.add(animatedStrokeOffset, gapLength / 2)
              : animatedStrokeOffset
          }
          rotation={-90}
          origin={`${center}, ${center}`}
        />
        <Circle
          cx={endPoint.x}
          cy={endPoint.y}
          r={strokeWidth * 0.7}
          fill={colors.progress}
          opacity={0.22}
        />
        <Circle
          cx={endPoint.x}
          cy={endPoint.y}
          r={strokeWidth * 0.42}
          fill="#ffffff"
          opacity={1}
        />
      </Svg>

      {showDots &&
        dots.map((dot) => {
          const opacity = animatedProgress.interpolate({
            inputRange: [dot.ratio - 0.001, dot.ratio, dot.ratio + 0.001],
            outputRange: [0.12, 0.12, 1],
            extrapolate: "clamp",
          });
          const scale = animatedProgress.interpolate({
            inputRange: [dot.ratio - 0.001, dot.ratio, dot.ratio + 0.001],
            outputRange: [0.85, 0.85, 1.25],
            extrapolate: "clamp",
          });

          return (
            <View
              key={dot.key}
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
              <Animated.View
                style={[
                  styles.dotCircle,
                  {
                    backgroundColor: colors.dotActive,
                    opacity,
                    transform: [{ scale }],
                    borderRadius: dotSize / 2,
                  },
                ]}
              />
            </View>
          );
        })}

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
