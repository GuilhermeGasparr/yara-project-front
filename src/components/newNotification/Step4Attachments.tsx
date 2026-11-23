import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { File as ArquivoExpo } from "expo-file-system";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { WizardNavButtons } from "./WizardNavButtons";
import { MediaAnexo, WizardData } from "./constants";
import {
  formatarTamanho,
  MIME_DOCUMENTOS,
  validarAnexo,
  type TipoMidia,
} from "@/utils/midias";

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

// Nem todo seletor informa o tamanho. Se não der para descobrir, devolve null
// e o backend faz a checagem no envio.
async function descobrirTamanho(uri: string, informado?: number | null) {
  if (informado != null) return informado;

  try {
    if (Platform.OS === "web") {
      const resposta = await fetch(uri);
      return (await resposta.blob()).size;
    }
    // File implementa Blob, mas a tipagem do SDK não expõe `size`
    return (new ArquivoExpo(uri) as unknown as Blob).size ?? null;
  } catch {
    return null;
  }
}

export function Step4Anexos({ data, onChange, onNext, onBack }: Props) {
  const [loading, setLoading] = useState(false);
  const [erroAnexo, setErroAnexo] = useState<string | null>(null);

  async function addMedia(
    item: MediaAnexo,
    categoria: TipoMidia,
    tamanhoInformado?: number | null,
  ) {
    const size = await descobrirTamanho(item.uri, tamanhoInformado);
    const erro = validarAnexo(item.name, size, categoria);

    setErroAnexo(erro);
    if (erro) return;

    onChange({ medias: [...data.medias, { ...item, size }] });
  }

  function removeMedia(index: number) {
    setErroAnexo(null);
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
      await addMedia(
        { uri: asset.uri, name: asset.fileName ?? "foto.jpg", type: "image/jpeg", thumb: asset.uri },
        "imagem",
        asset.fileSize,
      );
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
      await addMedia(
        { uri: asset.uri, name: asset.fileName ?? "video.mp4", type: "video/mp4" },
        "video",
        asset.fileSize,
      );
    }
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({ type: MIME_DOCUMENTOS, copyToCacheDirectory: true });
    if (result.assets && result.assets[0]) {
      const asset = result.assets[0];
      await addMedia(
        { uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/octet-stream" },
        "documento",
        asset.size,
      );
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
      <Text style={styles.limites}>
        Fotos (JPG, PNG, WEBP, HEIC) até 10 MB · Vídeos (MP4, MOV, WEBM, 3GP) até 100 MB · Documentos (PDF, DOC, DOCX) até 10 MB
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

      {erroAnexo && (
        <View style={styles.erroBox} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Text style={styles.erroTexto}>{erroAnexo}</Text>
        </View>
      )}

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
              {m.size != null && (
                <Text style={styles.anexadoTamanho}>{formatarTamanho(m.size)}</Text>
              )}
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
  limites: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
    lineHeight: 16,
  },
  erroBox: {
    backgroundColor: Colors.red50,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  erroTexto: {
    fontSize: FontSize.sm,
    color: Colors.red600,
    lineHeight: 18,
  },
  anexadoTamanho: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
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