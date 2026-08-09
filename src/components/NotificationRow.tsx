import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { Notificacao, NotificacaoStatus } from '@/services/NotificationService';

const STATUS_CONFIG: Record<NotificacaoStatus, { label: string; bg: string; color: string }> = {
  'EM ANDAMENTO':    { label: 'Em andamento',   bg: Colors.teal50,  color: Colors.teal800 },
  'RECEBIDO':        { label: 'Recebido',        bg: '#E6F1FB',      color: '#0C447C'      },
  'EM INVESTIGAÇÃO': { label: 'Em investigação', bg: '#FAEEDA',      color: '#854F0B'      },
  'CONFIRMADO':      { label: 'Confirmado',      bg: Colors.teal50,  color: Colors.teal800 },
  'DESCARTADO':      { label: 'Descartado',      bg: Colors.gray50,  color: Colors.gray600 },
  'ENCERRADO':       { label: 'Encerrado',       bg: Colors.gray50,  color: Colors.gray400 },
};

const CATEGORIA_DOT: Record<string, string> = {
  'DOENÇA':    Colors.red400,
  'EPIZOOTIA': '#BA7517',
  'DESASTRE':  '#378ADD',
};

interface Props {
  item: Notificacao;
  onPress?: (item: Notificacao) => void;
}

export function NotificationRow({ item, onPress }: Props) {
  const dot    = CATEGORIA_DOT[item.categoria] ?? Colors.teal400;
  const status = STATUS_CONFIG[item.status]    ?? STATUS_CONFIG['EM ANDAMENTO'];

  const data = new Date(item.data_envio).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress?.(item)} activeOpacity={0.75}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>{item.tipo_evento}</Text>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        <Text style={styles.meta}>{data} · {item.local_ocorrencia}</Text>
        {item.rascunho && <Text style={styles.draft}>📝 Rascunho</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,110,86,0.08)',
  },
  dot:     { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  content: { flex: 1, gap: 3 },
  topRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  title:   { fontSize: FontSize.base, fontWeight: '600', color: Colors.gray900, flex: 1 },
  meta:    { fontSize: FontSize.xs, color: Colors.gray400 },
  draft:   { fontSize: FontSize.xs, color: Colors.teal600, fontWeight: '500' },
  badge:   { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { fontSize: 10, fontWeight: '600' },
});