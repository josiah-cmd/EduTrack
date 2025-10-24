import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from "react-native";
import api from "../../lib/axios";

export default function GradeList({ isDarkMode }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState("1st Quarter");

  const theme = isDarkMode ? styles.dark : styles.light;

  const quarterMap = {
    "1st Quarter": "1",
    "2nd Quarter": "2",
    "3rd Quarter": "3",
    "4th Quarter": "4",
  };

  const fetchGrades = async (quarter = "1") => {
    setLoading(true);
    try {
      const response = await api.get(`/student/grades?quarter=${quarter}`);
      setGrades(response.data.grades || []);
    } catch (error) {
      console.error("❌ Error fetching student grades:", error.message);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades("1");
  }, []);

  const handleQuarterChange = (quarterName) => {
    setSelectedQuarter(quarterName);
    fetchGrades(quarterMap[quarterName]);
  };

  return (
    <View style={[styles.container, theme]}>
      <Text
        style={[
          styles.header,
          { color: isDarkMode ? "#fff" : "#000", fontWeight: "bold" },
        ]}
      >
        My Grades
      </Text>

      {/* Quarter Buttons */}
      <View style={styles.quarterContainer}>
        {Object.keys(quarterMap).map((quarterName) => (
          <TouchableOpacity
            key={quarterName}
            onPress={() => handleQuarterChange(quarterName)}
            style={[
              styles.quarterButton,
              selectedQuarter === quarterName && styles.activeQuarterButton,
            ]}
          >
            <Text
              style={[
                styles.quarterButtonText,
                {
                  color:
                    selectedQuarter === quarterName
                      ? "#fff"
                      : isDarkMode
                      ? "#cbd5e1"
                      : "#1e293b",
                },
              ]}
            >
              {quarterName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2563eb"
          style={{ marginTop: 20 }}
        />
      ) : grades.length === 0 ? (
        <Text
          style={{
            textAlign: "center",
            color: isDarkMode ? "#fff" : "#000",
            marginTop: 20,
          }}
        >
          No grades available.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View
              style={[
                styles.tableHeaderRow,
                { backgroundColor: isDarkMode ? "#1d4ed8" : "#2563eb" },
              ]}
            >
              <Text style={[styles.tableHeader, { width: 180 }]}>Subject</Text>
              <Text style={[styles.tableHeader, { width: 120 }]}>Initial</Text>
              <Text style={[styles.tableHeader, { width: 120 }]}>Final</Text>
              <Text style={[styles.tableHeader, { width: 120 }]}>Remarks</Text>
            </View>

            {/* Table Rows */}
            {grades.map((grade, index) => (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  {
                    backgroundColor:
                      index % 2 === 0
                        ? isDarkMode
                          ? "#1e293b"
                          : "#f8fafc"
                        : isDarkMode
                        ? "#273449"
                        : "#f1f5f9",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tableCell,
                    {
                      width: 180,
                      textAlign: "left",
                      color: isDarkMode ? "#f3f4f6" : "#111827",
                    },
                  ]}
                >
                  {grade.subject?.name || "N/A"}
                </Text>

                <Text
                  style={[
                    styles.tableCell,
                    {
                      width: 120,
                      textAlign: "center",
                      color: isDarkMode ? "#fff" : "#000",
                    },
                  ]}
                >
                  {grade.initial_grade ?? "-"}
                </Text>

                <Text
                  style={[
                    styles.tableCell,
                    {
                      width: 120,
                      textAlign: "center",
                      fontWeight: "600",
                      color: isDarkMode ? "#fff" : "#000",
                    },
                  ]}
                >
                  {grade.final_grade ?? "-"}
                </Text>

                <Text
                  style={[
                    styles.tableCell,
                    {
                      width: 120,
                      textAlign: "center",
                      fontWeight: "600",
                      color:
                        grade.remarks === "Passed"
                          ? "#16a34a"
                          : grade.remarks === "Failed"
                          ? "#dc2626"
                          : isDarkMode
                          ? "#9ca3af"
                          : "#6b7280",
                    },
                  ]}
                >
                  {grade.remarks ?? "-"}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  light: {
    backgroundColor: "#ffffff",
  },
  dark: {
    backgroundColor: "#0f172a",
  },

  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },

  // Quarter buttons
  quarterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  quarterButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
  },
  activeQuarterButton: {
    backgroundColor: "#2563eb",
  },
  quarterButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },

  // Table styling
  tableContainer: {
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  tableHeader: {
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    fontSize: 14,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#334155",
    paddingVertical: 10,
  },
  tableCell: {
    fontSize: 14,
    paddingHorizontal: 8,
  },
});
