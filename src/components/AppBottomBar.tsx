import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontSize, Spacing } from '@/constants/theme';

export type NavTab = 'home' | 'notificacoes' | 'novo' | 'mapa' | 'perfil';

interface NavItemConfig {
  key: NavTab;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

// ─── Ícones minimalistas em View ──────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? Colors.teal600 : Colors.gray400;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 22, height: 22 }}>
      <View style={{ width: 14, height: 10, borderWidth: 1.8, borderColor: c, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomWidth: 0 }} />
      <View style={{ width: 22, height: 1.8, backgroundColor: c, marginTop: -1 }} />
      <View style={{ width: 6, height: 7, borderWidth: 1.8, borderColor: c, borderTopWidth: 0, marginTop: 0 }} />
    </View>
  );
}

function ListIcon({ active }: { active: boolean }) {
  const c = active ? Colors.teal600 : Colors.gray400;
  return (
    <View style={{ gap: 3, justifyContent: 'center', width: 22, height: 22 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ height: 1.8, backgroundColor: c, borderRadius: 1, width: i === 0 ? 22 : 16 }} />
      ))}
    </View>
  );
}

function MapIcon({ active }: { active: boolean }) {
  const c = active ? Colors.teal600 : Colors.gray400;
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 18, height: 14, borderWidth: 1.8, borderColor: c, borderRadius: 2 }} />
      <View style={{ position: 'absolute', top: 4, left: 10, width: 1.8, height: 14, backgroundColor: c }} />
    </View>
  );
}

function PersonIcon({ active }: { active: boolean }) {
  const c = active ? Colors.teal600 : Colors.gray400;
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 1.8, borderColor: c }} />
      <View style={{ width: 14, height: 6, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 1.8, borderColor: c, borderBottomWidth: 0 }} />
    </View>
  );
}

// ─── Botão central (+) ────────────────────────────────────────────────────────

interface CenterButtonProps {
  onPress: () => void;
}

function CenterButton({ onPress }: CenterButtonProps) {
  return (
    <TouchableOpacity style={styles.centerBtn} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.centerBtnInner}>
        <Text style={styles.centerBtnPlus}>+</Text>
      </View>
      <Text style={styles.centerLabel}>Novo</Text>
    </TouchableOpacity>
  );
}

// ─── AppBottomBar ─────────────────────────────────────────────────────────────

interface AppBottomBarProps {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
}

const NAV_ITEMS: NavItemConfig[] = [
  { key: 'home',          label: 'Início',       icon: (a) => <HomeIcon active={a} /> },
  { key: 'notificacoes',  label: 'Notificações', icon: (a) => <ListIcon active={a} /> },
  { key: 'mapa',          label: 'Mapa',         icon: (a) => <MapIcon active={a} /> },
  { key: 'perfil',        label: 'Perfil',       icon: (a) => <PersonIcon active={a} /> },
];

export function AppBottomBar({ active, onNavigate }: AppBottomBarProps) {
  const left  = NAV_ITEMS.slice(0, 2);
  const right = NAV_ITEMS.slice(2);

  return (
    <View style={styles.bar}>
      {/* Esquerda */}
      {left.map((item) => {
        const isActive = active === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => onNavigate(item.key)}
            activeOpacity={0.7}
          >
            {item.icon(isActive)}
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Botão central */}
      <CenterButton onPress={() => onNavigate('novo')} />

      {/* Direita */}
      {right.map((item) => {
        const isActive = active === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => onNavigate(item.key)}
            activeOpacity={0.7}
          >
            {item.icon(isActive)}
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,110,86,0.1)',
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 2,
  },
  navLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    fontWeight: '500',
  },
  navLabelActive: {
    color: Colors.teal600,
  },
  centerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
  },
  centerBtnInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.teal600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    borderWidth: 3,
    borderColor: Colors.bg,
    shadowColor: Colors.teal800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  centerBtnPlus: {
    fontSize: 26,
    color: Colors.white,
    fontWeight: '300',
    lineHeight: 30,
  },
  centerLabel: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    fontWeight: '500',
  },
});