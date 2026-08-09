import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize } from '@/constants/theme';

// TODO: implementar tela de histórico completo
export default function HistoryScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.title}>Notificações</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.placeholder}>Em construção 🚧</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.bg },
  topbar:  { backgroundColor: Colors.teal600, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16 },
  title:   { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: FontSize.base, color: Colors.gray400 },
});