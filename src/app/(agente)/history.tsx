import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  Colors,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";

import {
  listarNotificacoes,
  Notificacao,
} from "@/services/NotificationService";

const filtros = [
  "Todos",
  "DOENÇA",
  "EPIZOOTIA",
  "DESASTRE",
  "EM INVESTIGAÇÃO",
];

export default function HistoryScreen() {
  const { width } = useWindowDimensions();

  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [filtro, setFiltro] = useState("Todos");

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const isSmallScreen = width < 380;

  const carregarNotificacoes = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const dados = await listarNotificacoes();

      setNotificacoes(dados);
    } catch (error) {
      console.error(
        "Erro ao carregar notificações:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar notificações."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  const notificacoesFiltradas = useMemo(() => {
    if (filtro === "Todos") {
      return notificacoes;
    }

    if (filtro === "EM INVESTIGAÇÃO") {
      return notificacoes.filter(
        (item) => item.status === "EM INVESTIGAÇÃO"
      );
    }

    return notificacoes.filter(
      (item) => item.categoria === filtro
    );
  }, [notificacoes, filtro]);

  const renderNotificacao = ({
    item,
  }: {
    item: Notificacao;
  }) => {
    const categoriaStyle = getCategoriaStyle(
      item.categoria
    );

    const statusStyle = getStatusStyle(
      item.status
    );

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={() => {
          console.log(
            "Notificação selecionada:",
            item.id
          );
        }}
      >
        {/* Título + Status */}
        <View style={styles.cardHeader}>
          <Text
            style={styles.cardTitle}
            numberOfLines={2}
          >
            {item.nome}
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  statusStyle.backgroundColor,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: statusStyle.color,
                },
              ]}
              numberOfLines={1}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* Data + tipo */}
        <Text style={styles.metadata}>
          {formatarData(item.data_envio)} •{" "}
          {item.tipo_evento}
        </Text>

        {/* Local + afetados */}
        <Text
          style={styles.description}
          numberOfLines={2}
        >
          {formatarAfetados(
            item.pessoas_animais_infectados_afetados,
            item.categoria
          )}{" "}
          • {item.local_ocorrencia}
        </Text>

        <View style={styles.divider} />

        {/* Categoria + ID */}
        <View style={styles.cardFooter}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor:
                  categoriaStyle.backgroundColor,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color: categoriaStyle.color,
                },
              ]}
            >
              {item.categoria}
            </Text>
          </View>

          <Text style={styles.notificationId}>
            #{item.id} →
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.teal800}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <Feather
            name="arrow-left"
            size={19}
            color={Colors.white}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Minhas Notificações
        </Text>

        <Pressable
          style={styles.searchButton}
          hitSlop={10}
        >
          <Feather
            name="search"
            size={23}
            color={Colors.white}
          />
        </Pressable>
      </View>

      {/* FILTROS */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filtros}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => {
            const selected = filtro === item;

            return (
              <Pressable
                onPress={() => setFiltro(item)}
                style={[
                  styles.filterButton,
                  selected &&
                    styles.filterButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected &&
                      styles.filterTextSelected,
                    isSmallScreen &&
                      styles.filterTextSmall,
                  ]}
                >
                  {item === "Todos"
                    ? "Todos"
                    : formatarCategoria(item)}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* CONTEÚDO */}
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator
            size="large"
            color={Colors.teal600}
          />

          <Text style={styles.stateText}>
            Carregando notificações...
          </Text>
        </View>
      ) : erro ? (
        <View style={styles.centerState}>
          <Feather
            name="alert-circle"
            size={42}
            color={Colors.gray400}
          />

          <Text style={styles.emptyTitle}>
            Não foi possível carregar
          </Text>

          <Text style={styles.emptyText}>
            {erro}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={carregarNotificacoes}
          >
            <Text style={styles.retryText}>
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notificacoesFiltradas}
          keyExtractor={(item) =>
            item.id.toString()
          }
          renderItem={renderNotificacao}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.listContent
          }
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: Spacing.md,
              }}
            />
          )}
          refreshing={loading}
          onRefresh={carregarNotificacoes}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather
                name="inbox"
                size={42}
                color={Colors.gray400}
              />

              <Text style={styles.emptyTitle}>
                Nenhuma notificação
              </Text>

              <Text style={styles.emptyText}>
                Não existem notificações para esse
                filtro.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatarData(data: string) {
  if (!data) {
    return "Data não informada";
  }

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) {
    return data;
  }

  return (
    date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " • " +
    date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function formatarAfetados(
  quantidade: number,
  categoria: string
) {
  if (categoria === "EPIZOOTIA") {
    return `${quantidade} animais afetados`;
  }

  return `${quantidade} pessoas afetadas`;
}

function formatarCategoria(categoria: string) {
  switch (categoria) {
    case "DOENÇA":
      return "Doença";

    case "EPIZOOTIA":
      return "Epizootia";

    case "DESASTRE":
      return "Desastre";

    case "EM INVESTIGAÇÃO":
      return "Em investigação";

    default:
      return categoria;
  }
}

function getCategoriaStyle(categoria: string) {
  switch (categoria) {
    case "DOENÇA":
      return {
        backgroundColor: "#FDE8E8",
        color: "#C62828",
      };

    case "EPIZOOTIA":
      return {
        backgroundColor: "#FFF0D8",
        color: "#A15C00",
      };

    case "DESASTRE":
      return {
        backgroundColor: "#E4F0FD",
        color: "#1261A0",
      };

    default:
      return {
        backgroundColor: Colors.gray100,
        color: Colors.gray600,
      };
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "EM INVESTIGAÇÃO":
      return {
        backgroundColor: "#FFF0D8",
        color: "#A15C00",
      };

    case "RECEBIDO":
      return {
        backgroundColor: "#E4F0FD",
        color: "#1261A0",
      };

    case "ENCERRADO":
      return {
        backgroundColor: "#F0EEE9",
        color: "#77736A",
      };

    case "CONFIRMADO":
      return {
        backgroundColor: "#DDF3EC",
        color: "#007C68",
      };

    case "EM ANDAMENTO":
      return {
        backgroundColor: "#E4F0FD",
        color: "#1261A0",
      };

    case "DESCARTADO":
      return {
        backgroundColor: "#FDE8E8",
        color: "#C62828",
      };

    default:
      return {
        backgroundColor: Colors.gray100,
        color: Colors.gray600,
      };
  }
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8F7",
  },

  header: {
    height: 66,
    backgroundColor: Colors.teal800,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },

  searchButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  filterContainer: {
    backgroundColor: "#F4F8F7",
    paddingTop: Spacing.md,
    paddingBottom: 4,
  },

  filterContent: {
    paddingHorizontal: Spacing.md,
    gap: 10,
  },

  filterButton: {
    height: 36,
    paddingHorizontal: 17,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D5E2DF",
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
  },

  filterButtonSelected: {
    backgroundColor: Colors.teal800,
    borderColor: Colors.teal800,
  },

  filterText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    fontWeight: "500",
  },

  filterTextSelected: {
    color: Colors.white,
    fontWeight: "700",
  },

  filterTextSmall: {
    fontSize: 12,
  },

  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#D7E4E1",
    borderRadius: 15,
    padding: Spacing.md,
  },

  cardPressed: {
    opacity: 0.75,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  cardTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.gray900,
    lineHeight: 21,
  },

  statusBadge: {
    maxWidth: 135,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 15,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },

  metadata: {
    marginTop: 7,
    fontSize: FontSize.xs,
    color: Colors.gray600,
    lineHeight: 19,
  },

  description: {
    marginTop: 5,
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: "#D7E4E1",
    marginTop: 12,
    marginBottom: 12,
  },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  categoryBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 15,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: "500",
  },

  notificationId: {
    fontSize: FontSize.xs,
    color: Colors.gray600,
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  stateText: {
    marginTop: 12,
    fontSize: FontSize.sm,
    color: Colors.gray600,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 70,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.gray800,
    textAlign: "center",
  },

  emptyText: {
    marginTop: 5,
    fontSize: FontSize.sm,
    color: Colors.gray600,
    textAlign: "center",
  },

  retryButton: {
    marginTop: 18,
    backgroundColor: Colors.teal600,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },

  retryText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: "700",
  },
});