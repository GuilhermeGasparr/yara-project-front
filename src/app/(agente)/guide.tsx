import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

// Tipagem dos itens do guia
interface GuideItem {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  iconName: 'file-text' | 'help-circle' | 'alert-triangle';
  iconBgColor: string;
  iconColor: string;
  type: 'quick' | 'faq';
}

// Dados mockados baseados no layout
const GUIDE_DATA: GuideItem[] = [
  {
    id: '1',
    title: 'Portaria 264/2020',
    subtitle: 'Doenças de notificação compulsória',
    content: 'A Portaria nº 264/2020 estabelece a Lista Nacional de Notificação Compulsória de doenças, agravos e eventos de saúde pública nos serviços de saúde públicos e privados em todo o território nacional.\n\nPrincipais pontos:\n• Notificação imediata (até 24h)\n• Notificação semanal\n• Registro obrigatório em sistemas oficiais',
    iconName: 'file-text',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'quick',
  },
  {
    id: '2',
    title: 'Como identificar arboviroses',
    subtitle: 'Dengue, chikungunya, zika',
    content: 'Sintomas comuns e diferenciais das principais arboviroses:\n\n1. Dengue: Febre alta repentina, dores musculares e atrás dos olhos.\n2. Chikungunya: Dores intensas e inchaço nas articulações.\n3. Zika: Manchas vermelhas no corpo com coceira intensa e febre baixa.',
    iconName: 'help-circle',
    iconBgColor: '#FCE8E6',
    iconColor: '#D93025',
    type: 'quick',
  },
  {
    id: '3',
    title: 'Protocolo de desastres',
    subtitle: 'Orientações para resposta rápida',
    content: 'Diretrizes para atuação em situações de emergência e desastres naturais:\n\n• Avaliação de risco no local\n• Isolamento preventivo de áreas afetadas\n• Acionamento imediato da Defesa Civil e Unidades de Saúde locais',
    iconName: 'alert-triangle',
    iconBgColor: '#FEF7E0',
    iconColor: '#B06000',
    type: 'quick',
  },
  {
    id: '4',
    title: 'Quando devo fazer uma notificação?',
    subtitle: 'Sempre que identificar um evento incomum ou que possa representar risco à saúde da comunidade, mesmo sem certeza diagnóstica.',
    content: 'A notificação deve ser efetuada no momento da suspeita clínica. Não é necessário aguardar a confirmação laboratorial para realizar a notificação inicial, garantindo uma resposta rápida do sistema de vigilância.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '5',
    title: 'Posso editar após o envio?',
    subtitle: 'Não é possível editar após o envio. Caso haja informações adicionais, entre em contato com a Unidade de Saúde.',
    content: 'Para alterar ou complementar dados após o envio oficial, procure o responsável técnico da Unidade de Saúde de referência ou envie um relatório complementar via canal oficial de suporte.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
];

export default function GuideScreen() {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState<GuideItem | null>(null);

  const quickGuides = GUIDE_DATA.filter((item) => item.type === 'quick');
  const faqGuides = GUIDE_DATA.filter((item) => item.type === 'faq');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B664F" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guia Rápido</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Guia Rápido Cards */}
        {quickGuides.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => setSelectedItem(item)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.iconBgColor }]}>
              <Feather name={item.iconName} size={22} color={item.iconColor} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Seção FAQ */}
        <Text style={styles.sectionHeader}>PERGUNTAS FREQUENTES</Text>

        {faqGuides.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.faqCard}
            activeOpacity={0.7}
            onPress={() => setSelectedItem(item)}
          >
            <Text style={styles.faqTitle}>{item.title}</Text>
            <Text style={styles.faqSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal de Detalhes */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedItem?.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <Ionicons name="close" size={24} color="#5F6368" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selectedItem?.title}</Text>
              <Text style={styles.modalContent}>{selectedItem?.content}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  header: {
    backgroundColor: '#0B664F',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  faqTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  faqSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
});