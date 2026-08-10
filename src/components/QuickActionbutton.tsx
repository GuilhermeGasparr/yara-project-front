import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

interface Props {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  onPress: () => void;
  primary?: boolean;
  style?: ViewStyle;
}

export function QuickActionButton({ label, sublabel, icon, onPress, primary = false, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.base, primary ? styles.primary : styles.secondary, style]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[styles.iconWrap, primary ? styles.iconPrimary : styles.iconSecondary]}>
        {icon}
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, primary && styles.labelPrimary]}>{label}</Text>
        <Text style={[styles.sublabel, primary && styles.sublabelPrimary]}>{sublabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  primary:   { backgroundColor: Colors.teal600, borderColor: Colors.teal600 },
  secondary: { backgroundColor: Colors.white,   borderColor: 'rgba(15,110,86,0.12)' },
  iconWrap: {
    width: 44, height: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPrimary:   { backgroundColor: 'rgba(255,255,255,0.2)' },
  iconSecondary: { backgroundColor: Colors.teal50 },
  textWrap: { flex: 1, gap: 2 },
  label:         { fontSize: FontSize.base, fontWeight: '600', color: Colors.gray900 },
  labelPrimary:  { color: Colors.white },
  sublabel:      { fontSize: FontSize.xs, color: Colors.gray400 },
  sublabelPrimary: { color: 'rgba(255,255,255,0.75)' },
});