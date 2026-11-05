import { Stack } from "expo-router";

export default function CmLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notificacoes" />
      <Stack.Screen
        name="createUbs"
        options={{
          animation: "slide_from_bottom",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}