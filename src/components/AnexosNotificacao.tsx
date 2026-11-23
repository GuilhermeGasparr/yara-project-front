import { Feather } from "@expo/vector-icons";
import { useEvent } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import { useState, type ComponentProps } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import type { MidiaNotificacao } from "@/types";
import {
  nomeDaMidia,
  tipoDaMidia,
  urlImagemCompleta,
  urlMiniatura,
  type TipoMidia,
} from "@/utils/midias";

const ICONES: Record<TipoMidia, keyof typeof Feather.glyphMap> = {
  imagem: "image",
  video: "play-circle",
  documento: "file-text",
};

// Abre direto no navegador: visualizadores externos (Google, Office) receberiam
// o link de um arquivo que pode conter dados de saúde.
async function abrirNoNavegador(url: string) {
  if (Platform.OS === "web") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  await WebBrowser.openBrowserAsync(url);
}

function AvisoErro({ url }: { url: string }) {
  return (
    <View style={styles.erroBox}>
      <Feather name="alert-circle" size={28} color={Colors.white} />
      <Text style={styles.erroTexto}>Não foi possível carregar este anexo.</Text>
      <Pressable
        style={styles.erroBotao}
        onPress={() => abrirNoNavegador(url)}
        accessibilityRole="button"
      >
        <Text style={styles.erroBotaoTexto}>Abrir no navegador</Text>
      </Pressable>
    </View>
  );
}

function VisualizadorImagem({ url }: { url: string }) {
  const [estado, setEstado] = useState<"carregando" | "ok" | "erro">("carregando");

  if (estado === "erro") return <AvisoErro url={url} />;

  return (
    <View style={styles.midiaArea}>
      <Image
        source={{ uri: urlImagemCompleta(url) }}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        onLoad={() => setEstado("ok")}
        onError={() => setEstado("erro")}
        accessibilityLabel="Imagem anexada à notificação"
      />
      {estado === "carregando" && (
        <ActivityIndicator size="large" color={Colors.white} />
      )}
    </View>
  );
}

// Só é montado quando o usuário abre o vídeo, para não gastar a cota do Cloudinary
function VisualizadorVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  const { status } = useEvent(player, "statusChange", { status: player.status });

  if (status === "error") return <AvisoErro url={url} />;

  return (
    <View style={styles.midiaArea}>
      <VideoView
        // A tipagem do expo-video resolve para a variante web em todas as plataformas
        player={player as ComponentProps<typeof VideoView>["player"]}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        nativeControls
      />
      {status === "loading" && (
        <ActivityIndicator size="large" color={Colors.white} />
      )}
    </View>
  );
}

function Visualizador({
  midia,
  nome,
  onClose,
}: {
  midia: MidiaNotificacao;
  nome: string;
  onClose: () => void;
}) {
  return (
    <Modal visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.visualizador}>
        <View style={styles.visualizadorTopo}>
          <Text style={styles.visualizadorNome} numberOfLines={1}>
            {nome}
          </Text>
          <Pressable
            onPress={() => abrirNoNavegador(midia.url)}
            hitSlop={10}
            style={styles.visualizadorBotao}
            accessibilityRole="button"
            accessibilityLabel="Abrir no navegador"
          >
            <Feather name="external-link" size={20} color={Colors.white} />
          </Pressable>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={styles.visualizadorBotao}
            accessibilityRole="button"
            accessibilityLabel="Fechar anexo"
          >
            <Feather name="x" size={22} color={Colors.white} />
          </Pressable>
        </View>

        {tipoDaMidia(midia) === "video" ? (
          <VisualizadorVideo url={midia.url} />
        ) : (
          <VisualizadorImagem url={midia.url} />
        )}
      </View>
    </Modal>
  );
}

export function AnexosNotificacao({ midias }: { midias?: MidiaNotificacao[] }) {
  const [aberta, setAberta] = useState<{ midia: MidiaNotificacao; nome: string } | null>(null);
  const lista = midias ?? [];

  function abrir(midia: MidiaNotificacao, nome: string) {
    if (tipoDaMidia(midia) === "documento") {
      abrirNoNavegador(midia.url);
      return;
    }
    setAberta({ midia, nome });
  }

  return (
    <View style={styles.secao}>
      <Text style={styles.titulo}>Anexos ({lista.length})</Text>

      {lista.length === 0 ? (
        <Text style={styles.vazio}>Nenhum anexo</Text>
      ) : (
        <View style={styles.lista}>
          {lista.map((midia, indice) => {
            const tipo = tipoDaMidia(midia);
            const nome = nomeDaMidia(midia, indice);

            return (
              <Pressable
                key={midia.id}
                onPress={() => abrir(midia, nome)}
                style={({ pressed }) => [styles.linha, pressed && styles.linhaPressionada]}
                accessibilityRole="button"
                accessibilityLabel={`Abrir anexo ${nome}`}
              >
                {tipo === "imagem" ? (
                  <Image
                    source={{ uri: urlMiniatura(midia.url) }}
                    style={styles.miniatura}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.icone}>
                    <Feather name={ICONES[tipo]} size={22} color={Colors.teal600} />
                  </View>
                )}
                <Text style={styles.nome} numberOfLines={1}>
                  {nome}
                </Text>
                <Feather
                  name={tipo === "documento" ? "external-link" : "chevron-right"}
                  size={18}
                  color={Colors.gray400}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {aberta && (
        <Visualizador
          midia={aberta.midia}
          nome={aberta.nome}
          onClose={() => setAberta(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { marginBottom: Spacing.lg },
  titulo: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: Spacing.sm,
  },
  vazio: { fontSize: FontSize.sm, color: Colors.gray400 },
  lista: { gap: Spacing.sm },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.sm,
    minHeight: 60,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
  linhaPressionada: { backgroundColor: Colors.teal50 },
  miniatura: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.gray50,
  },
  icone: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.teal50,
  },
  nome: { flex: 1, fontSize: FontSize.sm, color: Colors.gray800 },
  visualizador: { flex: 1, backgroundColor: "#000000" },
  visualizadorTopo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: Platform.OS === "web" ? Spacing.md : Spacing.xxl + Spacing.md,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  visualizadorNome: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.white,
  },
  visualizadorBotao: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  midiaArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  erroBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  erroTexto: { fontSize: FontSize.base, color: Colors.white, textAlign: "center" },
  erroBotao: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.teal600,
  },
  erroBotaoTexto: { fontSize: FontSize.sm, fontWeight: "700", color: Colors.white },
});
