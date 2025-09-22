  import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View, } from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";

  const screenWidth = Dimensions.get("window").width;

  export default function Reports({ isDarkMode }) {
    const [stats, setStats] = useState({
      totalUsers: 0,
      totalTeachers: 0,
      totalStudents: 0,
    });

    // Dynamic colors based on prop
    const textColor = isDarkMode ? "#ffffff" : "#000000";
    const subTextColor = isDarkMode ? "#cccccc" : "#555555";
    const cardBg = isDarkMode ? "#1e1e1e" : "#f2f2f2";
    const numberColor = isDarkMode ? "#4CAF50" : "#2e7d32";

    useEffect(() => {
      const fetchStats = async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          const res = await axios.get("http://localhost:8000/api/stats", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setStats(res.data);
        } catch (err) {
          console.error("Error fetching stats:", err.response?.data || err.message);
        }
      };

      fetchStats();
    }, []);

    const roleData = [
      {
        name: "Teachers",
        population: stats.totalTeachers,
        color: "#36A2EB",
        legendFontColor: textColor,
        legendFontSize: 14,
      },
      {
        name: "Students",
        population: stats.totalStudents,
        color: "#FF6384",
        legendFontColor: textColor,
        legendFontSize: 14,
      },
    ];

    const barData = {
      labels: ["Teachers", "Students"],
      datasets: [
        {
          data: [stats.totalTeachers, stats.totalStudents],
        },
      ],
    };

    const lineData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          data: [
            Math.max(1, stats.totalUsers - 30),
            Math.max(1, stats.totalUsers - 20),
            Math.max(1, stats.totalUsers - 10),
            Math.max(1, stats.totalUsers - 5),
            stats.totalUsers - 2,
            stats.totalUsers,
          ],
          color: (opacity = 1) =>
            isDarkMode
              ? `rgba(54, 162, 235, ${opacity})`
              : `rgba(25, 118, 210, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: ["User Growth"],
    };

    return (
      <ScrollView>
        <Text style={[styles.title, { color: textColor }]}>Reports</Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          System summary reports
        </Text>

        {/* Cards */}
        <View style={styles.cardRow}>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardNumber, { color: numberColor }]}>
              {stats.totalUsers}
            </Text>
            <Text style={[styles.cardLabel, { color: textColor }]}>Users</Text>
          </View>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardNumber, { color: numberColor }]}>
              {stats.totalTeachers}
            </Text>
            <Text style={[styles.cardLabel, { color: textColor }]}>Teachers</Text>
          </View>
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardNumber, { color: numberColor }]}>
              {stats.totalStudents}
            </Text>
            <Text style={[styles.cardLabel, { color: textColor }]}>Students</Text>
          </View>
        </View>

        {/* Pie Chart */}
        <Text style={[styles.chartTitle, { color: textColor }]}>
          Role Distribution
        </Text>
        <View style={[styles.chartCard, { backgroundColor: cardBg }]}>
          <PieChart
            data={roleData}
            width={screenWidth - 30}
            height={220}
            chartConfig={chartConfig(isDarkMode, textColor)}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        </View>

        {/* Bar Chart */}
        <Text style={[styles.chartTitle, { color: textColor }]}>
          Users Breakdown
        </Text>
        <View style={[styles.chartCard, { backgroundColor: cardBg }]}>
          <BarChart
            style={styles.chart}
            data={barData}
            width={screenWidth - 30}
            height={220}
            chartConfig={chartConfig(isDarkMode, textColor)}
            verticalLabelRotation={30}
          />
        </View>

        {/* Line Chart */}
        <Text style={[styles.chartTitle, { color: textColor }]}>
          User Growth (6 months)
        </Text>
        <View style={[styles.chartCard, { backgroundColor: cardBg }]}>
          <LineChart
            data={lineData}
            width={screenWidth - 30}
            height={220}
            chartConfig={chartConfig(isDarkMode, textColor)}
            bezier
            style={styles.chart}
          />
        </View>
      </ScrollView>
    );
  }

  const chartConfig = (isDark, textColor) => ({
    backgroundGradientFrom: "transparent",
    backgroundGradientTo: "transparent",
    decimalPlaces: 0,
    color: (opacity = 1) =>
      isDark
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(0, 0, 0, ${opacity})`,
    labelColor: () => textColor,
    propsForLabels: {
      fill: textColor,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#36A2EB",
    },
  });

  const styles = StyleSheet.create({
    title: {
      fontSize: 22,
      fontWeight: "bold",
      marginLeft: 15,
      marginTop: 10,
    },
    subtitle: {
      fontSize: 14,
      marginBottom: 20,
      marginLeft: 15,
    },
    cardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      paddingHorizontal: 10,
    },
    card: {
      flex: 1,
      marginHorizontal: 5,
      borderRadius: 12,
      padding: 20,
      alignItems: "center",
    },
    cardNumber: {
      fontSize: 28,
      fontWeight: "bold",
    },
    cardLabel: {
      fontSize: 14,
      marginTop: 5,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: "bold",
      marginTop: 20,
      marginBottom: 10,
      marginLeft: 15,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 12,
    },
    chartCard: {
      borderRadius: 12,
      padding: 10,
      marginBottom: 15,
      marginHorizontal: 10,
    },
  });