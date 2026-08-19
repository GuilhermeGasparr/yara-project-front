import { Stack } from "expo-router";

export default function UbsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen
        name="createAgent"
        options={{
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}