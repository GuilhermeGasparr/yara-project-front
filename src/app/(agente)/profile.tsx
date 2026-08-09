import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { AgenteUser } from '@/types';

export default function PerfilScreen() {
  const { user, signOut } = useAuth();
  const agente = user as AgenteUser;

  async function handleSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topbar}>
        <Text style={styles.title}>Perfil</Text>
      </View>
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {agente?.nome?.split(' ').map((p) => p[0]).slice(0, 2).join('') ?? 'AG'}
          </Text>
        </View>
        <Text style={styles.name}>{agente?.nome ?? 'Agente'}</Text>
        <Text style={styles.cargo}>{agente?.cargo ?? 'ACS'}</Text>
      </View>
      <View style={styles.body}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1, backgroundColor: Colors.bg },
  topbar:     { backgroundColor: Colors.teal600, paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16 },
  title:      { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
  hero:       { backgroundColor: Colors.teal600, alignItems: 'center', paddingBottom: 32, paddingTop: 12 },
  avatar:     { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.4)' },
  avatarText: { fontSize: 22, fontWeight: '700', color: Colors.white },
  name:       { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
  cargo:      { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  body:       { padding: Spacing.lg },
  logoutBtn:  { backgroundColor: '#FCEBEB', borderRadius: 10, padding: 14, alignItems: 'center' },
  logoutText: { fontSize: FontSize.base, fontWeight: '700', color: Colors.red600 },
});