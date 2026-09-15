import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Feather from "@expo/vector-icons/Feather";

interface DatePickerFieldProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

export default function DatePickerField({
  value,
  onChange,
  placeholder = "Selecione uma data",
}: DatePickerFieldProps) {
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
  };

  // WEB
  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <View style={styles.dateInput}>
          <input
            type="date"
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              fontSize: 15,
              color: value ? "#17211E" : "#9CA3AF",
              fontFamily: "inherit",
            }}
          />
        </View>
      </View>
    );
  }

  // ANDROID / IOS
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dateText,
            !value && styles.placeholder,
          ]}
        >
          {value ? formatDate(value) : placeholder}
        </Text>

        <Feather
          name="calendar"
          size={20}
          color="#087F5B"
        />
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={
            value
              ? (() => {
                  const [year, month, day] = value
                    .split("-")
                    .map(Number);

                  return new Date(year, month - 1, day);
                })()
              : new Date()
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, date) => {
            if (Platform.OS === "android") {
              setShowPicker(false);
            }

            if (date) {
              const year = date.getFullYear();
              const month = String(
                date.getMonth() + 1
              ).padStart(2, "0");
              const day = String(
                date.getDate()
              ).padStart(2, "0");

              onChange(`${year}-${month}-${day}`);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  dateInput: {
    height: 52,
    borderWidth: 1,
    borderColor: "#D9E7E3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dateText: {
    fontSize: 15,
    color: "#17211E",
  },

  placeholder: {
    color: "#9CA3AF",
  },
});