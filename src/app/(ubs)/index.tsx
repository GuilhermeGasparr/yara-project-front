import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  buscarNotificacoesUBS,
  validarNotificacaoAPI,
  encaminharNotificacaoAPI,
  complementarNotificacaoAPI,
  obterDetalhesNotificacaoAPI,
  NotificacaoUBS,
} from '@/services/UbsService';

export default function UbsHomeScreen() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoUBS[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados do Modal de Relatório
  const [itemSelecionado, setItemSelecionado] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [textoComplemento, setTextoComplemento] = useState('');
  const [mostrarCampoComplemento, setMostrarCampoComplemento] = useState(false);

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  async function carregarNotificacoes() {
    try {
      const data = await buscarNotificacoesUBS();
      setNotificacoes(data);
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Falha ao carregar notificações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function abrirRelatorio(id: number) {
    try {
      setModalVisible(true);
      setLoadingDetalhes(true);
      setMostrarCampoComplemento(false);
      setTextoComplemento('');
      const detalhes = await obterDetalhesNotificacaoAPI(id);
      setItemSelecionado(detalhes);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
      setModalVisible(false);
    } finally {
      setLoadingDetalhes(false);
    }
  }

  async function handleValidar(id: number) {
    try {
      await validarNotificacaoAPI(id);
      Alert.alert('Sucesso', 'Notificação validada com sucesso.');
      setModalVisible(false);
      carregarNotificacoes();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  }

  async function handleEncaminhar(id: number) {
    try {
      await encaminharNotificacaoAPI(id);
      Alert.alert('Sucesso', 'Notificação encaminhada com sucesso.');
      setModalVisible(false);
      carregarNotificacoes();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  }

  async function handleSalvarComplemento(id: number) {
    if (!textoComplemento.trim()) {
      Alert.alert('Aviso', 'Escreva uma informação para complementar.');
      return;
    }
    try {
      await complementarNotificacaoAPI(id, textoComplemento);
      Alert.alert('Sucesso', 'Informação acrescentada à notificação!');
      setMostrarCampoComplemento(false);
      abrirRelatorio(id);
    } catch (err: any) {
      Alert.alert('Erro', err.message);
    }
  }

  const pendentes = notificacoes.filter((n) => n.status === 'EM ANDAMENTO');
  const encaminhadas = notificacoes.filter((n) => n.status === 'ENCAMINHADA' || n.status === 'VALIDADA');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B664F" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Unidade de Saúde</Text>
          <Text style={styles.headerTitle}>USF Vila Verde</Text>
        </View>
        <TouchableOpacity style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); carregarNotificacoes(); }} />
        }
      >
        <View style={styles.alertCard}>
          <Feather name="alert-triangle" size={20} color="#B45309" />
          <Text style={styles.alertText}>
            <Text style={styles.alertTextBold}>{pendentes.length} notificações</Text> aguardam validação da unidade.
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{notificacoes.length}</Text>
            <Text style={styles.statLabel}>Recebidas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendentes.length}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{encaminhadas.length}</Text>
            <Text style={styles.statLabel}>Encaminhadas</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>NOTIFICAÇÕES DO TERRITÓRIO</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0B664F" style={{ marginTop: 20 }} />
        ) : (
          notificacoes.map((item) => {
            const isPendente = item.status === 'EM ANDAMENTO';

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, isPendente && styles.cardBorderPendente]}
                onPress={() => abrirRelatorio(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.nome}</Text>
                  <View style={[styles.badge, isPendente ? styles.badgePendente : styles.badgeEncerrado]}>
                    <Text style={[styles.badgeText, isPendente ? styles.badgeTextPendente : styles.badgeTextEncerrado]}>
                      {isPendente ? 'Pendente' : item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardMeta}>
                  {new Date(item.data_envio).toLocaleDateString('pt-BR')} · {item.tipo_evento}
                </Text>

                <Text style={styles.cardSubtext}>
                  {item.pessoas_animais_infectados_afetados > 0 &&
                    `${item.pessoas_animais_infectados_afetados} afetados · `}
                  #{new Date().getFullYear()}-{String(item.id).padStart(4, '0')}
                </Text>

                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnValidar]}
                    onPress={() => handleValidar(item.id)}
                  >
                    <Feather name="check" size={16} color="#065F46" />
                    <Text style={styles.btnValidarText}>Validar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnEncaminhar]}
                    onPress={() => handleEncaminhar(item.id)}
                  >
                    <Feather name="corner-up-right" size={16} color="#1E40AF" />
                    <Text style={styles.btnEncaminharText}>Encaminhar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.btnComplementar]}
                    onPress={() => abrirRelatorio(item.id)}
                  >
                    <Text style={styles.btnComplementarText}>Relatório</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal do Relatório Completo */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
              <Feather name="x" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Relatório da Notificação</Text>
            <View style={{ width: 24 }} />
          </View>

          {loadingDetalhes ? (
            <ActivityIndicator size="large" color="#0B664F" style={{ marginTop: 40 }} />
          ) : itemSelecionado ? (
            <ScrollView style={{ padding: 20 }}>
              <Text style={styles.reportTitle}>{itemSelecionado.nome}</Text>

              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Status:</Text>
                <Text style={styles.reportValue}>{itemSelecionado.status}</Text>
              </View>

              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Categoria / Evento:</Text>
                <Text style={styles.reportValue}>
                  {itemSelecionado.categoria} — {itemSelecionado.tipo_evento}
                </Text>
              </View>

              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Local da Ocorrência:</Text>
                <Text style={styles.reportValue}>{itemSelecionado.local_ocorrencia}</Text>
              </View>

              <View style={styles.reportRow}>
                <Text style={styles.reportLabel}>Pessoas/Animais Afetados:</Text>
                <Text style={styles.reportValue}>{itemSelecionado.pessoas_animais_infectados_afetados}</Text>
              </View>

              <View style={styles.reportSection}>
                <Text style={styles.reportSectionTitle}>Descrição / Observações:</Text>
                <Text style={styles.reportDescription}>{itemSelecionado.descricao}</Text>
              </View>

              {/* Formulário para complementar */}
              {mostrarCampoComplemento ? (
                <View style={styles.complementBox}>
                  <Text style={styles.complementTitle}>Adicionar Informação Complementar</Text>
                  <TextInput
                    style={styles.complementInput}
                    multiline
                    placeholder="Digite observações de campo ou notas de atendimento..."
                    value={textoComplemento}
                    onChangeText={setTextoComplemento}
                  />
                  <TouchableOpacity
                    style={styles.btnSalvarComplemento}
                    onPress={() => handleSalvarComplemento(itemSelecionado.id)}
                  >
                    <Text style={styles.btnSalvarComplementoText}>Salvar Complemento</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.btnAbrirComplemento}
                  onPress={() => setMostrarCampoComplemento(true)}
                >
                  <Feather name="plus-circle" size={16} color="#0B664F" />
                  <Text style={styles.btnAbrirComplementoText}>Complementar Notificação</Text>
                </TouchableOpacity>
              )}

              {/* Botões de Ação Final */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnValidar, { paddingVertical: 12 }]}
                  onPress={() => handleValidar(itemSelecionado.id)}
                >
                  <Feather name="check" size={18} color="#065F46" />
                  <Text style={[styles.btnValidarText, { fontSize: 14 }]}>Validar Chamado</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnEncaminhar, { paddingVertical: 12 }]}
                  onPress={() => handleEncaminhar(itemSelecionado.id)}
                >
                  <Feather name="corner-up-right" size={18} color="#1E40AF" />
                  <Text style={[styles.btnEncaminharText, { fontSize: 14 }]}>Encaminhar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  header: { backgroundColor: '#0B664F', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSubtitle: { color: 'rgba(255, 255, 255, 0.75)', fontSize: 12 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  bellButton: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  alertCard: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#D97706' },
  alertText: { color: '#92400E', fontSize: 13, flex: 1 },
  alertTextBold: { fontWeight: '700' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#0B664F', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#6B7280' },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 12, letterSpacing: 0.5 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardBorderPendente: { borderLeftWidth: 4, borderLeftColor: '#D97706' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgePendente: { backgroundColor: '#FEF3C7' },
  badgeEncerrado: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextPendente: { color: '#D97706' },
  badgeTextEncerrado: { color: '#9CA3AF' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  cardSubtext: { fontSize: 13, color: '#4B5563', marginBottom: 12 },
  actionsContainer: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  btnValidar: { backgroundColor: '#E6F4EA' },
  btnValidarText: { color: '#065F46', fontWeight: '700', fontSize: 12 },
  btnEncaminhar: { backgroundColor: '#EFF6FF' },
  btnEncaminharText: { color: '#1E40AF', fontWeight: '700', fontSize: 12 },
  btnComplementar: { backgroundColor: '#F3F4F6' },
  btnComplementarText: { color: '#4B5563', fontWeight: '700', fontSize: 12 },

  // Estilos do Modal
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  reportTitle: { fontSize: 20, fontWeight: '700', color: '#0B664F', marginBottom: 16 },
  reportRow: { marginBottom: 12 },
  reportLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  reportValue: { fontSize: 15, color: '#1F2937', fontWeight: '500', marginTop: 2 },
  reportSection: { marginTop: 12, marginBottom: 20 },
  reportSectionTitle: { fontSize: 13, color: '#374151', fontWeight: '700', marginBottom: 6 },
  reportDescription: { fontSize: 14, color: '#4B5563', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  modalActions: { flexDirection: 'column', gap: 10, marginTop: 24, marginBottom: 40 },
  btnAbrirComplemento: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 10 },
  btnAbrirComplementoText: { color: '#0B664F', fontWeight: '700', fontSize: 14 },
  complementBox: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10, marginVertical: 10 },
  complementTitle: { fontSize: 13, fontWeight: '700', color: '#166534', marginBottom: 8 },
  complementInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCFCE7', borderRadius: 8, padding: 10, height: 80, textAlignVertical: 'top', marginBottom: 10 },
  btnSalvarComplemento: { backgroundColor: '#0B664F', padding: 10, borderRadius: 8, alignItems: 'center' },
  btnSalvarComplementoText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
});