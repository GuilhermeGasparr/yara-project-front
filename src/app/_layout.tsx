import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, Slot, useSegments } from "expo-router";

import {
  AuthProvider,
  getHomeArea,
  getHomeRoute,
  PROTECTED_AREAS,
  useAuth,
} from "@/context/AuthContext";
import { Colors } from "@/constants/theme";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const firstSegment = segments[0] as string | undefined;

  useEffect(() => {
    if (isLoading) return;

    const isProtectedRoute =
      !!firstSegment && PROTECTED_AREAS.includes(firstSegment);

    // Deslogado tentando abrir uma área protegida → login
    if (!user) {
      if (isProtectedRoute) router.replace("/");
      return;
    }

    // Logado na tela de login (ex.: após refresh) ou na área de outro perfil → home do perfil
    if (!isProtectedRoute || firstSegment !== getHomeArea(user.role)) {
      router.replace(getHomeRoute(user.role));
    }
  }, [user, isLoading, firstSegment]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: Colors.bg,
        }}
      >
        <ActivityIndicator
          size="large"
          color={Colors.teal600}
        />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
