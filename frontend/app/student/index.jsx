import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🟢 Added for token
import axios from 'axios';
import { addDays, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from "../lib/axios";
import AnnouncementList from './AnnouncementList';
import GradeList from "./grades/GradeList";
import Messages from "./messages";
import NotificationList from './NotificationList';
import ChangePasswordForm from "./profile/ChangePasswordForm";
import ProfileForm from "./profile/ProfileForm";
import ProfileHeader from "./profile/ProfileHeader";
import RoomContent from "./RoomContent";

export default function StudentDashboard() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  // 🟢 NEW state for Rooms & Join Room
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joinToken, setJoinToken] = useState('');
  const [joinMessage, setJoinMessage] = useState('');

  // 🟢 Modal states
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false); // popup for join input

  // ✅ logged-in user
  const [userName, setUserName] = useState("");

  // ✅ notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const bellRef = useRef(null);

  // 🟢 NEW: store notification target (normalized { id, type })
  const [notificationTarget, setNotificationTarget] = useState(null);

  // ✅ logout modal state (added)
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // ✅ helper to remove <p>, <br>, <b>, etc.
  const stripHtml = (html) => {
    if (!html) return "No content";
    const text = html.replace(/<\/?[^>]+(>|$)/g, "").trim();
    return text.length > 0 ? text : "No content";
  };

  // ✅ calendar state
  const [materials, setMaterials] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ✅ build weeks for table layout
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // 🟢 ADDED safety — ensure setActiveTab exists before use
  const [activeTab, setActiveTab] = useState("materials");

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

  // 🟢 Fetch subjects & student rooms
  useEffect(() => {
    api
      .get('/subjects') // ✅ use api wrapper
      .then((response) => setSubjects(response.data))
      .catch((error) => console.error('Error fetching subjects:', error));

    const fetchRoomsAndUser = async () => { 
      try {
        const role = await AsyncStorage.getItem("role"); // ✅ match axios.js
        const token = await AsyncStorage.getItem(`${role}Token`);
        if (!token) return;

        // ✅ fetch student rooms
        const res = await api.get("/student/rooms");
        setRooms(res.data || []);

        // ✅ fetch logged-in user
        const userRes = await api.get("/me");
        setUserName(userRes.data.name);

      } catch (err) {
        console.error("❌ Error fetching student data:", err.response?.data || err.message);
      }
    };

    fetchRoomsAndUser();
  }, []);

  // ✅ fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data.data);
        const unread = res.data.data.filter(n => !n.read_at).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notifications:", err.response?.data || err.message);
      }
    };

    fetchNotifications();
  }, []);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileModal = () => setProfileModalVisible(!profileModalVisible);

  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? '#fff' : '#000' };
  const textStyles = isDarkMode ? styles.textLight : styles.textDark;

  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setCurrentView('detail');
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setCurrentView('detail');
    // clear any stale notification target when user manually opens a room
    setNotificationTarget(null);
  };

  // ✅ Added helper functions for multiple schedules
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

  const formatTimes = (timeField) => {
    if (!timeField) return "";
    if (Array.isArray(timeField)) return timeField.join(" | ");
    try {
      const parsed = JSON.parse(timeField);
      return Array.isArray(parsed) ? parsed.join(" | ") : timeField;
    } catch {
      return timeField;
    }
  };

  // 🟢 Handle notification click → updated logic (QUIZ HANDLER FIX)
  const handleNotificationClick = (item) => {
    const sender = item.sender_name || item.sender?.name || "Unknown";

    if (item.type === "message") {
      setCurrentView("messages");

    // ✅ Recognize module/assignment notifications either by type or presence of material_id
    } else if (item.type === "module" || item.type === "assignment" || item.material_id) {
      // Normalize notification target so RoomContent gets a predictable shape
      const target = {
        id: item.material_id ?? null,
        type: item.type ?? (item.material_id ? 'module' : null),
        section_id: item.section_id ?? null,
        room_id: item.room_id ?? null,
      };
      setNotificationTarget(target);

      // First try to find room by section_id, then by room_id (covers both cases)
      let room = null;
      if (item.section_id) {
        room = rooms.find(r => r.section?.id === item.section_id);
      }
      if (!room && item.room_id) {
        room = rooms.find(r => r.id === item.room_id);
      }

      if (room) {
        setSelectedRoom(room);
        setCurrentView("detail");
        setTimeout(() => {
          setActiveTab("materials");
        }, 100);
      }

    } else if (item.type === "announcement") {
      setCurrentView("announcements");

    } else if (item.type === "quiz") {
      // ✅ FIXED: proper quiz open
      const quizSection = item.section_id || item.room_id;
      const room = rooms.find(
        (r) => r.section?.id === quizSection || r.id === quizSection
      );
      if (room) {
        setSelectedRoom(room);
        setCurrentView("detail");
        setTimeout(() => {
          setActiveTab("quizzes");
        }, 300);
      }
    }

    setDropdownVisible(false);
  };

  // 🟢 Join Room logic
  const handleJoinRoom = async () => {
    if (!joinToken.trim()) {
      setJoinMessage('⚠️ Please enter a token');
      return;
    }
    try {
      const role = await AsyncStorage.getItem("role"); // ✅ match axios.js
      const token = await AsyncStorage.getItem(`${role}Token`);
      if (!token) {
        setJoinMessage('⚠️ No auth token found. Please login again.');
        return;
      }
      const res = await api.post(
        '/rooms/join',
        { token: joinToken.trim() }
      );
      setJoinMessage('✅ Joined room successfully!');
      setRooms((prev) => [...prev, res.data.room]); // add new room to list
      setJoinToken('');

      setJoinModalVisible(false); // close popup
      setSuccessModalVisible(true); // show success
    } catch (err) {
      console.error('❌ Join room error:', err.response?.data || err.message);
      setJoinMessage(err.response?.data?.error || '❌ Failed to join room');
    }
  };

  // ✅ fetch deadlines for calendar
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

  // ✅ logout now uses modal: open modal first; actual logout function below closes and redirects
  const confirmLogout = () => setLogoutModalVisible(true);
  const logout = () => {
    setLogoutModalVisible(false);
    router.replace('/');
  };

  return (
    <View style={[styles.container, themeStyles]}>
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: isDarkMode ? '#12362D' : '#FFFFFF' }]}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.sidebarToggle}>
            <Ionicons name="menu" size={28} color={textColor.color} />
          </TouchableOpacity>

          <Image
            source={require('../../assets/edutrack-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={[styles.brandText, textColor]}>EduTrack</Text>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity
            ref={bellRef}
            onPress={() => setDropdownVisible(!dropdownVisible)}
            style={{ position: "relative" }}
          >
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
          <View style={[styles.modalBox, { backgroundColor: isDarkMode ? "#12352E" : "#fff" }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
              Are you sure you want to log out?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: isDarkMode ? "#2E2E2E" : "#ccc" }]}
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
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleNotificationClick(item)}
              >
                <View style={styles.notificationItem}>
                  <Text style={[styles.notificationText, textColor]}>
                    [{item.type?.toUpperCase()}] {item.title}
                  </Text>
                  <Text style={[{ fontSize: 12 }, textColor]}>
                    {item.type === "message"
                      ? `A new message from ${item.sender_name || "Unknown"}`
                      : item.type === "announcement"
                        ? `A new announcement from ${item.sender_name || "Unknown"}`
                        : item.type === "quiz"
                          ? "A new quiz has been published for your class"
                          : stripHtml(item.content) || "No content"}
                  </Text>
                  <Text style={{ fontSize: 12, color: "gray" }}>
                    {format(new Date(item.created_at), "MMM dd, yyyy h:mm a")}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.dropdownFooter}
            onPress={() => {
              setCurrentView("notifications");
              setDropdownVisible(false);
            }}
          >
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>View all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Success Modal */}
      <Modal transparent visible={successModalVisible} animationType="fade" onRequestClose={() => setSuccessModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.successBox, { backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
            <Ionicons name="checkmark-circle-outline" size={60} color="#22c55e" />
            <Text style={[styles.successText, textColor]}>Room joined successfully!</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setSuccessModalVisible(false)}>
              <Text style={{ color: '#fff' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Room Popup */}
      <Modal transparent visible={joinModalVisible} animationType="slide" onRequestClose={() => setJoinModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#111' : '#fff' }]}>
            <Text style={[styles.modalText, textColor]}>Join a Room</Text>
            <TextInput
              value={joinToken}
              onChangeText={setJoinToken}
              placeholder="Enter Room Token"
              placeholderTextColor="#888"
              style={[
                styles.joinInput,
                {
                  backgroundColor: isDarkMode ? '#1f2937' : '#f9f9f9',
                  color: isDarkMode ? '#fff' : '#000',
                  borderColor: isDarkMode ? '#374151' : '#ccc',
                },
              ]}
            />
            <TouchableOpacity onPress={handleJoinRoom} style={[styles.joinButton, isDarkMode ? styles.joinButtonDark : styles.joinButtonLight]}>
              <Text style={[styles.joinButtonText, isDarkMode ? styles.joinButtonTextDark : styles.joinButtonTextLight]}> Join Room
              </Text>
            </TouchableOpacity>
            {joinMessage ? (
              <Text style={{ marginTop: 6, color: joinMessage.startsWith('✅') ? 'green' : 'red' }}>
                {joinMessage}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Body */}
      <View style={[styles.body, themeStyles]}>
        {/* Sidebar */}
        {sidebarOpen && (
          <View style={[styles.sidebar, isDarkMode ? styles.sidebarDark : styles.sidebarLight]}>
            <TouchableOpacity style={styles.sidebarItem} onPress={() => { setCurrentView('dashboard'); setSelectedSubject(null); }}>
              <Ionicons name="home-outline" size={20} color={textColor.color} />
              <Text style={[styles.sidebarText, textStyles]}>Dashboard</Text>
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
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={textColor.color} />
              <Text style={[styles.sidebarText, textStyles]}>Messages</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.userContainer, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f9f9f9" }]}
                onPress={() => setCurrentView("profileHeader")}>
                <Text style={[styles.userLabel, { color: isDarkMode ? "#BFD9D2" : "#333" }]}>
                  👤 Logged in as:
                </Text>
                <Text style={[styles.userName, { color: isDarkMode ? "#FFD700" : "#000" }]}>
                  {userName ? userName : "Loading..."}
                </Text>
              </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        <View style={[styles.mainContent, isDarkMode ? styles.mainContentDark : styles.mainContentLight, !sidebarOpen && styles.fullWidth]}>
          {/* Dashboard */}
          {currentView === 'dashboard' && !selectedSubject && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.mainText, { color: isDarkMode ? "#FFD700" : "#000" }]}>Student Dashboard</Text>
                <TouchableOpacity onPress={() => setJoinModalVisible(true)} style={[styles.joinButton, isDarkMode ? styles.joinButtonDark : styles.joinButtonLight]}>
                  <Text style={[styles.joinButtonText, isDarkMode ? styles.joinButtonTextDark : styles.joinButtonTextLight]}> Join Room </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.subjectsContainer}>
                {rooms.map((room, index) => (
                  <Animated.View
                    key={index}
                    style={[styles.subjectCard, { backgroundColor: isDarkMode ? "#12352E" : "#ffffff", borderColor: isDarkMode ? "#215C49" : "#007b55", borderWidth: 1, shadowColor: isDarkMode ? "#000000" : "#333", },
                    hoveredIndex === index && Platform.OS === "web" ? [styles.subjectCardHover, { shadowColor: isDarkMode ? "#FFD700" : "#007b55", transform: [{ scale: 1.05 }], },] : {},]}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}>
                    <TouchableOpacity onPress={() => handleRoomSelect(room)}>
                      <Text style={[styles.subjectTitle, { color: isDarkMode ? "#FFD700" : "#006400" },]}>
                        {room.subject?.name}
                      </Text>
                      <Text style={[styles.subjectDetails, { color: isDarkMode ? "#fff" : "#333" },]}>
                        Section: {room.section?.name}
                      </Text>
                      {/* ✅ Adjusted for multiple days and times */}
                      <Text style={[styles.subjectDetails, { color: isDarkMode ? "#ddd" : "#444" },]}>
                        Schedule: {formatDays(room.day)} {formatTimes(room.time)}
                      </Text>
                      <Text style={[styles.subjectDetails, { fontStyle: "italic", color: isDarkMode ? "#32CD32" : "#006400", },]}>
                        Code: {room.token || "No Token"}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </>
          )}

          {/* Subject Detail */}
          {currentView === "detail" && selectedRoom && (
            <ScrollView contentContainerStyle={styles.detailContainer}>
              {/* Left side - Instructor */}
              <View
                style={[styles.leftContainer, { backgroundColor: isDarkMode ? "#12352E" : "#ffffff", borderColor: isDarkMode ? "#215C49" : "#007b55", borderWidth: 1, shadowColor: isDarkMode ? "#000000" : "#333", },]}>
                <Image source={{ uri: selectedRoom.teacher?.user?.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", }} style={styles.profileImage} />
                <Text style={[styles.instructorName, { color: isDarkMode ? "#FFD700" : "#006400" },]}>
                  {selectedRoom.teacher?.user?.name || selectedRoom.teacher?.name || "No Name"}
                </Text>
                <Text style={[styles.instructorSection, { color: isDarkMode ? "#fff" : "#333" },]}>
                  Section: {selectedRoom.section?.name || "No Section"}
                </Text>
                {/* ✅ Adjusted for multiple days and times */}
                <Text style={[styles.instructorSchedule, { color: isDarkMode ? "#ddd" : "#444" },]}>
                  Schedule: {formatDays(selectedRoom.day)} {formatTimes(selectedRoom.time)}
                </Text>
                <Text style={{ color: isDarkMode ? "#32CD32" : "#006400", fontStyle: "italic", marginTop: 4, }}>
                  Code: {selectedRoom.token || "No Token"}
                </Text>
              </View>
              <View style={styles.rightContainer}>
                <RoomContent
                  room={selectedRoom}
                  openMaterial={notificationTarget}
                  onOpenConsumed={() => setNotificationTarget(null)}
                />
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
                  <Text style={[{ fontSize: 20, fontWeight: "bold" }, textColor]}>
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
                        color: isDarkMode ? "#bbb" : "#2563eb",
                        paddingVertical: 5,
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
                              ? isDarkMode ? "#fdf5d4" : "#fffbe6"
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
            <View style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>Announcements</Text>
              <AnnouncementList />
            </View>
          )}

          {/* Grades */}
          {currentView === 'grades' && (
            <View style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>Grades</Text>
              <GradeList isDarkMode={isDarkMode}/>
            </View>
          )}

          {/* Messages */}
          {currentView === 'messages' && (
            <View style={{ padding: 20, flex: 1 }}>
              <Text style={[styles.mainText, textColor]}>Messages</Text>
              <Messages isDarkMode={isDarkMode}/>
            </View>
          )}

          {/* Notifications (full list) */}
          {currentView === 'notifications' && (
            <View style={{ padding: 20, flex: 1 }}>
              <NotificationList
                onOpenMaterial={(data) => {
                  setNotificationTarget(data);
                  // find room by section_id if available
                  if (data.section_id) {
                    const room = rooms.find(r => r.section?.id === data.section_id);
                    if (room) {
                      setSelectedRoom(room);
                      setCurrentView("detail");
                    }
                  } else if (data.room_id) {
                    const room = rooms.find(r => r.id === data.room_id);
                    if (room) {
                      setSelectedRoom(room);
                      setCurrentView("detail");
                    }
                  }
                }}
                onOpenMessages={() => setCurrentView("messages")}
                onOpenAnnouncements={() => setCurrentView("announcements")}

                // 🟣 NEW: Handle quiz notifications → open room + quizzes tab
                onOpenQuiz={(data) => {
                  if (data.room_id || data.section_id) {
                    const room = rooms.find(
                      (r) => r.id === data.room_id || r.section?.id === data.section_id
                    );
                    if (room) {
                      setSelectedRoom(room);
                      setCurrentView("detail"); // enter the room
                      setTimeout(() => {
                        setActiveTab("quizzes"); // switch to quizzes tab
                      }, 300);
                    }
                  }
                }}
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
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh',
    width: '100%'
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logo: {
    width: 36,
    height: 36,
    marginHorizontal: 4,
  },
  brandText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#FFD700', // gold brand name to match admin
  },
  sidebarToggle: {
    paddingRight: 4
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  body: {
    flex: 1,
    flexDirection: 'row'
  },
  sidebar: {
    width: 220,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRightWidth: 1
  },
  sidebarDark: {
    backgroundColor: '#0F2E25',
    borderColor: '#215C49'
  },
  sidebarLight: {
    backgroundColor: '#f1f1f1',
    borderColor: '#e0e0e0'
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10
  },
  sidebarText: {
    fontSize: 20,
    color: '#ffffff', // white text for dark sidebar
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  mainContentDark: {
    backgroundColor: '#0B1F1A', // deep green background to match admin
  },
  mainContentLight: {
    backgroundColor: '#ffffff'
  },
  fullWidth: { 
    width: '100%' 
  },
  mainText: { 
    fontSize: 25, 
    marginBottom: 12,
    color: '#FFD700', // gold headings
    fontWeight: '700',
  },
  light: { 
    backgroundColor: '#ffffff', 
    borderColor: '#e0e0e0' 
  },
  dark: { 
    backgroundColor: '#000000', 
    borderColor: '#333333' 
  },
  textLight: { 
    color: '#ffffff' 
  },
  textDark: { 
    color: '#000000' 
  },
  modalBackdrop: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  modalContent: { 
    width: 300, 
    padding: 20, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  modalText: { 
    fontSize: 18, 
    marginBottom: 16 
  },
  modalButton: { 
    backgroundColor: '#2563eb', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    marginTop: 10 
  },
  subjectsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 16, 
    marginTop: 12 
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
    padding: 16,
  },
  joinInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  joinButton: { 
    backgroundColor: '#2563eb', 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
  }, 
  joinButtonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600', // ✅ DWAD THEME COLORS (no layout/design changes) 
  }, 
  joinButtonLight: { 
    backgroundColor: '#006400', 
    borderWidth: 2, 
  }, 
  joinButtonDark: { 
    backgroundColor: '#FFD700', 
    borderWidth: 2, 
  },  
  joinButtonTextLight: { 
    color: '#FFFFFF', // white text on green  
  }, 
  joinButtonTextDark: { 
    color: '#006400', // green text on gold
  }, 
  calendarBox: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    borderColor: '#374151',
  },
  successBox: {
    width: 300,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
  },
  // ✅ new styles for logged-in user
  userContainer: {
    marginTop: 340,
    marginHorizontal: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#12352E',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
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
    backgroundColor: "#FFD700", // ✅ gold notification badge
    borderRadius: 12,
    paddingHorizontal: 5,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#000", // ✅ black text for contrast
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
    borderColor: "#333",
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
});