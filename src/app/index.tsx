import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useLoginForm } from "@/hooks/useLoginForm";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Ícone SVG inline — círculo + ponteiro de relógio (logo sentinela) ───────
function SentinelaLogo() {
  return (
    <View style={styles.logoIconWrap}>
      <View style={styles.logoCircle}>
        <View style={styles.logoHandLong} />
        <View style={styles.logoHandShort} />
        <View style={styles.logoDot} />
      </View>
    </View>
  );
}

// ─── Componente Segmented Control Moderno (RoleSelector) ─────────────────────
interface RoleSelectorProps {
  selectedRole: "ACS/ACE" | "UBS" | "";
  onChangeRole: (role: "ACS/ACE" | "UBS") => void;
  hasError?: boolean;
}

function RoleSelector({ selectedRole, onChangeRole, hasError }: RoleSelectorProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Referências de animação
  const sliderAnim = useRef(new Animated.Value(0)).current;
  const scaleACS = useRef(new Animated.Value(1)).current;
  const scaleUBS = useRef(new Animated.Value(1)).current;
  const fadeACS = useRef(new Animated.Value(0.6)).current;
  const fadeUBS = useRef(new Animated.Value(0.6)).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (containerWidth === 0) return;

    // Se não houver nada selecionado (""), deixa o indicador escondido ou na esquerda invisível
    const targetValue = selectedRole === "UBS" ? containerWidth / 2 : 0;

    Animated.spring(sliderAnim, {
      toValue: targetValue,
      useNativeDriver: true,
      bounciness: 4,
      speed: 12,
    }).start();

    Animated.timing(fadeACS, {
      toValue: selectedRole === "ACS/ACE" ? 1 : 0.6,
      duration: 200,
      useNativeDriver: true,
    }).start();

    Animated.timing(fadeUBS, {
      toValue: selectedRole === "UBS" ? 1 : 0.6,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [selectedRole, containerWidth]);

  const onPressIn = (role: "ACS/ACE" | "UBS") => {
    Animated.timing(role === "ACS/ACE" ? scaleACS : scaleUBS, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = (role: "ACS/ACE" | "UBS") => {
    Animated.timing(role === "ACS/ACE" ? scaleACS : scaleUBS, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const sliderWidth = containerWidth ? containerWidth / 2 - 4 : 0;
  // O indicador só aparece se houver uma opção de fato selecionada
  const showIndicator = selectedRole === "ACS/ACE" || selectedRole === "UBS";

  return (
    <View 
      style={[
        styles.selectorContainer, 
        hasError && styles.selectorContainerError
      ]} 
      onLayout={handleLayout}
    >
      {containerWidth > 0 && showIndicator && (
        <Animated.View
          style={[
            styles.sliderIndicator,
            {
              width: sliderWidth,
              transform: [{ translateX: Animated.add(sliderAnim, 4) }],
            },
          ]}
        />
      )}

      <Pressable
        onPressIn={() => onPressIn("ACS/ACE")}
        onPressOut={() => onPressOut("ACS/ACE")}
        onPress={() => onChangeRole("ACS/ACE")}
        style={styles.selectorOption}
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedRole === "ACS/ACE" }}
      >
        <Animated.View style={[styles.optionContent, { transform: [{ scale: scaleACS }], opacity: fadeACS }]}>
          <Feather
            name="users"
            size={16}
            color={selectedRole === "ACS/ACE" ? Colors.teal600 : Colors.gray400}
          />
          <Text style={[styles.selectorText, selectedRole === "ACS/ACE" && styles.selectorTextActive]}>
            ACS / ACE
          </Text>
        </Animated.View>
      </Pressable>

      <Pressable
        onPressIn={() => onPressIn("UBS")}
        onPressOut={() => onPressOut("UBS")}
        onPress={() => onChangeRole("UBS")}
        style={styles.selectorOption}
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedRole === "UBS" }}
      >
        <Animated.View style={[styles.optionContent, { transform: [{ scale: scaleUBS }], opacity: fadeUBS }]}>
          <Feather
            name="home"
            size={16}
            color={selectedRole === "UBS" ? Colors.teal600 : Colors.gray400}
          />
          <Text style={[styles.selectorText, selectedRole === "UBS" && styles.selectorTextActive]}>
            Equipe UBS
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ─── Campo de input reutilizável ──────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  touched?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences";
  returnKeyType?: "next" | "done";
  onChangeText: (v: string) => void;
  onBlur: () => void;
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}

function Field({
  label,
  value,
  placeholder,
  error,
  touched,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  returnKeyType = "next",
  onChangeText,
  onBlur,
  onSubmitEditing,
  inputRef,
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hasError = touched && !!error;

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          focused && styles.inputWrapFocused,
          hasError && styles.inputWrapError,
        ]}
      >
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray200}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          secureTextEntry={secureTextEntry && !showPassword}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur();
          }}
          onSubmitEditing={onSubmitEditing}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={8}
          >
            <Feather 
              name={showPassword ? "eye-off" : "eye"} 
              size={18} 
              color={Colors.gray400} 
            />
          </Pressable>
        )}
      </View>
      {hasError && (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={14} color={Colors.red400} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { signIn } = useAuth();
  const { form, errors, touched, handleChange, handleBlur, validateAll } =
    useLoginForm();

  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const senhaRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleSubmit() {
    setApiError(null);
    const valid = validateAll();
    if (!valid) {
      shake();
      return;
    }

    setLoading(true);
    try {
      await signIn({
        email: form.email.trim().toLowerCase(),
        senha: form.senha,
        tipo: form.tipo, // Vinculado perfeitamente com seu hook
      } as any);
      router.replace("../(tabs)");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro inesperado. Tente novamente.";
      setApiError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  }

  const hasTipoError = touched.tipo && !!errors.tipo;

  return (
    <LinearGradient
      colors={["#085041", "#0F6E56", "#1D9E75"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <SentinelaLogo />
            <Text style={styles.appTitle}>Sentinela Saúde</Text>
            <Text style={styles.appSub}>
              Sistema de Notificação Comunitária
            </Text>
          </View>

          {/* Card do formulário */}
          <Animated.View
            style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}
          >
            <Text style={styles.cardTitle}>Entrar na conta</Text>
            <Text style={styles.cardSub}>
              Acesso restrito a profissionais cadastrados
            </Text>

            {/* Label do Seletor */}
            <Text style={styles.fieldLabel}>Tipo de Usuário</Text>
            
            {/* Seletor conectado diretamente ao hook useLoginForm */}
            <RoleSelector 
              selectedRole={form.tipo} 
              onChangeRole={(value) => handleChange("tipo", value)}
              hasError={hasTipoError}
            />
            {hasTipoError && (
              <View style={[styles.errorRow, { marginTop: -Spacing.md, marginBottom: Spacing.md }]}>
                <Feather name="alert-circle" size={14} color={Colors.red400} />
                <Text style={styles.errorText}>{errors.tipo}</Text>
              </View>
            )}

            <Field
              label="E-mail institucional"
              value={form.email}
              placeholder="seu@email.com"
              keyboardType="email-address"
              returnKeyType="next"
              error={errors.email}
              touched={touched.email}
              onChangeText={(v) => handleChange("email", v)}
              onBlur={() => handleBlur("email")}
              onSubmitEditing={() => senhaRef.current?.focus()}
            />

            <Field
              label="Senha"
              value={form.senha}
              placeholder="••••••••"
              secureTextEntry
              returnKeyType="done"
              error={errors.senha}
              touched={touched.senha}
              onChangeText={(v) => handleChange("senha", v)}
              onBlur={() => handleBlur("senha")}
              onSubmitEditing={handleSubmit}
              inputRef={senhaRef}
            />

            {/* Erro da API */}
            {apiError && (
              <View style={styles.apiErrorBox}>
                <Feather name="x-circle" size={16} color={Colors.red600} style={{ marginTop: 2 }} />
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            )}

            {/* Botão principal */}
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>acesso institucional</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Info */}
            <Text style={styles.helpText}>
              Problemas de acesso?{" "}
              <Text style={styles.helpLink}>
                Contate a Coordenação Municipal.
              </Text>
            </Text>
          </Animated.View>

          {/* Rodapé */}
          <Text style={styles.footer}>
            Sentinela Saúde © {new Date().getFullYear()}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  logoIconWrap: {
    width: 72,
    height: 72,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  logoHandLong: {
    position: "absolute",
    bottom: "50%",
    left: "50%",
    width: 2,
    height: 13,
    backgroundColor: Colors.white,
    borderRadius: 1,
    transformOrigin: "bottom",
    transform: [{ translateX: -1 }, { rotate: "-30deg" }],
  },
  logoHandShort: {
    position: "absolute",
    bottom: "50%",
    left: "50%",
    width: 2,
    height: 9,
    backgroundColor: Colors.teal200,
    borderRadius: 1,
    transform: [{ translateX: -1 }, { rotate: "60deg" }],
  },
  logoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.white,
  },
  appTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: -0.5,
  },
  appSub: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.75)",
    marginTop: 4,
  },

  // Segmented Control (RoleSelector) Styles
  selectorContainer: {
    flexDirection: "row",
    backgroundColor: Colors.gray100,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.gray100,
    padding: 2,
    marginBottom: Spacing.lg,
    position: "relative",
    alignItems: "center",
    height: 48,
  },
  selectorContainerError: {
    borderColor: Colors.red400,
  },
  sliderIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    backgroundColor: Colors.white,
    borderRadius: Radius.sm - 2,
    shadowColor: Colors.gray900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectorOption: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectorText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.gray400,
  },
  selectorTextActive: {
    color: Colors.teal600,
    fontWeight: "700",
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.xl,
    shadowColor: "#04342C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.gray900,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    marginBottom: Spacing.xl,
  },

  // Field
  fieldWrap: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gray600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.gray100,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
  },
  inputWrapFocused: {
    borderColor: Colors.teal600,
    shadowColor: Colors.teal400,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputWrapError: {
    borderColor: Colors.red400,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: FontSize.base,
    color: Colors.gray900,
  },
  eyeBtn: {
    padding: Spacing.sm,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.red400,
    flex: 1,
  },

  // API error
  apiErrorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.red50,
    borderRadius: Radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.red400,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  apiErrorText: {
    fontSize: FontSize.sm,
    color: Colors.red600,
    flex: 1,
    lineHeight: 18,
  },

  // Button
  btnPrimary: {
    backgroundColor: Colors.teal600,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
    minHeight: 48,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.gray100,
  },
  dividerText: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Help
  helpText: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textAlign: "center",
    lineHeight: 18,
  },
  helpLink: {
    color: Colors.teal600,
    fontWeight: "600",
  },

  // Footer
  footer: {
    textAlign: "center",
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.5)",
    marginTop: Spacing.xl,
  },
});