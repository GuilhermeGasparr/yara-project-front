import { Tabs, useRouter } from "expo-router";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, FontSize } from "@/constants/theme";

// ─── Ícones ───────────────────────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <View style={icon.wrap}>
      <View style={[icon.roofBase, { borderBottomColor: color }]} />
      <View style={[icon.body, { backgroundColor: color }]} />
      <View style={icon.door} />
    </View>
  );
}

function ListIcon({ color }: { color: string }) {
  return (
    <View style={[icon.wrap, { gap: 4 }]}>
      {[22, 16, 20].map((w, i) => (
        <View key={i} style={{ height: 2, width: w, backgroundColor: color, borderRadius: 1 }} />
      ))}
    </View>
  );
}

function MapIcon({ color }: { color: string }) {
  return (
    <View style={[icon.wrap, { flexDirection: "row", gap: 2 }]}>
      {[0.9, 1, 0.9].map((flex, i) => (
        <View key={i} style={{ flex, backgroundColor: i === 1 ? color : `${color}88`, borderRadius: 2 }} />
      ))}
    </View>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <View style={[icon.wrap, { gap: 2 }]}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <View style={{ width: 18, height: 8, borderTopLeftRadius: 9, borderTopRightRadius: 9, backgroundColor: color }} />
    </View>
  );
}

// FAB customizado — não usa tabBarIcon para evitar problemas de layout
function PlusTabIcon() {
  return (
    <View style={fab.circle}>
      <Text style={fab.plus}>+</Text>
    </View>
  );
}

const icon = StyleSheet.create({
  wrap:     { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  roofBase: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 10, borderLeftColor: "transparent", borderRightColor: "transparent", marginBottom: 1 },
  body:     { width: 16, height: 9, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  door:     { position: "absolute", bottom: 2, width: 6, height: 6, backgroundColor: Colors.bg, borderRadius: 1 },
});

const fab = StyleSheet.create({
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.teal600,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Platform.OS === "ios" ? 20 : 10,
    shadowColor: Colors.teal800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  plus: { fontSize: 28, color: Colors.white, fontWeight: "300", lineHeight: 32, marginTop: -2 },
});

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AgenteLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.teal600,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: "rgba(15,110,86,0.1)",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: "500" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => <HomeIcon color={"#18522a"} />,
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "Notificações",
          tabBarIcon: ({ color }) => <ListIcon color={"#18522a"} />,
          // NUNCA colocar href:null aqui — bloqueia navegação programática
        }}
      />

      <Tabs.Screen
        name="newNotification"
        options={{
          title: "Novo",
          tabBarIcon: () => <PlusTabIcon />,
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color }) => <MapIcon color={"#18522a"} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <PersonIcon color={"#18522a"} />,
        }}
      />

      {/* Rotas que existem no filesystem mas não aparecem na tab bar */}
      <Tabs.Screen name="guide" options={{ href: null }} />
    </Tabs>
  );
}