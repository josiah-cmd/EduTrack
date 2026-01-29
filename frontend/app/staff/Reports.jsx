import { Picker } from "@react-native-picker/picker";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { BarChart } from "react-native-chart-kit";
import api from "../lib/axios";

export default function Reports({ isDarkMode }) {
  // Loading & data
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [completionRates, setCompletionRates] = useState([]);

  // Filters & options
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [teacherFilter, setTeacherFilter] = useState("All");
  const [quarterFilter, setQuarterFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [subjectsOptions, setSubjectsOptions] = useState([]);
  const [sectionsOptions, setSectionsOptions] = useState([]);
  const [teachersOptions, setTeachersOptions] = useState([]);

  // UI controls
  const [filterOpen, setFilterOpen] = useState(true);
  const [perfColumns, setPerfColumns] = useState({
    student: true,
    subject: true,
    average: true,
    grade: true,
    verified: true,
  });
  const [attColumns, setAttColumns] = useState({
    student: true,
    subject: true,
    present: true,
    absent: true,
  });
  const [compColumns, setCompColumns] = useState({
    subject: true,
    total_students: true,
    completed_students: true,
    completion_rate: true,
  });

  // verification mapping
  const [verifications, setVerifications] = useState({});

  // anchors / scroll
  const scrollRef = useRef(null);
  const perfY = useRef(0);
  const attendY = useRef(0);
  const completionY = useRef(0);
  const gradeAnalyticsY = useRef(0);

  // color palette following RoomForm pattern
  const textColor = isDarkMode ? "#ffffff" : "#000000";
  const subTextColor = isDarkMode ? "#F7F7F7" : "#000000";
  const cardBg = isDarkMode ? "#808080" : "#f2f2f2";
  const borderColor = isDarkMode ? "#F7F7F7" : "#000000";
  const pickerBg = isDarkMode ? "#0E5149" : "#000000";
  const inputBg = isDarkMode ? "#0E5149" : "#ffffff";
  const primaryBtnBg = "#10b981";
  const verifiedColor = "#4CAF50";
  const unverifiedColor = "#F44336";

  useEffect(() => {
    const fetchReports = async (params = {}) => {
      try {
        setLoading(true);
        const [perfRes, attendRes, compRes] = await Promise.all([
          api.get("/reports/performance", { params }),
          api.get("/reports/attendance", { params }),
          api.get("/reports/completion-rates", { params }),
        ]);

        setPerformance(perfRes.data?.data || []);
        setAttendance(attendRes.data?.data?.records || []);
        setCompletionRates(compRes.data?.data || []);

        // build verifications map if backend provides is_verified per item
        const verifData = {};
        (perfRes.data?.data || []).forEach((item) => {
          verifData[item.id] = !!item.is_verified;
        });
        setVerifications(verifData);
      } catch (err) {
        console.error("Error fetching reports:", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchFilterOptions = async () => {
      try {
        const [sRes, secRes, tRes] = await Promise.all([
          api.get("/subjects"),
          api.get("/sections"),
          api.get("/teachers"),
        ]);
        setSubjectsOptions(sRes.data?.data || sRes.data || []);
        setSectionsOptions(secRes.data?.data || secRes.data || []);
        setTeachersOptions(tRes.data?.data || tRes.data || []);
      } catch (e) {
        console.warn("Could not load filter options:", e.message || e);
      }
    };

    fetchReports();
    fetchFilterOptions();
  }, []);

  const applyFilters = async () => {
    const params = {};
    if (subjectFilter && subjectFilter !== "All") params.subject = subjectFilter;
    if (sectionFilter && sectionFilter !== "All") params.section = sectionFilter;
    if (teacherFilter && teacherFilter !== "All") params.teacher = teacherFilter;
    if (quarterFilter && quarterFilter !== "All") params.quarter = quarterFilter;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (searchTerm) params.search = searchTerm;

    try {
      setLoading(true);
      const [perfRes, attendRes, compRes] = await Promise.all([
        api.get("/reports/performance", { params }),
        api.get("/reports/attendance", { params }),
        api.get("/reports/completion-rates", { params }),
      ]);

      setPerformance(perfRes.data?.data || []);
      setAttendance(attendRes.data?.data?.records || []);
      setCompletionRates(compRes.data?.data || []);

      const verifData = {};
      (perfRes.data?.data || []).forEach((item) => {
        verifData[item.id] = !!item.is_verified;
      });
      setVerifications(verifData);
    } catch (err) {
      console.error("Error applying filters:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = async () => {
    setSubjectFilter("All");
    setSectionFilter("All");
    setTeacherFilter("All");
    setQuarterFilter("All");
    setDateFrom("");
    setDateTo("");
    setSearchTerm("");

    try {
      setLoading(true);
      const [perfRes, attendRes, compRes] = await Promise.all([
        api.get("/reports/performance"),
        api.get("/reports/attendance"),
        api.get("/reports/completion-rates"),
      ]);

      setPerformance(perfRes.data?.data || []);
      setAttendance(attendRes.data?.data?.records || []);
      setCompletionRates(compRes.data?.data || []);

      const verifData = {};
      (perfRes.data?.data || []).forEach((item) => {
        verifData[item.id] = !!item.is_verified;
      });
      setVerifications(verifData);
    } catch (err) {
      console.error("Error resetting filters:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: isDarkMode ? "#121212" : "#ffffff" }]}>
        <ActivityIndicator size="large" color={primaryBtnBg} />
        <Text style={{ color: textColor, marginTop: 10 }}>Loading reports...</Text>
      </View>
    );
  }

  // Summary stats
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

  // Filtered lists
  const filteredPerformance = performance
    .filter((item) => (subjectFilter === "All" ? true : item.subject_name === subjectFilter))
    .filter((item) => {
      if (!searchTerm) return true;
      const q = searchTerm.trim().toLowerCase();
      const name = (item.student_name || "").toLowerCase();
      const lrn = (item.lrn || "").toLowerCase();
      return name.includes(q) || lrn.includes(q);
    })
    .filter((item) => (sectionFilter === "All" ? true : (item.section_name || "") === sectionFilter))
    .filter((item) => (teacherFilter === "All" ? true : (item.teacher_name || "") === teacherFilter));

  const filteredAttendance = attendance
    .filter((item) => (subjectFilter === "All" ? true : item.subject_name === subjectFilter))
    .filter((item) => {
      if (!searchTerm) return true;
      const q = searchTerm.trim().toLowerCase();
      const name = (item.student_name || "").toLowerCase();
      const lrn = (item.lrn || "").toLowerCase();
      return name.includes(q) || lrn.includes(q);
    })
    .filter((item) => (sectionFilter === "All" ? true : (item.section_name || "") === sectionFilter))
    .filter((item) => (teacherFilter === "All" ? true : (item.teacher_name || "") === teacherFilter));

  // Chart data (avg per subject)
  const subjects = [...new Set(performance.map((p) => p.subject_name || "Unknown"))];
  const avgPerSubject = subjects.map((sub) => {
    const subData = performance.filter((p) => p.subject_name === sub);
    const avg = subData.length
      ? subData.reduce((sum, p) => sum + parseFloat(p.grade || 0), 0) / subData.length
      : 0;
    return parseFloat(avg.toFixed(2));
  });

  const scrollTo = (y) => {
    if (!scrollRef.current) return;
    try {
      scrollRef.current.scrollTo({ y, animated: true });
    } catch (e) {
      // fallback
      scrollRef.current.scrollTo({ x: 0, y });
    }
  };

  return (
    <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>
      <View style={{ padding: 15 }}>
        <Text style={[styles.title, { color: isDarkMode ? "#F7F7F7" : "#000000", fontWeight: "500" }]}>Reports</Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? "#fff" : "#000000", fontWeight: "500" }]}>Academic and performance overview</Text>

        {/* Tabs */}
        <View style={[styles.tabsContainer]}>
          <TouchableOpacity style={[styles.tabBtn]} onPress={() => scrollTo(perfY.current)}>
            <Text style={styles.tabText}>Performance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn]} onPress={() => scrollTo(attendY.current)}>
            <Text style={styles.tabText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn]} onPress={() => scrollTo(completionY.current)}>
            <Text style={styles.tabText}>Completion Rates</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn]} onPress={() => scrollTo(gradeAnalyticsY.current)}>
            <Text style={styles.tabText}>Grade Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={[styles.filterCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
          <TouchableOpacity onPress={() => setFilterOpen((s) => !s)} style={styles.filterHeader}>
            <Text style={[{ fontWeight: "700", fontSize: 16 }, { color: isDarkMode ? "#F7F7F7" : "#000000" }]}>
              Filters {filterOpen ? "▾" : "▸"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={resetFilters} style={styles.resetBtn}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyFilters} style={styles.applyBtn}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {filterOpen && (
            <View style={{ paddingTop: 12 }}>
              <View style={styles.filterRow}>
                <View style={styles.filterCol}>
                  <Text style={[styles.filterLabel, { color: isDarkMode ? "#fff" : "#000000" }]}>Subject</Text>
                  <View style={[styles.pickerWrap, { backgroundColor: pickerBg, borderColor }]}>
                    <Picker
                      selectedValue={subjectFilter}
                      onValueChange={(v) => setSubjectFilter(v)}
                      style={styles.picker(isDarkMode)}
                      dropdownIconColor={isDarkMode ? "#ffd700" : "#000000"}
                    >
                      <Picker.Item label="All" value="All" color={isDarkMode ? "#ffd700" : "#000000"} />
                      {subjectsOptions.map((s) => (
                        <Picker.Item key={s.id || s.name} label={s.name || s.title || s.subject_name} value={s.name || s.title || s.subject_name} color={isDarkMode ? "#fff" : "#000000"} />
                      ))}
                      {subjects.map((sub, i) => (
                        <Picker.Item key={`auto-${i}`} label={sub} value={sub} color={isDarkMode ? "#fff" : "#000000"} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.filterCol}>
                  <Text style={[styles.filterLabel, { color: isDarkMode ? "#fff" : "#000000" }]}>Section</Text>
                  <View style={[styles.pickerWrap, { backgroundColor: pickerBg, borderColor }]}>
                    <Picker
                      selectedValue={sectionFilter}
                      onValueChange={(v) => setSectionFilter(v)}
                      style={styles.picker(isDarkMode)}
                      dropdownIconColor={isDarkMode ? "#ffd700" : "#000000"}
                    >
                      <Picker.Item label="All" value="All" color={isDarkMode ? "#ffd700" : "#10b981"} />
                      {sectionsOptions.map((s) => (
                        <Picker.Item key={s.id || s.name} label={s.name || s.title} value={s.name || s.title} color={isDarkMode ? "#fff" : "#000000"} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.filterCol}>
                  <Text style={[styles.filterLabel, { color: isDarkMode ? "#fff" : "#000000" }]}>Teacher</Text>
                  <View style={[styles.pickerWrap, { backgroundColor: pickerBg, borderColor }]}>
                    <Picker
                      selectedValue={teacherFilter}
                      onValueChange={(v) => setTeacherFilter(v)}
                      style={styles.picker(isDarkMode)}
                      dropdownIconColor={isDarkMode ? "#ffd700" : "#000000"}
                    >
                      <Picker.Item label="All" value="All" color={isDarkMode ? "#ffd700" : "#10b981"} />
                      {teachersOptions.map((t) => (
                        <Picker.Item key={t.id} label={t.user?.name || t.name} value={t.user?.name || t.name} color={isDarkMode ? "#fff" : "#000000"} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.filterCol}>
                  <Text style={[styles.filterLabel, { color: isDarkMode ? "#fff" : "#000000" }]}>Quarter</Text>
                  <View style={[styles.pickerWrap, { backgroundColor: pickerBg, borderColor }]}>
                    <Picker
                      selectedValue={quarterFilter}
                      onValueChange={(v) => setQuarterFilter(v)}
                      style={styles.picker(isDarkMode)}
                      dropdownIconColor={isDarkMode ? "#ffd700" : "#000000"}
                    >
                      <Picker.Item label="All" value="All" color={isDarkMode ? "#ffd700" : "#10b981"} />
                      <Picker.Item label="Q1" value="Q1" color={isDarkMode ? "#fff" : "#000000"} />
                      <Picker.Item label="Q2" value="Q2" color={isDarkMode ? "#fff" : "#000000"} />
                      <Picker.Item label="Q3" value="Q3" color={isDarkMode ? "#fff" : "#000000"} />
                      <Picker.Item label="Q4" value="Q4" color={isDarkMode ? "#fff" : "#000000"} />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={[styles.filterRow, { marginTop: 12 }]}>
                <View style={[styles.filterCol, { flex: 1.5 }]}>
                  <Text style={[styles.filterLabel, { color: isDarkMode ? "#fff" : "#000000" }]}>Date From</Text>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDarkMode ? "#F7F7F7" : "#999"}
                    value={dateFrom}
                    onChangeText={setDateFrom}
                    style={[styles.inputSmall, { color: textColor, backgroundColor: inputBg, borderColor }]}
                  />
                </View>

                <View style={[styles.filterCol, { flex: 1.5 }]}>
                  <Text style={[styles.filterLabel, { color: isDarkMode ? "#fff" : "#000000" }]}>Date To</Text>
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDarkMode ? "#F7F7F7" : "#999"}
                    value={dateTo}
                    onChangeText={setDateTo}
                    style={[styles.inputSmall, { color: textColor, backgroundColor: inputBg, borderColor }]}
                  />
                </View>

                <View style={[styles.filterCol, { flex: 2 }]}>
                  <Text style={[styles.filterLabel, { color: isDarkMode ? "#fff" : "#000000" }]}>Search (Name or LRN)</Text>
                  <TextInput
                    placeholder="Search by student name or LRN..."
                    placeholderTextColor={isDarkMode ? "#F7F7F7" : "#999"}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    style={[styles.input, { color: textColor, backgroundColor: isDarkMode ? "#0E5149" : "#fff" }]}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Summary Cards */}
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

        {/* Performance Section */}
        <View onLayout={(e) => { perfY.current = e.nativeEvent.layout.y; }} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? "#F7F7F7" : "#000000" }]}>Student Performance Report</Text>

          <View style={styles.columnToggleRow}>
            <Text style={{ color: isDarkMode ? "#fff" : "#000000", marginRight: 8 }}>Columns:</Text>
            {Object.keys(perfColumns).map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => setPerfColumns((s) => ({ ...s, [k]: !s[k] }))}
                style={[
                  styles.colToggle,
                  { backgroundColor: perfColumns[k] ? primaryBtnBg : (isDarkMode ? "#2b2b2b" : "#eee") },
                ]}
              >
                <Text style={{ color: perfColumns[k] ? "#fff" : (isDarkMode ? "#ffd700" : "#000000"), fontSize: 12 }}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
            {perfColumns.student && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Student</Text>}
            {perfColumns.subject && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Subject</Text>}
            {perfColumns.average && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Average</Text>}
            {perfColumns.grade && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Grade</Text>}
            {perfColumns.verified && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Verified</Text>}
          </View>

          {filteredPerformance.length === 0 ? (
            <Text style={[styles.emptyText, { color: subTextColor }]}>No performance data available.</Text>
          ) : (
            filteredPerformance.map((item, index) => (
              <View key={index} style={[styles.tableRow, { borderBottomColor: borderColor }]}>
                {perfColumns.student && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.student_name}</Text>}
                {perfColumns.subject && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.subject_name}</Text>}
                {perfColumns.average && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.average_score}%</Text>}
                {perfColumns.grade && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.grade}</Text>}
                {perfColumns.verified && (
                  <Text style={[styles.td, { color: verifications[item.id] ? verifiedColor : unverifiedColor, flex: 1 }]}>
                    {verifications[item.id] ? "Verified" : "Unverified"}
                  </Text>
                )}
              </View>
            ))
          )}
        </View>

        {/* Attendance Section */}
        <View onLayout={(e) => { attendY.current = e.nativeEvent.layout.y; }} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? "#F7F7F7" : "#000000" }]}>Attendance Records</Text>

          <View style={styles.columnToggleRow}>
            <Text style={{ color: isDarkMode ? "#fff" : "#000000", marginRight: 8 }}>Columns:</Text>
            {Object.keys(attColumns).map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => setAttColumns((s) => ({ ...s, [k]: !s[k] }))}
                style={[
                  styles.colToggle,
                  { backgroundColor: attColumns[k] ? primaryBtnBg : (isDarkMode ? "#2b2b2b" : "#eee") },
                ]}
              >
                <Text style={{ color: attColumns[k] ? "#fff" : (isDarkMode ? "#ffd700" : "#000000"), fontSize: 12 }}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
            {attColumns.student && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Student</Text>}
            {attColumns.subject && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Subject</Text>}
            {attColumns.present && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Present</Text>}
            {attColumns.absent && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Absent</Text>}
          </View>

          {filteredAttendance.length === 0 ? (
            <Text style={[styles.emptyText, { color: subTextColor }]}>No attendance data available.</Text>
          ) : (
            filteredAttendance.map((item, index) => (
              <View key={index} style={[styles.tableRow, { borderBottomColor: borderColor }]}>
                {attColumns.student && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.student_name}</Text>}
                {attColumns.subject && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.subject_name}</Text>}
                {attColumns.present && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.present_days}</Text>}
                {attColumns.absent && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.absent_days}</Text>}
              </View>
            ))
          )}
        </View>

        {/* Grade Distribution Chart */}
        <View onLayout={(e) => { gradeAnalyticsY.current = e.nativeEvent.layout.y; }} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? "#F7F7F7" : "#000000" }]}>Grade Distribution</Text>
          {subjects.length > 0 ? (
            <BarChart
              data={{
                labels: subjects,
                datasets: [{ data: avgPerSubject }],
              }}
              width={Dimensions.get("window").width - 30}
              height={220}
              yAxisSuffix="%"
              fromZero
              chartConfig={{
                backgroundColor: cardBg,
                backgroundGradientFrom: cardBg,
                backgroundGradientTo: cardBg,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(16,185,129, ${opacity})`, // primary green, matches RoomForm btn
                labelColor: () => (isDarkMode ? "#ffd700" : "#000000"),
              }}
              style={{ borderRadius: 16 }}
            />
          ) : (
            <Text style={[styles.emptyText, { color: subTextColor }]}>No grade data available.</Text>
          )}
        </View>

        {/* Completion Rates */}
        <View onLayout={(e) => { completionY.current = e.nativeEvent.layout.y; }} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? "#F7F7F7" : "#000000" }]}>Subject Completion Rates</Text>

          <View style={styles.columnToggleRow}>
            <Text style={{ color: isDarkMode ? "#fff" : "#000000", marginRight: 8, fontWeight: "500" }}>Columns:</Text>
            {Object.keys(compColumns).map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => setCompColumns((s) => ({ ...s, [k]: !s[k] }))}
                style={[
                  styles.colToggle,
                  { backgroundColor: compColumns[k] ? primaryBtnBg : (isDarkMode ? "#2b2b2b" : "#eee") },
                ]}
              >
                <Text style={{ color: compColumns[k] ? "#fff" : (isDarkMode ? "#ffd700" : "#000000"), fontSize: 12 }}>
                  {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.tableHeader, { borderBottomColor: borderColor }]}>
            {compColumns.subject && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Subject</Text>}
            {compColumns.total_students && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Total Students</Text>}
            {compColumns.completed_students && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Completed</Text>}
            {compColumns.completion_rate && <Text style={[styles.th, { color: textColor, flex: 1 }]}>Completion %</Text>}
          </View>

          {completionRates.length === 0 ? (
            <Text style={[styles.emptyText, { color: subTextColor }]}>No completion data available.</Text>
          ) : (
            completionRates.map((item, index) => (
              <View key={index} style={[styles.tableRow, { borderBottomColor: borderColor }]}>
                {compColumns.subject && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.subject_name}</Text>}
                {compColumns.total_students && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.total_students}</Text>}
                {compColumns.completed_students && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.completed_students}</Text>}
                {compColumns.completion_rate && <Text style={[styles.td, { color: textColor, flex: 1 }]}>{item.completion_rate}%</Text>}
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 14,
  },

  tabsContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#808080",
    marginRight: 8,
  },
  tabText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 13,
  },

  filterCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resetBtn: {
    marginLeft: 8,
    backgroundColor: "#0E5149",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyBtn: {
    marginLeft: 8,
    backgroundColor: "#0E5149",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  filterCol: {
    flex: 1,
    marginRight: 8,
  },
  filterLabel: {
    marginBottom: 6,
    fontWeight: "600",
  },

  pickerWrap: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: (isDarkMode) => ({
    color: isDarkMode ? "#F7F7F7" : "#000000",
    backgroundColor: isDarkMode ? "#0E5149" : "#ffffff",
    fontSize: 15,
    height: 55,
    paddingHorizontal: 10,
  }),

  inputSmall: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === "web" ? 8 : 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "web" ? 10 : 8,
    backgroundColor: "#fff",
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
    fontWeight: "500"
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    fontWeight: "500"
  },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    padding: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
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
    fontWeight: "500",
    fontSize: 14,
  },
  td: {
    fontSize: 14,
    fontWeight: "500"
  },
  emptyText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
  },

  /* column toggles */
  columnToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
  },
  colToggle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
});