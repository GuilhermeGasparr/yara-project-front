import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";
import { getItem } from "@/utils/storage";

// ─── Service ──────────────────────────────────────────────────────────────────

const BASE_URL = "https://yara-project.onrender.com";
//const BASE_URL = "http://localhost:8000";

async function criarVigilanteRegional(payload: {
  nome: string;
  cpf: string;
  senha: string;
  superintendencia: number;
}): Promise<void> {
  const token = await getItem("sentinela_token");
  const res = await fetch(`${BASE_URL}/ve/criar_conta_vr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.detail ?? "Erro ao criar conta da Vigilância Regional.");
}

// ─── Campo animado ────────────────────────────────────────────────────────────

interface AnimatedFieldProps {
  label: string;
  value: string;
  placeholder: string;
  onBlur?: () => void;
  onChangeText: (v: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "numeric";
  autoCapitalize?: "none" | "words";
  returnKeyType?: "next" | "done";
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
}

function AnimatedField({
  label,
  value,
  placeholder,
  onChangeText,
  onBlur: onBlurProp,
  error,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  returnKeyType = "next",
  onSubmitEditing,
  inputRef,
}: AnimatedFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const borderAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  function onFocus() {
    setFocused(true);

    Animated.parallel([
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();
  }

  function handleInputBlur() {
    setFocused(false);

    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    if (!value) {
      Animated.timing(labelAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: false,
      }).start();
    }

    onBlurProp?.();
  }

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? Colors.red400 : Colors.gray100,
      error ? Colors.red400 : Colors.teal600,
    ],
  });

  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, -9],
  });
  const labelSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 11],
  });
  const labelColor = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.gray200, error ? Colors.red400 : Colors.teal600],
  });

  return (
    <View style={styles.fieldWrap}>
      <Animated.View style={[styles.fieldBox, { borderColor }]}>
        <Animated.Text
          style={[
            styles.floatingLabel,
            {
              top: labelTop,
              fontSize: labelSize,
              color: labelColor,
              backgroundColor: value || focused ? Colors.white : "transparent",
              paddingHorizontal: value || focused ? 4 : 0,
            },
          ]}
        >
          {label}
        </Animated.Text>

        <TextInput
          ref={inputRef}
          style={styles.fieldInput}
          value={value}
          placeholder={focused ? "" : placeholder}
          placeholderTextColor={Colors.gray200}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={handleInputBlur}
          secureTextEntry={secureTextEntry && !showPw}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />

        {secureTextEntry && (
          <Pressable
            onPress={() => setShowPw((v) => !v)}
            style={styles.eyeBtn}
            hitSlop={10}
          >
            <Text style={styles.eyeIcon}>{showPw ? "🙈" : "👁"}</Text>
          </Pressable>
        )}
      </Animated.View>

      {!!error && (
        <Animated.Text style={styles.fieldError}>⚠ {error}</Animated.Text>
      )}
    </View>
  );
}

// ─── Success overlay ──────────────────────────────────────────────────────────

function SuccessOverlay({
  nome,
  onDone,
  onAnother,
}: {
  nome: string;
  onDone: () => void;
  onAnother: () => void;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 12,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Animated.View style={[styles.successOverlay, { opacity }]}>
      <Animated.View style={[styles.successBox, { transform: [{ scale }] }]}>
        <Text style={styles.successEmoji}>✓</Text>
        <Text style={styles.successTitle}>Conta criada!</Text>
        <Text style={styles.successSub}>
          O(A) vigilante regional{" "}
          <Text style={{ fontWeight: "700" }}>{nome}</Text> foi cadastrado(a)
          com sucesso no sistema.
        </Text>
        <TouchableOpacity
          style={styles.successBtn}
          onPress={onDone}
          activeOpacity={0.85}
        >
          <Text style={styles.successBtnText}>Concluir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.successBtnOutline}
          onPress={onAnother}
          activeOpacity={0.8}
        >
          <Text style={styles.successBtnOutlineText}>
            Cadastrar outro Vigilante Regional
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

interface FormState {
  nome: string;
  cpf: string;
  superintendencia: string;
  senha: string;
  confirmarSenha: string;
}

interface FormErrors {
  nome?: string;
  cpf?: string;
  superintendencia?: string;
  senha?: string;
  confirmarSenha?: string;
}

const EMPTY_FORM: FormState = {
  nome: "",
  cpf: "",
  superintendencia: "",
  senha: "",
  confirmarSenha: "",
};

const NOT_TOUCHED: Record<keyof FormState, boolean> = {
  nome: false,
  cpf: false,
  superintendencia: false,
  senha: false,
  confirmarSenha: false,
};

export default function CreateVRScreen() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] =
    useState<Record<keyof FormState, boolean>>(NOT_TOUCHED);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Refs para navegação
  const cpfRef = useRef<TextInput>(null);
  const superRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  function validate(f: FormState): FormErrors {
    const e: FormErrors = {};

    if (!f.nome.trim()) e.nome = "Nome do Vigilante obrigatório.";
    else if (f.nome.trim().length < 3) e.nome = "Mínimo 3 caracteres.";

    if (!f.cpf.trim()) {
      e.cpf = "CPF obrigatório.";
    } else {
      const cpfNumeros = f.cpf.replace(/\D/g, "");
      if (cpfNumeros.length !== 11) {
        e.cpf = "O CPF deve possuir 11 dígitos.";
      }
    }

    if (!f.superintendencia.trim()) {
      e.superintendencia = "Superintendência obrigatória.";
    } else if (!/^\d+$/.test(f.superintendencia.trim())) {
      e.superintendencia = "Deve ser um número inteiro válido.";
    }

    if (!f.senha) e.senha = "Senha obrigatória.";
    else if (f.senha.length < 6) e.senha = "Mínimo 6 caracteres.";

    if (!f.confirmarSenha) e.confirmarSenha = "Confirme a senha.";
    else if (f.confirmarSenha !== f.senha)
      e.confirmarSenha = "As senhas não coincidem.";

    return e;
  }

  function handleChange(field: keyof FormState, value: string) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) setErrors(validate(updated));
  }

  function handleBlur(field: keyof FormState) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(form));
  }

  async function handleSubmit() {
    setTouched({
      nome: true,
      cpf: true,
      superintendencia: true,
      senha: true,
      confirmarSenha: true,
    });
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await criarVigilanteRegional({
        nome: form.nome.trim(),
        cpf: form.cpf.replace(/\D/g, ""),
        superintendencia: Number(form.superintendencia.trim()),
        senha: form.senha,
      });
      setSuccess(true);
    } catch (err) {
      Alert.alert(
        "Erro ao criar conta da Vigilância Regional",
        err instanceof Error ? err.message : "Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setTouched(NOT_TOUCHED);
    setErrors({});
    setSuccess(false);
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.teal600} />

      {/* Topbar */}
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
        >
          <View style={styles.backArrow} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topbarSub}>Vigilância Estadual</Text>
          <Text style={styles.topbarTitle}>Nova Conta Vigilância Regional</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Info card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>🗺️</Text>
            <Text style={styles.infoText}>
              Cadastre um novo Vigilante Regional. Ele poderá acessar o painel
              regional com as credenciais informadas.
            </Text>
          </View>

          {/* Dados do Vigilante */}
          <Text style={styles.sectionLabel}>Informações do Vigilante</Text>

          <AnimatedField
            label="Nome do Vigilante Regional"
            value={form.nome}
            placeholder=""
            onChangeText={(v) => handleChange("nome", v)}
            onBlur={() => handleBlur("nome")}
            error={touched.nome ? errors.nome : undefined}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => cpfRef.current?.focus()}
          />

          <AnimatedField
            label="CPF do Vigilante"
            value={form.cpf}
            placeholder=""
            onChangeText={(v) => handleChange("cpf", v)}
            onBlur={() => handleBlur("cpf")}
            error={touched.cpf ? errors.cpf : undefined}
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => superRef.current?.focus()}
            inputRef={cpfRef}
          />

          <AnimatedField
            label="Superintendência (Número)"
            value={form.superintendencia}
            placeholder=""
            onChangeText={(v) => handleChange("superintendencia", v)}
            onBlur={() => handleBlur("superintendencia")}
            error={touched.superintendencia ? errors.superintendencia : undefined}
            keyboardType="numeric"
            returnKeyType="next"
            onSubmitEditing={() => senhaRef.current?.focus()}
            inputRef={superRef}
          />

          {/* Senha */}
          <Text style={styles.sectionLabel}>Acesso</Text>

          <AnimatedField
            label="Senha temporária"
            value={form.senha}
            placeholder=""
            onChangeText={(v) => handleChange("senha", v)}
            onBlur={() => handleBlur("senha")}
            error={touched.senha ? errors.senha : undefined}
            secureTextEntry
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            inputRef={senhaRef}
          />

          <AnimatedField
            label="Confirmar senha"
            value={form.confirmarSenha}
            placeholder=""
            onChangeText={(v) => handleChange("confirmarSenha", v)}
            onBlur={() => handleBlur("confirmarSenha")}
            error={touched.confirmarSenha ? errors.confirmarSenha : undefined}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            inputRef={confirmRef}
          />

          {/* Resumo do cadastro */}
          {(form.nome || form.superintendencia) && (
            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Resumo do Vigilante</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewKey}>Nome</Text>
                <Text style={styles.previewVal}>{form.nome || "—"}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewKey}>Superintendência</Text>
                <Text style={styles.previewVal}>
                  {form.superintendencia || "—"}
                </Text>
              </View>
            </View>
          )}

          {/* Botão */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                Criar conta da Vigilância Regional
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl * 2 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success overlay */}
      {success && (
        <SuccessOverlay
          nome={form.nome}
          onDone={() => {
            resetForm();
            router.back();
          }}
          onAnother={resetForm}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  topbar: {
    backgroundColor: Colors.teal600,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  backArrow: {
    width: 9,
    height: 9,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.white,
    transform: [{ rotate: "45deg" }, { translateX: 2 }],
  },
  topbarSub: {
    fontSize: FontSize.xs,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  topbarTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },

  scroll: { flex: 1 },
  content: { padding: Spacing.lg },

  infoCard: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
    backgroundColor: Colors.teal50,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.teal400,
  },
  infoEmoji: { fontSize: 16, flexShrink: 0 },
  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.teal800,
    lineHeight: 20,
  },

  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },

  fieldWrap: { marginBottom: Spacing.lg },
  fieldBox: {
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    position: "relative",
  },
  floatingLabel: {
    position: "absolute",
    left: Spacing.md,
    zIndex: 10,
    fontWeight: "500",
  },
  fieldInput: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: FontSize.base,
    color: Colors.gray900,
  },
  fieldError: {
    fontSize: FontSize.xs,
    color: Colors.red400,
    marginTop: 4,
    marginLeft: 2,
  },
  eyeBtn: { padding: Spacing.sm },
  eyeIcon: { fontSize: 16 },

  previewCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(15,110,86,0.1)",
    gap: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  previewLabel: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.gray400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewKey: { fontSize: FontSize.sm, color: Colors.gray400 },
  previewVal: {
    fontSize: FontSize.sm,
    fontWeight: "500",
    color: Colors.gray900,
    flex: 1,
    textAlign: "right",
  },

  submitBtn: {
    backgroundColor: Colors.teal600,
    borderRadius: Radius.sm,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    shadowColor: Colors.teal800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.2,
  },

  successOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(4,52,44,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  successBox: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  successEmoji: {
    fontSize: 40,
    width: 80,
    height: 80,
    textAlign: "center",
    lineHeight: 80,
    backgroundColor: Colors.teal50,
    borderRadius: 40,
    color: Colors.teal600,
    fontWeight: "700",
    overflow: "hidden",
  },
  successTitle: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.gray900,
  },
  successSub: {
    fontSize: FontSize.sm,
    color: Colors.gray400,
    textAlign: "center",
    lineHeight: 22,
  },
  successBtn: {
    width: "100%",
    backgroundColor: Colors.teal600,
    borderRadius: Radius.sm,
    paddingVertical: 14,
    alignItems: "center",
  },
  successBtnText: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.white,
  },
  successBtnOutline: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: Colors.teal600,
    borderRadius: Radius.sm,
    paddingVertical: 13,
    alignItems: "center",
  },
  successBtnOutlineText: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.teal600,
  },
});