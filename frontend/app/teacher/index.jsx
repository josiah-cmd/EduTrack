/* eslint-disable */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { addDays, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from "../lib/axios";
import AnnouncementForm from './AnnouncementForm';
import AnnouncementList from './AnnouncementList';
import GradeForm from "./grades/GradeForm";
import GradeList from "./grades/GradeList";
import Messages from "./messages";
import NotificationList from "./NotificationList";
import ChangePasswordForm from "./profile/ChangePasswordForm";
import ProfileForm from "./profile/ProfileForm";
import ProfileHeader from "./profile/ProfileHeader";
import RoomContent from "./RoomContent";

const ACADEMIC_YEAR_STORAGE_KEY = "selected_academic_year_id";

export default function TeacherDashboard() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  const [userName, setUserName] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [notificationTarget, setNotificationTarget] = useState(null);
  const bellRef = useRef(null);

  const [materials, setMaterials] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');

  // 🔵 Academic Year selector state
  const [academicYears, setAcademicYears] = useState([]);
  const [currentYearIndex, setCurrentYearIndex] = useState(0);
  const selectedAcademicYear = academicYears[currentYearIndex];

  // ✅ logout modal state (added)
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const weeks = [];
  let day = startDate;
  while (day <= endDate) {
    weeks.push(
      Array(7)
        .fill(0)
        .map((_, i) => {
          const newDay = addDays(day, i);
          return newDay;
        })
    );
    day = addDays(day, 7);
  }

  // 🔵 ADDED: Teacher dashboard stats (admin-style)
  const [stats, setStats] = useState({
    rooms: 0,
    sections: 0,
    subjects: 0,
    students: 0,
  });

  // 🔵 Fetch teacher dashboard stats (by academic year)
  useEffect(() => {
    if (!selectedAcademicYear?.id) return;

    const fetchTeacherStats = async () => {
      try {
        const res = await api.get('/teacher/dashboard/stats', {
          params: { academic_year_id: selectedAcademicYear.id },
        });
        setStats(res.data);
      } catch (error) {
        console.error('Failed to load teacher stats', error);
      }
    };

    fetchTeacherStats();
  }, [selectedAcademicYear?.id]);

  // 🔵 Fetch academic years (admin-controlled)
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const res = await api.get('/academic-years');
        const years = res.data.sort(
          (a, b) => new Date(b.start_date) - new Date(a.start_date)
        );

        setAcademicYears(years);

        // ✅ NEW: restore previously selected year
        const storedYearId = await AsyncStorage.getItem(
          ACADEMIC_YEAR_STORAGE_KEY
        );

        if (storedYearId) {
          const storedIndex = years.findIndex(
            y => String(y.id) === String(storedYearId)
          );

          if (storedIndex !== -1) {
            setCurrentYearIndex(storedIndex);
            return;
          }
        }

        // 🔵 fallback to active year
        const activeIndex = years.findIndex(y => y.is_active);
        if (activeIndex !== -1) {
          setCurrentYearIndex(activeIndex);
          await AsyncStorage.setItem(
            ACADEMIC_YEAR_STORAGE_KEY,
            String(years[activeIndex].id)
          );
        } else {
          setCurrentYearIndex(0);
        }

      } catch (err) {
        console.error('Failed to fetch academic years', err);
      }
    };

    fetchAcademicYears();
  }, []);

  useEffect(() => {
    const fetchDeadlines = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const res = await axios.get("http://localhost:8000/api/materials", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMaterials(res.data);
      } catch (err) {
        console.error("Error fetching deadlines:", err.response?.data || err.message);
      }
    };
    fetchDeadlines();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const userRes = await api.get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserName(userRes.data.name);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (!selectedAcademicYear?.id) return;

    const fetchRooms = async () => {
      try {
        const response = await api.get("/teacher/rooms", {
          params: { academic_year_id: selectedAcademicYear.id },
        });
        setRooms(response.data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchRooms();
  }, [selectedAcademicYear?.id]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const res = await api.get("/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(res.data.data);
        const unread = res.data.data.filter(n => !n.read_at).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notifications:", err.response?.data || err.message);
      }
    };
    fetchNotifications();
  }, []);

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, "");
  };

  const handleNotificationClick = (item) => {
    if (item.type === "message") {
      setCurrentView("messages");
    } else if (item.type === "material") {
      setNotificationTarget(item);
      if (item.section_id) {
        const room = rooms.find(r => r.section?.id === item.section_id);
        if (room) {
          setSelectedRoom(room);
          setCurrentView("detail");
        }
      }
    } else if (item.type === "announcement") {
      setCurrentView("announcements");
    }
    setDropdownVisible(false);
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ✅ logout now uses modal: open modal first; actual logout function below closes and redirects
  const confirmLogout = () => setLogoutModalVisible(true);
  const logout = () => {
    setLogoutModalVisible(false);
    router.replace('/');
  };

  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? '#fff' : '#000', fontWeight: "500" };
  const textStyles = isDarkMode ? styles.textLight : styles.textDark;

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setCurrentView('detail');
  };

  // ✅ Helper: Format days safely (already existed)
  const formatDays = (dayField) => {
    if (!dayField) return "No schedule";
    if (Array.isArray(dayField)) return dayField.join(", ");
    try {
      const parsed = JSON.parse(dayField);
      return Array.isArray(parsed) ? parsed.join(", ") : dayField;
    } catch {
      return dayField;
    }
  };

  // ✅ NEW helper: format multiple times safely
  const formatTimes = (timeField) => {
    if (!timeField) return "";
    if (Array.isArray(timeField)) return timeField.join(", ");
    try {
      const parsed = JSON.parse(timeField);
      return Array.isArray(parsed) ? parsed.join(", ") : timeField;
    } catch {
      return timeField;
    }
  };

  const handleOpenRoom = (room) => {
    setSelectedRoom(room);
    setCurrentView('detail');
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch =
        room.subject?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        room.section?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesGrade =
        selectedGrade === 'All' ||
        room.section?.grade_level === selectedGrade;

      const matchesSection =
        selectedSection === 'All' ||
        room.section?.name === selectedSection;

      return matchesSearch && matchesGrade && matchesSection;
    });
  }, [rooms, searchQuery, selectedGrade, selectedSection]);

  // 🔵 Academic year navigation
  // newer year (up)
  const goNextYear = () => {
    setCurrentYearIndex(i => Math.max(i - 1, 0));
  };

  // older year (down)
  const goPrevYear = () => {
    setCurrentYearIndex(i =>
      Math.min(i + 1, academicYears.length - 1)
    );
  };

  useEffect(() => {
    console.log("🧠 Selected Academic Year:", selectedAcademicYear);
  }, [selectedAcademicYear]);

  useEffect(() => {
    if (selectedAcademicYear?.id) {
      AsyncStorage.setItem(
        ACADEMIC_YEAR_STORAGE_KEY,
        String(selectedAcademicYear.id)
      );
    }
  }, [selectedAcademicYear]);

  useEffect(() => {
    console.log(
      "📤 Sending academic_year_id to API:",
      selectedAcademicYear?.id,
      selectedAcademicYear?.year_label
    );
  }, [selectedAcademicYear]);

  return (
    <View style={[styles.container, themeStyles]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: isDarkMode ? '#0E5149' : '#FFFFFF' }]}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.sidebarToggle}>
            <Ionicons name="menu" size={28} color={textColor.color} />
          </TouchableOpacity>
          <Image source={require('../../assets/edutrack-logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.brandText, textColor]}>EduTrack</Text>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity ref={bellRef} onPress={() => setDropdownVisible(!dropdownVisible)} style={{ position: "relative" }}>
            <Ionicons name="notifications-outline" size={30} color={textColor.color} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleDarkMode}>
            <Ionicons name={isDarkMode ? 'sunny-outline' : 'moon-outline'} size={30} color={textColor.color} />
          </TouchableOpacity>
          {/* open modal instead of immediate logout */}
          <TouchableOpacity onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={30} color={textColor.color} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        transparent
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDarkMode ? "#0E5149" : "#fff" }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? "#fff" : "#000", fontWeight: "500" }]}>
              Are you sure you want to log out?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: isDarkMode ? "#808080" : "#ccc" }]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutButton, { backgroundColor: "#FF0000" }]}
                onPress={logout}
              >
                <Text style={{ color: "#fff" }}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ✅ Notifications Dropdown */}
      {dropdownVisible && (
        <View style={[styles.dropdown, isDarkMode ? styles.dropdownDark : styles.dropdownLight]}>
          <Text style={[styles.dropdownHeader, textColor]}>Notifications</Text>
          <FlatList
            data={notifications}
            keyExtractor={(item, index) => index.toString()}
            style={{ maxHeight: 300 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleNotificationClick(item)}>
                <View style={styles.notificationItem}>
                  {/* ✅ show type + title */}
                  <Text style={[styles.notificationText, textColor]}>
                    [{item.type?.toUpperCase()}] {item.title}
                  </Text>
                  {/* ✅ show message body */}
                  <Text style={[{ fontSize: 12 }, textColor]}>{item.message}</Text>
                  {/* ✅ show formatted created_at */}
                  <Text style={{ fontSize: 12, color: "#F7F7F7" }}>
                    {format(new Date(item.created_at), "MMM dd, yyyy h:mm a")}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.dropdownFooter}
            onPress={() => {
              setCurrentView('notifications');
              setDropdownVisible(false);
            }}
          >
            <Text style={{ color: "#F7F7F7", fontWeight: "500" }}>View all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Body */}
      <View style={[styles.body, themeStyles]}>
        {/* Sidebar */}
        {sidebarOpen && (
          <View style={[styles.sidebar, isDarkMode ? styles.sidebarDark : styles.sidebarLight]}>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => { setCurrentView('dashboard'); setSelectedRoom(null); }}>
              <Ionicons name="home-outline" size={20} color={textColor.color} />
              <Text style={[styles.sidebarText, textStyles]}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => { setCurrentView('myClasses'); setSelectedRoom(null); }}>
              <Ionicons name="book-outline" size={20} color={textColor.color} />
              <Text style={[styles.sidebarText, textStyles]}>My Classes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('calendar')}>
              <Ionicons name="calendar-outline" size={20} color={textColor.color} />
              <Text style={[styles.sidebarText, textStyles]}>Calendar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('announcements')}>
              <Ionicons name="megaphone-outline" size={20} color={textColor.color} />
              <Text style={[styles.sidebarText, textStyles]}>Announcements</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('grades')}>
              <Ionicons name="bar-chart-outline" size={20} color={textColor.color} />
              <Text style={[styles.sidebarText, textStyles]}>Grades</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('messages')}>
              <Ionicons name="chatbubbles-outline" size={20} color={textColor.color} />
              <Text style={[styles.sidebarText, textStyles]}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.userContainer, { backgroundColor: isDarkMode ? "#808080" : "#f9f9f9" }]}
              onPress={() => setCurrentView("profileHeader")}>
              <Text style={[styles.userLabel, { color: isDarkMode ? "#F7F7F7" : "#333", fontWeight: "500" }]}>
                👤 Logged in as:
              </Text>
              <Text style={[styles.userName, { color: isDarkMode ? "#000000" : "#000", fontWeight: "500" }]}>
                {userName ? userName : "Loading..."}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        <View style={[styles.mainContent, isDarkMode ? styles.mainContentDark : styles.mainContentLight, !sidebarOpen && styles.fullWidth]}>
          {/* Dashboard */}
          {currentView === 'dashboard' && !selectedRoom && (
            <>
              {/* 🔵 HEADER ROW */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                {/* Teacher Dashboard */}
                <Text
                  style={[
                    styles.mainText,
                    { color: isDarkMode ? "#F7F7F7" : "#000", fontWeight: "500" },
                  ]}
                >
                  Teacher Dashboard
                </Text>

                {/* 🔵 Academic Year Selector */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {/* Year Container */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: isDarkMode ? "#808080" : "#E5E5E5",
                      borderRadius: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      marginRight: 8,
                    }}
                  >
                    {/* Active Year Box */}
                    <View>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "500",
                          color: isDarkMode ? "#F7F7F7" : "#000",
                        }}
                      >
                        {selectedAcademicYear?.year_label || "Loading..."}
                      </Text>
                    </View>
                  </View>

                  {/* Up / Down Controls */}
                  <View style={{ alignItems: "center" }}>
                    <TouchableOpacity onPress={goNextYear}>
                      <Ionicons
                        name="chevron-up"
                        size={20}
                        color={isDarkMode ? "#F7F7F7" : "#000"}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={goPrevYear}>
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={isDarkMode ? "#F7F7F7" : "#000"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* 🔵 ADDED: Teacher Stats (Admin-style cards) */}
              <View style={styles.statsContainer}>
                <View style={[styles.statCard, isDarkMode && { backgroundColor: '#808080', borderColor: '#F7F7F7' }]}>
                  <Text style={[styles.statNumber, isDarkMode && { color: '#E8F5E9' }]}>{stats.rooms}</Text>
                  <Text style={[styles.statLabel, isDarkMode && { color: '#000000' }]}>Rooms</Text>
                </View>

                <View style={[styles.statCard, isDarkMode && { backgroundColor: '#808080', borderColor: '#F7F7F7' }]}>
                  <Text style={[styles.statNumber, isDarkMode && { color: '#E8F5E9' }]}>{stats.sections}</Text>
                  <Text style={[styles.statLabel, isDarkMode && { color: '#000000' }]}>Sections</Text>
                </View>

                <View style={[styles.statCard, isDarkMode && { backgroundColor: '#808080', borderColor: '#F7F7F7' }]}>
                  <Text style={[styles.statNumber, isDarkMode && { color: '#E8F5E9' }]}>{stats.subjects}</Text>
                  <Text style={[styles.statLabel, isDarkMode && { color: '#000000' }]}>Subjects</Text>
                </View>

                <View style={[styles.statCard, isDarkMode && { backgroundColor: '#808080', borderColor: '#F7F7F7' }]}>
                  <Text style={[styles.statNumber, isDarkMode && { color: '#E8F5E9' }]}>{stats.students}</Text>
                  <Text style={[styles.statLabel, isDarkMode && { color: '#000000' }]}>Students</Text>
                </View>
              </View>

              <Text style={[styles.mainText, { color: isDarkMode ? "#F7F7F7" : "#000" }]}>Rooms</Text>

              <View style={styles.subjectsContainer}>
                {filteredRooms.map((room, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.subjectCard,
                      {
                        backgroundColor: isDarkMode ? "#808080" : "#f1f1f1",
                        borderColor: isDarkMode ? "#000000" : "#202020",
                        borderWidth: 1,
                        shadowColor: isDarkMode ? "#000000" : "#333",
                      },
                      hoveredIndex === index && Platform.OS === "web"
                        ? [
                          styles.subjectCardHover,
                          {
                            shadowColor: isDarkMode ? "#FFD700" : "#007b55",
                            transform: [{ scale: 1.05 }],
                          },
                        ]
                        : {},
                    ]}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <TouchableOpacity onPress={() => handleRoomSelect(room)}>
                      <Text style={[styles.subjectTitle, { color: isDarkMode ? "#F7F7F7" : "#000000", fontWeight: "500" }]}>
                        {room.subject?.name}
                      </Text>
                      <Text style={[styles.subjectDetails, { color: isDarkMode ? "#fff" : "#000000", fontWeight: "500" }]}>
                        Section: {room.section?.name}
                      </Text>
                      <Text style={[styles.subjectDetails, { color: isDarkMode ? "#F7F7F7" : "#000000", fontWeight: "500" }]}>
                        Schedule: {formatDays(room.day)} {formatTimes(room.time)}
                      </Text>
                      <Text style={[styles.subjectDetails, { fontStyle: "italic", color: isDarkMode ? "#000000" : "#000000", fontWeight: "500" }]}>
                        Code: {room.token || "No Token"}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </>
          )}

          {/* My Classes */}
          {currentView === 'myClasses' && (
            <ScrollView style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>My Classes</Text>

              {/* 🔍 Search + Filter */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginVertical: 10,
                }}
              >
                {/* 🔍 Search */}
                <TextInput
                  placeholder="Search subject or section..."
                  placeholderTextColor={isDarkMode ? '#F7F7F7' : '#000000'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    width: 260,
                    padding: 10,
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#333' : '#ccc',
                    borderRadius: 6,
                    color: isDarkMode ? '#fff' : '#000',
                    marginRight: 10,
                    backgroundColor: isDarkMode ? '#2b2b2b' : '#f2f2f2',
                  }}
                />

                {/* 📘 Section Dropdown */}
                <View
                  style={{
                    width: 200,
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#333' : '#ccc',
                    borderRadius: 6,
                    backgroundColor: isDarkMode ? '#2b2b2b' : '#f2f2f2',
                  }}
                >
                  <Picker
                    selectedValue={selectedSection}
                    onValueChange={(value) => setSelectedSection(value)}
                    dropdownIconColor={isDarkMode ? '#000000' : '#000'}
                    style={{
                      color: isDarkMode ? '#F7F7F7' : '#000',
                      height: 45,
                      backgroundColor: isDarkMode ? '#2b2b2b' : '#f2f2f2',
                    }}
                  >
                    <Picker.Item label="All Sections" value="All" />
                    {[...new Set(rooms.map(r => r.section?.name).filter(Boolean))].map(
                      (section, index) => (
                        <Picker.Item
                          key={index}
                          label={section}
                          value={section}
                        />
                      )
                    )}
                  </Picker>
                </View>
              </View>

              {filteredRooms.length === 0 ? (
                <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>
                  No classes found.
                </Text>
              ) : (
                filteredRooms.map((room, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => handleOpenRoom(room)}
                  >
                    <View
                      style={{
                        padding: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: isDarkMode ? '#333' : '#ccc',
                      }}
                    >
                      <Text
                        style={[
                          { fontSize: 18, fontWeight: '500' },
                          textColor,
                        ]}
                      >
                        {room.subject?.name}
                      </Text>

                      <Text
                        style={[
                          styles.subjectDetails,
                          { color: isDarkMode ? '#fff' : '#000000', fontWeight: "500" },
                        ]}
                      >
                        {room.section?.name}
                      </Text>

                      <Text style={{ color: isDarkMode ? '#F7F7F7' : '#000000', fontWeight: "500" }}>
                        {formatDays(room.day)} {formatTimes(room.time)}
                      </Text>

                      <Text style={{ color: '#000000', fontStyle: 'italic', fontWeight: "500"}}>
                        Code: {room.token || 'No Token'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          {/* Subject Detail */}
          {currentView === "detail" && selectedRoom && (
            <ScrollView contentContainerStyle={styles.detailContainer} showsVerticalScrollIndicator={false}>
              <View style={[styles.leftContainer, { backgroundColor: isDarkMode ? "#808080" : "#f1f1f1", borderColor: isDarkMode ? "#000000" : "#000000", borderWidth: 1, shadowColor: isDarkMode ? "#000000" : "#333", }]}>
                <Image source={{ uri: selectedRoom.teacher?.user?.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", }} style={styles.profileImage} />
                <Text style={[styles.instructorName, { color: isDarkMode ? "#F7F7F7" : "#000000", fontWeight: "500" }]}>
                  {selectedRoom.teacher?.user?.name || selectedRoom.teacher?.name || "No Name"}
                </Text>
                <Text style={[styles.instructorSection, { color: isDarkMode ? "#fff" : "#000000", fontWeight: "500" }]}>
                  Section: {selectedRoom.section?.name || "No Section"}
                </Text>
                {/* ✅ adjusted to show multiple days and times */}
                <Text style={[styles.instructorSchedule, { color: isDarkMode ? "#F7F7F7" : "#000000", fontWeight: "500" }]}>
                  Schedule: {formatDays(selectedRoom.day)} {formatTimes(selectedRoom.time)}
                </Text>
                <Text style={{ color: isDarkMode ? "#000000" : "#000000", fontStyle: "italic", marginTop: 4, fontWeight: "500" }}>
                  Code: {selectedRoom.token || "No Token"}
                </Text>
              </View>

              <View style={[styles.rightContainer]}>
                <RoomContent room={selectedRoom} />
              </View>
            </ScrollView>
          )}

          {/* Calendar */}
          {currentView === 'calendar' && (
            <View style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>Calendar</Text>
              <View
                style={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
                  borderRadius: 8,
                  padding: 15,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 4,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#333' : '#ccc',
                }}
              >
                {/* ✅ Calendar Header */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <TouchableOpacity onPress={() => setCurrentMonth(addDays(currentMonth, -30))}>
                    <Ionicons name="chevron-back" size={24} color={textColor.color} />
                  </TouchableOpacity>
                  <Text style={[{ fontSize: 20, fontWeight: "bold", fontWeight: "500" }, textColor]}>
                    {format(currentMonth, "MMMM yyyy")}
                  </Text>
                  <TouchableOpacity onPress={() => setCurrentMonth(addDays(currentMonth, 30))}>
                    <Ionicons name="chevron-forward" size={24} color={textColor.color} />
                  </TouchableOpacity>
                </View>

                {/* ✅ Weekdays Header */}
                <View style={{ flexDirection: "row" }}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <Text
                      key={d}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontWeight: "bold",
                        color: isDarkMode ? "#F7F7F7" : "#000000",
                        paddingVertical: 5,
                        fontWeight: "500",
                      }}
                    >
                      {d}
                    </Text>
                  ))}
                </View>

                {/* ✅ Calendar Grid */}
                {weeks.map((week, wi) => (
                  <View key={wi} style={{ flexDirection: "row" }}>
                    {week.map((day, di) => {
                      const dayStr = format(day, "yyyy-MM-dd");
                      const dayMaterials = materials.filter(m => m.deadline && format(new Date(m.deadline), "yyyy-MM-dd") === dayStr);

                      return (
                        <View
                          key={di}
                          style={{
                            flex: 1,
                            minHeight: 80,
                            borderWidth: 1,
                            borderColor: isDarkMode ? "#333" : "#ddd",
                            padding: 4,
                            backgroundColor: isToday(day)
                              ? isDarkMode ? "#808080" : "#fffbe6"
                              : isSameMonth(day, currentMonth)
                                ? (isDarkMode ? "#1a1a1a" : "#fff")
                                : (isDarkMode ? "#111" : "#f9f9f9"),
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isToday(day) ? "bold" : "normal",
                              color: isSameMonth(day, currentMonth)
                                ? (isDarkMode ? "#fff" : "#000")
                                : "#999",
                              marginBottom: 2,
                              fontWeight: "500"
                            }}
                          >
                            {format(day, "d")}
                          </Text>
                          {dayMaterials.map((m, i) => (
                            <Text
                              key={i}
                              numberOfLines={1}
                              style={{
                                fontSize: 10,
                                backgroundColor: m.type === "assignment" ? "#e11d48" : "#2563eb",
                                color: "#fff",
                                borderRadius: 4,
                                paddingHorizontal: 2,
                                marginTop: 2,
                                fontWeight: "500"
                              }}
                            >
                              {m.title}
                            </Text>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Announcements */}
          {currentView === 'announcements' && (
            <View style={{ padding: 20, flex: 1 }}>
              <Text style={[styles.mainText, textColor]}>Announcements</Text>
              <View style={{ marginBottom: 20 }}>
                <AnnouncementForm isDarkMode={isDarkMode}/>
              </View>
              <View style={{ flex: 1 }}>
                <AnnouncementList />
              </View>
            </View>
          )}

          {/* Grades */}
          {currentView === 'grades' && (
            <View style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>Grades</Text>
            </View>
          )}

          {/* Messages */}
          {currentView === 'messages' && (
            <View style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>Messages</Text>
              <Messages isDarkMode={isDarkMode} />
            </View>
          )}

          {/* 🟢 Notifications Full Page */}
          {currentView === 'notifications' && (
            <View style={{ padding: 20, flex: 1 }}>
              <NotificationList
                onOpenMaterial={(data) => {
                  if (data.section_id) {
                    const room = rooms.find(r => r.section?.id === data.section_id);
                    if (room) {
                      setSelectedRoom(room);
                      setCurrentView("detail");
                    }
                  }
                }}
                onOpenMessages={() => setCurrentView("messages")}
                onOpenAnnouncements={() => setCurrentView("announcements")}
              />
            </View>
          )}
          {currentView === "profileHeader" && (
            <ProfileHeader
              isDarkMode={isDarkMode}
              onEdit={(view) =>
                setCurrentView(view === "changePassword" ? "changePassword" : "profileForm")
              }
            />
          )}

          {currentView === "profileForm" && (
            <ProfileForm isDarkMode={isDarkMode} onBack={() => setCurrentView("profileHeader")} />
          )}

          {currentView === "changePassword" && (
            <ChangePasswordForm isDarkMode={isDarkMode} onBack={() => setCurrentView("profileHeader")} />
          )}

          {/* Grades Main (List) */}
          {currentView === 'grades' && (
            <View style={{ padding: 20 }}>
              <GradeList
                isDarkMode={isDarkMode}
                onSelectRoom={(room) => {
                  setSelectedRoom(room);
                  setCurrentView('gradeForm'); // or 'gradeForm', depending on what should open
                }}
                onAddGrade={() => setCurrentView('gradeForm')}
                onViewSummary={() => setCurrentView('gradeSummary')}
              />
            </View>
          )}

          {/* Add / Update Grades */}
          {currentView === 'gradeForm' && (
            <View style={{ padding: 20, flex: 1 }}>
              <GradeForm
                isDarkMode={isDarkMode}
                room={selectedRoom}
                onBack={() => setCurrentView('grades')}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    // removed explicit color here - we apply dynamic bg inline in JSX
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 36,
    height: 36,
    marginHorizontal: 4,
  },
  brandText: {
    fontSize: 25,
    fontWeight: '500',
    color: '#FFD700',   
  },
  sidebarToggle: {
    paddingRight: 4,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 220,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRightWidth: 1,
  },
  // updated sidebar dark to DWAD tones
  sidebarDark: {
    backgroundColor: '#0E5149',
    borderColor: '#000000',
  },
  sidebarLight: {
    backgroundColor: '#f1f1f1',
    borderColor: '#000000',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  sidebarText: {
    fontSize: 20,
    color: '#ffffff', // white text for dark sidebar
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  mainContentDark: {
    backgroundColor: '#0E5149', // deep green background to match admin
  },
  mainContentLight: {
    backgroundColor: '#ffffff',
  },
  fullWidth: {
    width: '100%',
  },
  mainText: {
    fontSize: 25,
    marginBottom: 12,
    color: '#FFD700', // gold headings
    fontWeight: '700',
  },
  light: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
  },
  dark: {
    backgroundColor: '#000000',
    borderColor: '#333333',
  },
  textLight: {
    color: '#ffffff',
  },
  textDark: {
    color: '#000000',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  subjectCard: {
    width: 250,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#12352E', // updated default subject card
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    transform: [{ scale: 1 }],
    transitionDuration: '200ms',
    borderWidth: 1,
    borderColor: '#215C49',
  },
  subjectCardHover: {
    transform: [{ scale: 1.05 }],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
  },
  subjectTitle: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 6,
  },
  subjectDetails: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 2,
  },
  detailContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
    padding: 20,
  },
  leftContainer: {
    width: 250,
    alignItems: 'center',
    backgroundColor: '#12352E',
    padding: 55,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#215C49',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  instructorName: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  instructorSchedule: {
    color: '#ddd',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center'
  },
  rightContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 16
  },
  contentButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4, elevation: 3
  },
  contentButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  // ✅ new styles for logged-in user
  userContainer: {
    marginTop: 290,
    marginHorizontal: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#12352E',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
  },
  userLabel: {
    fontSize: 14,
    color: '#BFD9D2',
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700', // gold highlight for username
    marginLeft: 6,
  },
  // ✅ badge
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FFD700", // gold notification badge
    borderRadius: 12,
    paddingHorizontal: 5,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "bold",
  },

  // ✅ dropdown
  dropdown: {
    position: "absolute",
    top: 50,         // a bit closer to the bell
    right: 0,        // align with bell instead of floating far
    width: 300,      // tighter width (was 300)
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 6,
    zIndex: 100,
  },
  dropdownDark: {
    backgroundColor: "#1e1e1e",
    borderWidth: 1,
    borderColor: "#F7F7F7",
  },
  dropdownLight: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dropdownHeader: {
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#333",
  },
  dropdownFooter: {
    paddingVertical: 10,
    alignItems: "center",
  },
  notificationItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  notificationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // dim backdrop
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 999,
  },

  modalBox: {
    width: "30%",
    borderRadius: 16,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#fff",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  logoutButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // 🔵 ADDED: Admin-style stats container
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    marginTop: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    padding: 20,
    marginHorizontal: 6,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },

  statNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000000',
    fontWeight: "500"
  },

  statLabel: {
    fontSize: 16,
    color: '#000000',
    marginTop: 6,
    fontWeight: '500',
  },
});