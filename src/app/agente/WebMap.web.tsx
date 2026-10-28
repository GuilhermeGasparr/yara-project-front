import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";

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
  region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  notificacoes: Notificacao[];
  getMarkerColor?: (categoria: string) => string;
}

export default function WebMap({ region, notificacoes, getMarkerColor }: WebMapProps) {
  const [leafletComponents, setLeafletComponents] = useState<any>(null);

  useEffect(() => {
    // Garante que só executa no navegador
    if (typeof window !== "undefined") {
      const reactLeaflet = require("react-leaflet");
      const L = require("leaflet");
      require("leaflet/dist/leaflet.css");

      // Correção dos ícones padrão do Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });

      // Função geradora de ícones SVG customizados
      const createCustomIcon = (color: string) => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="10" cy="10" r="2.5" fill="#FFFFFF"/>
        </svg>`;
        return L.divIcon({
          html: svg,
          className: "",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
      };

      setLeafletComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        Marker: reactLeaflet.Marker,
        Popup: reactLeaflet.Popup,
        createCustomIcon,
      });
    }
  }, []);

  if (!leafletComponents) {
    return <View style={styles.container} />;
  }

  const { MapContainer, TileLayer, Marker, Popup, createCustomIcon } = leafletComponents;

  return (
    <View style={styles.container}>
      <MapContainer
        center={[region.latitude, region.longitude]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {notificacoes.map((item) => {
          if (!item.latitude || !item.longitude) return null;

          const color = getMarkerColor ? getMarkerColor(item.categoria) : "#D9534F";
          const customIcon = createCustomIcon(color);

          return (
            <Marker 
              key={item.id} 
              position={[item.latitude, item.longitude]}
              icon={customIcon}
            >
              <Popup>
                <strong>{item.tipo_evento}</strong><br />
                {item.endereco || item.local_ocorrencia}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
});