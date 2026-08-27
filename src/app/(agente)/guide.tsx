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
import * as Linking from 'expo-linking';

// Importação individual dos 3 arquivos PDF disponibilizados
const docGuiaVigilancia = require('../../assets/Guia de vigilância em saúde - 6ª edição.pdf');
const docPlanoEstadual = require('../../assets/Plano-Estadual-de-Preparacao-Vigilancia-e-Resposta-as-Emergencias-em-Saude-Publica (2) (1).pdf'); // Ou .pdf conforme salvo nos assets
const docPortaria = require('../../assets/PORTARIA GM_MS Nº 11.211, DE 13 DE MAIO DE 2026 - PORTARIA GM_MS Nº 11.211, DE 13 DE MAIO DE 2026 - DOU - Imprensa Nacional.pdf'); // Ou .pdf conforme salvo nos assets

interface GuideItem {
  id: string;
  title: string;
  subtitle: string;
  content?: string;
  iconName: 'file-text' | 'help-circle' | 'alert-triangle' | 'shield' | 'database';
  iconBgColor: string;
  iconColor: string;
  type: 'quick' | 'faq';
  pdfAsset?: any;
}

// Mapeamento individual de cada documento para o seu card correspondente
const GUIDE_DATA: GuideItem[] = [
  {
    id: '1',
    title: 'Guia de Vigilância em Saúde',
    subtitle: 'Ministério da Saúde - 6ª Edição Revisada (2024)',
    iconName: 'file-text',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'quick',
    pdfAsset: docGuiaVigilancia,
  },
  {
    id: '2',
    title: 'Plano Estadual de Preparação de Vigilância',
    subtitle: 'Plano de Vigilância e resposta às Emergências em Saúde Pública',
    iconName: 'shield',
    iconBgColor: '#E8F0FE',
    iconColor: '#1A73E8',
    type: 'quick',
    pdfAsset: docPlanoEstadual,
  },
  {
    id: '3',
    title: 'PORTARIA Nº 11.211',
    subtitle: 'Portaria GM_MS Nº 11.211, De 13 de Maio de 2026',
    iconName: 'help-circle',
    iconBgColor: '#FEF7E0',
    iconColor: '#B06000',
    type: 'quick',
    pdfAsset: docPortaria,
  },
  {
    id: '4',
    title: 'Quando devo fazer uma notificação?',
    subtitle: 'Sempre que identificar um evento de risco à saúde, mesmo sem confirmação laboratorial.',
    content: 'A notificação deve ser efetuada no momento da suspeita clínica. Não é necessário aguardar a confirmação laboratorial para realizar a notificação inicial, garantindo uma resposta rápida do sistema de vigilância.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '5',
    title: 'Como registrar doses em atraso?',
    subtitle: 'Utilize o Prontuário Eletrônico ou e-SUS AB conforme o local de atendimento.',
    content: 'Para transcrição de registros anteriores (RA), é necessário comprovar via caderneta física e informar CPF/CNS válido, dados do lote, fabricante e profissional aplicador no sistema oficial.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
];

export default function GuideScreen() {
  const router = useRouter();
  const [selectedFaq, setSelectedFaq] = useState<GuideItem | null>(null);

  const quickGuides = GUIDE_DATA.filter((item) => item.type === 'quick');
  const faqGuides = GUIDE_DATA.filter((item) => item.type === 'faq');

  // Função para abrir o arquivo
  const handleOpenDocument = async (asset: any) => {
    try {
      const uri = Linking.createURL(asset);
      await Linking.openURL(uri);
    } catch (error) {
      console.error('Erro ao abrir o documento:', error);
    }
  };

  const handleCardPress = (item: GuideItem) => {
    if (item.pdfAsset) {
      handleOpenDocument(item.pdfAsset);
    } else {
      setSelectedFaq(item);
    }
  };

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
        {/* Documentos */}
        {quickGuides.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handleCardPress(item)}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.iconBgColor }]}>
              <Feather name={item.iconName} size={22} color={item.iconColor} />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Feather name="external-link" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}

        {/* Seção FAQ */}
        <Text style={styles.sectionHeader}>PERGUNTAS FREQUENTES</Text>

        {faqGuides.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.faqCard}
            activeOpacity={0.7}
            onPress={() => handleCardPress(item)}
          >
            <Text style={styles.faqTitle}>{item.title}</Text>
            <Text style={styles.faqSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Modal para FAQs */}
      <Modal
        visible={!!selectedFaq}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFaq(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {selectedFaq?.title}
              </Text>
              <TouchableOpacity onPress={() => setSelectedFaq(null)}>
                <Ionicons name="close" size={24} color="#5F6368" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selectedFaq?.title}</Text>
              <Text style={styles.modalContent}>{selectedFaq?.content}</Text>
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