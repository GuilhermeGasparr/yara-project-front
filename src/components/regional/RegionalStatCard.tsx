import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Feather from "@expo/vector-icons/Feather";

interface RegionalStatCardProps {
  title: string;
  value: number;
  icon: keyof typeof Feather.glyphMap;
}

export default function RegionalStatCard({
  title,
  value,
  icon,
}: RegionalStatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Feather
          name={icon}
          size={20}
          color="#087F5B"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>

        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 110,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    margin: 5,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,

    elevation: 2,
  },

  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E6F4F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  content: {
    flex: 1,
    justifyContent: "flex-end",
  },

  value: {
    fontSize: 24,
    fontWeight: "700",
    color: "#12372A",
  },

  title: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
});