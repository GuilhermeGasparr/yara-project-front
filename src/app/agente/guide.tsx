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
const docPlanoEstadual = require('../../assets/Plano-Estadual-de-Preparacao-Vigilancia-e-Resposta-as-Emergencias-em-Saude-Publica (2) (1).pdf'); 
const docPortaria = require('../../assets/PORTARIA GM_MS Nº 11.211, DE 13 DE MAIO DE 2026 - PORTARIA GM_MS Nº 11.211, DE 13 DE MAIO DE 2026 - DOU - Imprensa Nacional.pdf'); 
const docGuiaVigilanciavol2 = require('../../assets/Guia de vigilância em saúde - vol. 2.pdf');
const docGuiaVigilanciavol3 = require('../../assets/Guia de vigilância em saúde - vol. 3 (1).pdf');

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

// Mapeamento individual de cada documento e das FAQs
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
    id: '4',
    title: 'Guia de Vigilância em Saúde — Volume 2',
    subtitle: 'Ministério da Saúde · Material complementar de vigilância em saúde',
    iconName: 'file-text',
    iconBgColor: '#E8F0FE',
    iconColor: '#1A73E8',
    type: 'quick',
    pdfAsset: docGuiaVigilanciavol2,
  },
  {
    id: '5',
    title: 'Guia de Vigilância em Saúde — Volume 3',
    subtitle: 'Ministério da Saúde · Material complementar de vigilância em saúde',
    iconName: 'file-text',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'quick',
    pdfAsset: docGuiaVigilanciavol3,
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

  // Perguntas Frequentes
  {
    id: '6',
    title: 'Quando devo fazer uma notificação?',
    subtitle: 'Sempre que identificar uma situação ou evento que possa representar risco à saúde, mesmo sem confirmação laboratorial.',
    content: 'Sempre que identificar uma situação ou evento que possa representar risco à saúde, mesmo sem confirmação laboratorial. A notificação deve ser efetuada no momento da suspeita.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '7',
    title: 'Preciso ter confirmação da doença para fazer a notificação?',
    subtitle: 'Não. A comunicação pode ser realizada a partir da identificação ou suspeita de uma situação de risco.',
    content: 'Não. A comunicação pode ser realizada a partir da identificação ou suspeita de uma situação de risco à saúde, garantindo maior agilidade na resposta.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '8',
    title: 'O que devo fazer se não souber qual é a doença ou agravo?',
    subtitle: 'Registre as informações observadas. A tecnologia auxiliará na organização inicial, sem substituir o profissional.',
    content: 'Registre as informações que foram observadas. A tecnologia poderá auxiliar na organização e interpretação inicial das informações, sem substituir a avaliação dos profissionais de saúde.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '9',
    title: 'O que devo informar na notificação?',
    subtitle: 'Informe tipo de ocorrência, local, data aproximada, afetados, como foi identificada, entre outros.',
    content: 'Informe, sempre que possível, o tipo de ocorrência, local, data aproximada, número de pessoas ou animais afetados, como a situação foi identificada e outras informações observadas.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '10',
    title: 'Posso fazer uma notificação se não tiver todas as informações?',
    subtitle: 'Sim. Registre as informações disponíveis no momento.',
    content: 'Sim. Registre as informações disponíveis no momento do atendimento ou identificação do evento.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '11',
    title: 'Posso enviar fotos, vídeos ou documentos?',
    subtitle: 'Sim. Quando relevantes para caracterizar a ocorrência, podem ser adicionados como anexos.',
    content: 'Sim. Quando forem relevantes para caracterizar a ocorrência, podem ser adicionados como anexos diretamente pelo aplicativo.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '12',
    title: 'Preciso escrever tudo o que observei?',
    subtitle: 'Não necessariamente. Você pode utilizar a gravação de voz para relatar a situação.',
    content: 'Não necessariamente. Você pode utilizar a gravação de voz para relatar a situação. O Aplicativo realizará a transcrição, que poderá ser revisada antes do envio.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '13',
    title: 'Posso corrigir a informação antes de enviar?',
    subtitle: 'Sim. Revise as informações na etapa de revisão antes de confirmar o envio.',
    content: 'Sim. Revise as informações apresentadas na etapa de revisão antes de confirmar o envio da notificação.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '14',
    title: 'Como acompanho uma notificação que já enviei?',
    subtitle: 'Acesse Minhas Notificações para consultar o histórico e verificar o status.',
    content: 'Acesse a seção "Minhas Notificações" no menu para consultar o histórico e verificar o status das notificações realizadas.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '15',
    title: 'Para que serve o Mapa do Território?',
    subtitle: 'Permite visualizar ocorrências registradas e consultar localização por categorias.',
    content: 'Permite visualizar as ocorrências registradas no território e consultar sua localização, de acordo com as categorias de doença, epizootia e desastre.',
    iconName: 'help-circle',
    iconBgColor: '#E6F4EA',
    iconColor: '#1E8E3E',
    type: 'faq',
  },
  {
    id: '16',
    title: 'O que faço se tiver dificuldade para registrar uma ocorrência?',
    subtitle: 'Consulte o Guia Rápido ou procure a equipe de vigilância do município.',
    content: 'Consulte o Guia Rápido e as Perguntas Frequentes. Se a dúvida persistir, procure a equipe responsável pela vigilância do município.',
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