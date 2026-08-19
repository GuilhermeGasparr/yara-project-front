import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, Slot, useSegments } from "expo-router";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0];

    const isProtectedRoute =
      firstSegment === "(agente)" ||
      firstSegment === "(ubs)" ||
      firstSegment === "(cm)";

    if (!user && isProtectedRoute) {
      router.replace("/");
    }
  }, [user, isLoading, segments]);

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