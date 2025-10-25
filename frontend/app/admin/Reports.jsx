import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import api from "../lib/axios"; // ✅ use centralized axios with token

export default function Reports({ isDarkMode }) {
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("All"); // ✅ added filter

  // ✅ NEW STATES
  const [completionRates, setCompletionRates] = useState([]); // for subject completion data
  const [verifications, setVerifications] = useState({}); // for verified/unverified grades

  const textColor = isDarkMode ? "#ffffff" : "#000000";
  const subTextColor = isDarkMode ? "#cccccc" : "#555555";
  const cardBg = isDarkMode ? "#1e1e1e" : "#f2f2f2";
  const borderColor = isDarkMode ? "#333333" : "#dddddd";

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        // ✅ UPDATED: Added call to completion rates endpoint
        const [perfRes, attendRes, completionRes] = await Promise.all([
          api.get("/reports/performance"),
          api.get("/reports/attendance"),
          api.get("/reports/completion-rates"), // ✅ new API call
        ]);

        setPerformance(perfRes.data?.data || []);
        setAttendance(attendRes.data?.data?.records || []);
        setCompletionRates(completionRes.data?.data || []); // ✅ store completion rates

        // ✅ Extract verification info if available from backend (assuming added to /reports/performance)
        const verifData = {};
        (perfRes.data?.data || []).forEach((item) => {
          verifData[item.id] = item.is_verified;
        });
        setVerifications(verifData);
      } catch (err) {
        console.error("Error fetching reports:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: isDarkMode ? "#121212" : "#fff" }]}>
        <ActivityIndicator size="large" color={isDarkMode ? "#4CAF50" : "#2e7d32"} />
        <Text style={{ color: textColor, marginTop: 10 }}>Loading reports...</Text>
      </View>
    );
  }

  // ✅ Compute summary stats
  const totalStudents = [...new Set(performance.map((p) => p.student_name))].length;
  const avgGrade =
    performance.length > 0
      ? (performance.reduce((sum, p) => sum + parseFloat(p.grade || 0), 0) / performance.length).toFixed(2)
      : 0;
  const avgAttendance =
    attendance.length > 0
      ? (
          (attendance.reduce((sum, a) => sum + parseFloat(a.present_days || 0), 0) /
            attendance.length) *
          100
        ).toFixed(1)
      : 0;

  // ✅ Filtered data
  const filteredPerformance =
    subjectFilter === "All"
      ? performance
      : performance.filter((item) => item.subject_name === subjectFilter);

  // ✅ For chart visualization
  const subjects = [...new Set(performance.map((p) => p.subject_name))];
  const avgPerSubject = subjects.map((sub) => {
    const subData = performance.filter((p) => p.subject_name === sub);
    return (
      subData.reduce((sum, p) => sum + parseFloat(p.grade || 0), 0) / subData.length
    ).toFixed(2);
  });

  return (
    <ScrollView>
      <Text style={[styles.title, { color: textColor }]}>Reports</Text>
      <Text style={[styles.subtitle, { color: subTextColor }]}>
        Academic and performance overview
      </Text>

      {/* ✅ Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>Total Students</Text>
          <Text style={[styles.summaryValue, { color: textColor }]}>{totalStudents}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>Avg Grade</Text>
          <Text style={[styles.summaryValue, { color: textColor }]}>{avgGrade}%</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.summaryLabel, { color: subTextColor }]}>Avg Attendance</Text>
          <Text style={[styles.summaryValue, { color: textColor }]}>{avgAttendance}%</Text>
        </View>
      </View>

      {/* ✅ Subject Filter */}
      <View style={{ marginHorizontal: 15, marginBottom: 15 }}>
        <Text style={{ color: textColor, marginBottom: 5 }}>Filter by Subject:</Text>
        <View
          style={{
            borderWidth: 1,
            borderColor,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <Picker
            selectedValue={subjectFilter}
            onValueChange={(itemValue) => setSubjectFilter(itemValue)}
            style={{ color: textColor, backgroundColor: cardBg }}
          >
            <Picker.Item label="All" value="All" />
            {subjects.map((sub, i) => (
              <Picker.Item key={i} label={sub} value={sub} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Student Performance Report */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Student Performance Report
        </Text>
        <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Student</Text>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Subject</Text>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Average</Text>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Grade</Text>
          {/* ✅ NEW HEADER */}
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Verified</Text>
        </View>
        {filteredPerformance.length === 0 ? (
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            No performance data available.
          </Text>
        ) : (
          filteredPerformance.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                { borderBottomColor: borderColor },
              ]}
            >
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.student_name}
              </Text>
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.subject_name}
              </Text>
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.average_score}%
              </Text>
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.grade}
              </Text>
              {/* ✅ NEW COLUMN */}
              <Text
                style={[
                  styles.td,
                  {
                    color: verifications[item.id]
                      ? "#4CAF50"
                      : "#F44336",
                    flex: 1,
                  },
                ]}
              >
                {verifications[item.id] ? "Verified" : "Unverified"}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Attendance Records */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Attendance Records
        </Text>
        <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Student</Text>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Subject</Text>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Present</Text>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Absent</Text>
        </View>
        {attendance.length === 0 ? (
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            No attendance data available.
          </Text>
        ) : (
          attendance.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                { borderBottomColor: borderColor },
              ]}
            >
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.student_name}
              </Text>
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.subject_name}
              </Text>
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.present_days}
              </Text>
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.absent_days}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* ✅ Grade Distribution Chart */}
      {subjects.length > 0 && (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Grade Distribution</Text>
          <BarChart
            data={{
              labels: subjects,
              datasets: [{ data: avgPerSubject.map((n) => parseFloat(n)) }],
            }}
            width={Dimensions.get("window").width - 30}
            height={220}
            yAxisSuffix="%"
            chartConfig={{
              backgroundColor: cardBg,
              backgroundGradientFrom: cardBg,
              backgroundGradientTo: cardBg,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
              labelColor: () => textColor,
            }}
            style={{ borderRadius: 16 }}
          />
        </View>
      )}

      {/* ✅ NEW SECTION: Subject Completion Rates */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Subject Completion Rates</Text>
        <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Subject</Text>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Total Students</Text>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Completed</Text>
          <Text style={[styles.th, { color: textColor, flex: 1 }]}>Completion %</Text>
        </View>
        {completionRates.length === 0 ? (
          <Text style={[styles.emptyText, { color: subTextColor }]}>
            No completion data available.
          </Text>
        ) : (
          completionRates.map((item, index) => (
            <View
              key={index}
              style={[styles.tableRow, { borderBottomColor: borderColor }]}
            >
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.subject_name}
              </Text>
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.total_students}
              </Text>
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.completed_students}
              </Text>
              <Text style={[styles.td, { color: textColor, flex: 1 }]}>
                {item.completion_rate}%
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

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
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 10,
    marginBottom: 20,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    paddingVertical: 6,
  },
  th: {
    fontWeight: "bold",
    fontSize: 14,
  },
  td: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 10,
    width: "30%",
    alignItems: "center",
    paddingVertical: 10,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
}); 