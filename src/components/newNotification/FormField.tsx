import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, FontSize, Radius, Spacing } from "@/constants/theme";

// ─── Campo de texto / número ──────────────────────────────────────────────────

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          style,
        ]}
        placeholderTextColor={Colors.gray200}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

// ─── Picker / select simulado com botões ─────────────────────────────────────

interface PickerFieldProps {
  label: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  error?: string;
  placeholder?: string;
}

export function PickerField({
  label,
  options,
  value,
  onSelect,
  error,
  placeholder = "Selecione...",
}: PickerFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[styles.input, styles.pickerTrigger, !!error && styles.inputError]}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={[styles.pickerText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <View style={[styles.chevron, open && styles.chevronUp]} />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.dropdownItem, opt === value && styles.dropdownItemActive]}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownText,
                  opt === value && styles.dropdownTextActive,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

// ─── Botões de escolha inline (Sim / Não / Não sei) ───────────────────────────

interface SegmentedPickerProps {
  label: string;
  options: string[];
  value: string;
  onSelect: (v: string) => void;
}

export function SegmentedPicker({ label, options, value, onSelect }: SegmentedPickerProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmentRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.segment, opt === value && styles.segmentActive]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, opt === value && styles.segmentTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fieldWrap: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.gray600,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.gray100,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    fontSize: FontSize.base,
    color: Colors.gray900,
    backgroundColor: Colors.white,
  },
  inputFocused: {
    borderColor: Colors.teal600,
  },
  inputError: {
    borderColor: Colors.red400,
  },
  error: {
    fontSize: FontSize.xs,
    color: Colors.red400,
    marginTop: 4,
  },

  // Picker
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: {
    fontSize: FontSize.base,
    color: Colors.gray900,
    flex: 1,
  },
  placeholder: {
    color: Colors.gray200,
  },
  chevron: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: Colors.gray400,
    transform: [{ rotate: "45deg" }],
    marginBottom: 4,
  },
  chevronUp: {
    transform: [{ rotate: "-135deg" }],
    marginBottom: -4,
    marginTop: 4,
  },
  dropdown: {
    borderWidth: 1.5,
    borderColor: Colors.teal100,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    marginTop: 4,
    maxHeight: 240,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },
  dropdownItemActive: {
    backgroundColor: Colors.teal50,
  },
  dropdownText: {
    fontSize: FontSize.base,
    color: Colors.gray800,
  },
  dropdownTextActive: {
    color: Colors.teal600,
    fontWeight: "600",
  },

  // Segmented
  segmentRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.gray100,
    alignItems: "center",
    backgroundColor: Colors.white,
  },
  segmentActive: {
    borderColor: Colors.teal600,
    backgroundColor: Colors.teal50,
  },
  segmentText: {
    fontSize: FontSize.sm,
    color: Colors.gray600,
    fontWeight: "500",
  },
  segmentTextActive: {
    color: Colors.teal600,
    fontWeight: "700",
  },
});