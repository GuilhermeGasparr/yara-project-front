import { Colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { router, Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

function Guard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAgente = segments[0] === "(agente)";
    const inUbs = segments[0] === "(ubs)";
    const inLogin = !user;
    if (!user && !inLogin) {
      router.replace("/");
    } else if (user?.role === "agente" && !inAgente) {
      // @ts-ignore
      router.replace("/(agente)/");
    } else if (user?.role === "ubs" && !inUbs) {
      // @ts-ignore
      router.replace("/(ubs)");
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.teal600,
        }}
      >
        <ActivityIndicator color={Colors.white} size="large" />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: "fade" }} />
        <Stack.Screen name="(agente)" options={{ animation: "fade" }} />
        <Stack.Screen name="(ubs)" options={{ animation: "fade" }} />
      </Stack>
      <Guard />
    </AuthProvider>
  );
}
