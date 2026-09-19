import React from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Colors,
  FontSize,
  Radius,
  Spacing,
} from "@/constants/theme";

interface EstadualStatCardProps {
  value: number;
  label: string;
}

export default function EstadualStatCard({
  value,
  label,
}: EstadualStatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>
        {value}
      </Text>

      <Text
        style={styles.label}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "31.5%",
    minHeight: 82,

    backgroundColor: Colors.white,

    borderRadius: Radius.md,

    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor:
      "rgba(15,110,86,0.1)",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,

    elevation: 1,
  },

  value: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.teal600,
    letterSpacing: -0.5,
  },

  label: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.gray400,
    textAlign: "center",
  },
});