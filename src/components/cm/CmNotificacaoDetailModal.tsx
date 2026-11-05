import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import {
  baixarRelatorioNotificacaoXlsx,
  type NotificacaoCM,
  type StatusCM,
} from "@/services/CmService";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { DeleteNotificationButton } from "@/components/DeleteNotificationButton";
import { formatarDataOcorrencia } from "@/utils/datas";
import { StatusBadge } from "@/components/cm/CmNotifCard";
import {
  CATEGORIA_COLOR,
  rotuloStatus,
} from "@/components/cm/cmNotificacao";

// ─── Modal de detalhes + ações ────────────────────────────────────────────────

interface CmNotificacaoDetailModalProps {
  notif: NotificacaoCM | null;
  onClose: () => void;
  onStatusChange: (id: number, novoStatus: StatusCM) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  loadingId: number | null;
}

export function CmNotificacaoDetailModal({
  notif,
  onClose,
  onStatusChange,
  onDelete,
  loadingId,
}: CmNotificacaoDetailModalProps) {
  const [baixandoRelatorio, setBaixandoRelatorio] = useState(false);
  // Troca de status aguardando confirmação (guarda "de" e "para" para o texto).
  const [statusPendente, setStatusPendente] = useState<{
    de: StatusCM;
    para: StatusCM;
  } | null>(null);
  const [confirmarStatusAberto, setConfirmarStatusAberto] = useState(false);
  if (!notif) return null;

  async function handleBaixarRelatorio() {
    if (!notif) return;

    try {
      setBaixandoRelatorio(true);

      const blob = await baixarRelatorioNotificacaoXlsx(notif.id);

      // Expo Web / navegador
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `notificacao_${notif.id}.xlsx`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        return;
      }

      Alert.alert("Relatório gerado", "O relatório foi gerado com sucesso.");
    } catch (error) {
      Alert.alert(
        "Erro",
        error instanceof Error
          ? error.message
          : "Não foi possível baixar o relatório.",
      );
    } finally {
      setBaixandoRelatorio(false);
    }
  }
  const dotColor = CATEGORIA_COLOR[notif.categoria] ?? Colors.teal400;
  const isLoading = loadingId === notif.id;

  const dataFormatada = new Date(notif.data_envio).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const acoes: {
    label: string;
    status: StatusCM;
    bg: string;
    border: string;
    color: string;
  }[] = [
    {
      label: "✓ Verídico",
      status: "VERÍDICO",
      bg: Colors.teal50,
      border: Colors.teal100,
      color: Colors.teal800,
    },
    {
      label: "⟳ Em investigação",
      status: "EM INVESTIGAÇÃO",
      bg: "#FAEEDA",
      border: "#FAC775",
      color: "#854F0B",
    },
    {
      label: "✗ Não verídico",
      status: "NÃO VERÍDICO",
      bg: "#FDE8E8",
      border: "#F7C1C1",
      color: "#C62828",
    },
    {
      label: "■ Encerrado",
      status: "ENCERRADO",
      bg: "#F0EEE9",
      border: "#D9D5CC",
      color: Colors.gray600,
    },
  ];

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.modalContainer}>
        {/* Handle + Header */}
        <View style={s.modalHeader}>
          <View style={s.dragHandle} />
          <View style={s.modalTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalTitle} numberOfLines={2}>
                {notif.tipo_evento}
              </Text>

              <View style={s.modalMeta}>
                <View style={[s.modalDot, { backgroundColor: dotColor }]} />

                <Text style={s.modalMetaText}>
                  {notif.categoria} · #{String(notif.id).padStart(4, "0")}
                </Text>
              </View>
            </View>

            <StatusBadge status={notif.status} />

            {/* DOWNLOAD */}
            <TouchableOpacity
              onPress={handleBaixarRelatorio}
              style={s.downloadModalBtn}
              disabled={baixandoRelatorio}
              activeOpacity={0.7}
            >
              {baixandoRelatorio ? (
                <ActivityIndicator size="small" color={Colors.teal600} />
              ) : (
                <Feather name="download" size={20} color={Colors.teal600} />
              )}
            </TouchableOpacity>

            {/* EXCLUIR */}
            <DeleteNotificationButton
              protocolo={notif.id}
              onConfirm={() => onDelete(notif.id)}
            />

            {/* FECHAR */}
            <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={12}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={s.modalScroll}
          contentContainerStyle={s.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dados da ocorrência */}
          <Text style={s.detailSectionLabel}>Dados da ocorrência</Text>
          <View style={s.detailCard}>
            <DetailRow label="Data/hora envio" value={dataFormatada} />
            <DetailRow
              label="Data da ocorrência"
              value={formatarDataOcorrencia(notif.data_ocorrencia, {
                comAno: true,
              })}
            />
            <DetailRow label="Local" value={notif.local_ocorrencia} />
            <DetailRow
              label="Afetados"
              value={`${notif.pessoas_animais_infectados_afetados}`}
            />
            <DetailRow
              label="Situação ativa"
              value={notif.continuidade_situacao}
            />
            <DetailRow
              label="Protocolo"
              value={`#${String(notif.id).padStart(7, "0")}`}
            />
          </View>

          {/* Descrição */}
          {!!notif.descricao && (
            <>
              <Text style={s.detailSectionLabel}>Descrição</Text>
              <View style={[s.detailCard, s.descricaoCard]}>
                <Text style={s.descricaoText}>{notif.descricao}</Text>
              </View>
            </>
          )}

          {/* Ações de status */}
          <Text style={s.detailSectionLabel}>Alterar status</Text>
          <View style={s.acoesGrid}>
            {acoes.map((acao) => {
              const isActive = notif.status === acao.status;
              return (
                <TouchableOpacity
                  key={acao.status}
                  style={[
                    s.acaoBtn,
                    { backgroundColor: acao.bg, borderColor: acao.border },
                    isActive && s.acaoBtnActive,
                  ]}
                  onPress={() => {
                    setStatusPendente({ de: notif.status, para: acao.status });
                    setConfirmarStatusAberto(true);
                  }}
                  disabled={isLoading || isActive}
                  activeOpacity={0.8}
                >
                  {isLoading && !isActive ? (
                    <ActivityIndicator size="small" color={acao.color} />
                  ) : (
                    <Text
                      style={[
                        s.acaoBtnText,
                        { color: isActive ? Colors.white : acao.color },
                      ]}
                    >
                      {acao.label}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>

        <ConfirmActionDialog
          visible={confirmarStatusAberto}
          onClose={() => setConfirmarStatusAberto(false)}
          onConfirm={async () => {
            if (statusPendente) {
              await onStatusChange(notif.id, statusPendente.para);
            }
          }}
          icon="refresh-cw"
          title="Alterar status?"
          message={`O status da notificação #${String(notif.id).padStart(4, "0")} passará de "${rotuloStatus(statusPendente?.de)}" para "${rotuloStatus(statusPendente?.para)}".`}
          confirmLabel="Confirmar"
        />
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={s.detailValue}>{value || "—"}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray100,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  modalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    flexShrink: 0,
  },
  modalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
  },
  modalMetaText: { fontSize: FontSize.xs, color: Colors.gray400 },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
  },
  downloadModalBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EAF6F3",
    borderWidth: 1,
    borderColor: "#CDE8E1",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { fontSize: 14, color: Colors.gray600, fontWeight: "600" },
  modalScroll: { flex: 1 },
  modalContent: { padding: Spacing.lg },
  detailSectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  detailCard: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.md,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.white,
  },
  detailLabel: { fontSize: FontSize.sm, color: Colors.gray400 },
  detailValue: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.gray900,
    textAlign: "right",
    flex: 1,
    marginLeft: Spacing.md,
  },
  descricaoCard: { padding: Spacing.md },
  descricaoText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    lineHeight: 22,
  },
  acoesGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  acaoBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: "47%",
    alignItems: "center",
    justifyContent: "center",
  },
  acaoBtnActive: {
    backgroundColor: Colors.teal600,
    borderColor: Colors.teal600,
  },
  acaoBtnText: { fontSize: FontSize.sm, fontWeight: "600" },
});
