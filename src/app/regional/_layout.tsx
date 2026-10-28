import { Stack } from "expo-router";

export default function VRLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name = "notificacoes" />
    </Stack>
  );
}