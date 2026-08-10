import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

interface Props {
  value: number | string;
  label: string;
  accentColor?: string;
}

export function StatsCard({ value, label, accentColor = Colors.teal600 }: Props) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,110,86,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  value: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    marginTop: 2,
    textAlign: 'center',
  },
});