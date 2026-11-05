import { useCallback, useState } from "react";
import { Alert } from "react-native";
import {
  deletarNotificacao,
  listarNotificacoesCM,
  setEmInvestigacao,
  setEncerrado,
  setNaoVeridico,
  setVeridico,
  type NotificacaoCM,
  type StatusCM,
} from "@/services/CmService";

const ACAO_POR_STATUS: Record<
  StatusCM,
  ((id: number) => Promise<void>) | undefined
> = {
  "EM ANDAMENTO": undefined,
  "EM INVESTIGAÇÃO": setEmInvestigacao,
  VERÍDICO: setVeridico,
  "NÃO VERÍDICO": setNaoVeridico,
  ENCERRADO: setEncerrado,
};

/** Lista, seleção e ações (status/exclusão) das notificações do Coordenador Municipal. */
export function useCmNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoCM[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificacaoCM | null>(
    null,
  );
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setNotificacoes(await listarNotificacoesCM());
    } catch (err) {
      Alert.alert(
        "Erro",
        err instanceof Error ? err.message : "Falha ao carregar dados.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Lança erro para o diálogo de confirmação exibir a mensagem.
  const handleStatusChange = useCallback(
    async (id: number, novoStatus: StatusCM) => {
      setLoadingId(id);

      try {
        const acao = ACAO_POR_STATUS[novoStatus];

        if (!acao) return;

        await acao(id);

        setNotificacoes((prev) =>
          prev.map((n) => (n.id === id ? { ...n, status: novoStatus } : n)),
        );
        setSelectedNotif((prev) =>
          prev && prev.id === id ? { ...prev, status: novoStatus } : prev,
        );
      } finally {
        setLoadingId(null);
      }
    },
    [],
  );

  // Lança erro para o diálogo de confirmação exibir a mensagem.
  const handleDelete = useCallback(async (id: number) => {
    await deletarNotificacao(id);

    setNotificacoes((prev) => prev.filter((n) => n.id !== id));
    setSelectedNotif(null);
  }, []);

  return {
    notificacoes,
    loading,
    refreshing,
    selectedNotif,
    setSelectedNotif,
    loadingId,
    fetchData,
    handleStatusChange,
    handleDelete,
  };
}
