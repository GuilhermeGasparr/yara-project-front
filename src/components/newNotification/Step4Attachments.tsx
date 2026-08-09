import { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { WizardNavButtons } from "./WizardNavButtons";
import { MediaAnexo, WizardData } from "./constants";

interface Props {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface AnexoOption {
  label: string;
  emoji: string;
  action: () => void;
}

export function Step4Anexos({ data, onChange, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);

  function addMedia(item: MediaAnexo) {
    onChange({ medias: [...data.medias, item] });
  }

  function removeMedia(index: number) {
    const updated = data.medias.filter((_, i) => i !== index);
    onChange({ medias: updated });
  }

  async function pickImage() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Permissão negada", "Habilite o acesso à galeria nas configurações.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      addMedia({ uri: asset.uri, name: asset.fileName ?? "foto.jpg", type: "image/jpeg", thumb: asset.uri });
    }
  }

  async function pickVideo() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      addMedia({ uri: asset.uri, name: asset.fileName ?? "video.mp4", type: "video/mp4" });
    }
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      addMedia({ uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/octet-stream" });
    }
  }

  const options: AnexoOption[] = [
    { label: "Foto", emoji: "📷", action: pickImage },
    { label: "Vídeo", emoji: "🎬", action: pickVideo },
    { label: "Documento", emoji: "📄", action: pickDocument },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Anexos</Text>
      <Text style={styles.sub}>
        Adicione fotos, vídeos ou documentos. A geolocalização será capturada automaticamente.
      </Text>

      {/* Botões de anexar */}
      <View style={styles.optionsRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.label}
            style={styles.optionBtn}
            onPress={opt.action}
            activeOpacity={0.8}
          >
            <Text style={styles.optionEmoji}>{opt.emoji}</Text>
            <Text style={styles.optionLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de anexados */}
      {data.medias.length > 0 && (
        <View style={styles.anexadosList}>
          <Text style={styles.sectionLabel}>Arquivos selecionados ({data.medias.length})</Text>
          {data.medias.map((m, i) => (
            <View key={i} style={styles.anexadoRow}>
              {m.thumb ? (
                <Image source={{ uri: m.thumb }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Text style={{ fontSize: 20 }}>
                    {m.type.startsWith("video") ? "🎬" : "📄"}
                  </Text>
                </View>
              )}
              <Text style={styles.anexadoName} numberOfLines={1}>{m.name}</Text>
              <TouchableOpacity onPress={() => removeMedia(i)} hitSlop={8}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {data.medias.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Nenhum arquivo adicionado ainda.{"\n"}(Opcional)</Text>
        </View>
      )}

      <WizardNavButtons onBack={onBack} onNext={onNext} nextLabel="Revisar →" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  heading: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: 4,
  },
  sub: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  optionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  optionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.gray100,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
  },
  optionEmoji: { fontSize: 28 },
  optionLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.teal600,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  anexadosList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.gray100,
    gap: Spacing.sm,
  },
  anexadoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.gray50,
  },
  thumbPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  anexadoName: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.gray800,
  },
  removeBtn: {
    fontSize: FontSize.base,
    color: Colors.red400,
    fontWeight: "700",
    padding: 4,
  },
  emptyBox: {
    borderWidth: 1.5,
    borderColor: Colors.gray100,
    borderStyle: "dashed",
    borderRadius: Radius.md,
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    textAlign: "center",
    lineHeight: 22,
  },
});