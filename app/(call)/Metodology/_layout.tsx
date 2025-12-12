import { Stack } from "expo-router";
import React from "react";

export default function MetodologyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="rewards/index" options={{ title: "Recompensas" }} />
      <Stack.Screen
        name="rewards/[rewardId]"
        options={{ title: "Detalle de recompensa" }}
      />
      <Stack.Screen
        name="rewards/[rewardId]/coupon"
        options={{ title: "Cupón QR" }}
      />
    </Stack>
  );
}
