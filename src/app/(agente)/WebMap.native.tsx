import React from "react";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { View, StyleSheet } from "react-native";

interface Notificacao {
  id: number;
  tipo_evento: string;
  categoria: string;
  data_envio: string;
  pessoas_animais_infectados_afetados: number;
  local_ocorrencia: string;
  endereco?: string;
  latitude?: number;
  longitude?: number;
}

interface WebMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  notificacoes: Notificacao[];
  getMarkerColor?: (categoria: string) => string;
}

export default function WebMap({
  region,
  notificacoes,
  getMarkerColor,
}: WebMapProps) {
  return (
    <MapView
      provider={PROVIDER_DEFAULT}
      style={StyleSheet.absoluteFill}
      region={region}
    >
      {notificacoes.map((item) => {
        if (
          item.latitude === undefined ||
          item.latitude === null ||
          item.longitude === undefined ||
          item.longitude === null
        ) {
          return null;
        }

        const color = getMarkerColor
          ? getMarkerColor(item.categoria)
          : "#D9534F";

        return (
          <Marker
            key={item.id}
            coordinate={{
              latitude: item.latitude,
              longitude: item.longitude,
            }}
            title={item.tipo_evento}
            description={item.endereco || item.local_ocorrencia}
          >
            <View style={[styles.customPin, { backgroundColor: color }]}>
              <View style={styles.innerPinDot} />
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  customPin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  innerPinDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFF",
  },
});
