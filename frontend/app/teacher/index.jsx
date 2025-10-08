import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { format } from "date-fns";
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from "../lib/axios";
import AnnouncementForm from './AnnouncementForm';
import AnnouncementList from './AnnouncementList';
import Messages from "./messages";
import NotificationList from "./NotificationList";
import ProfileForm from "./profile/ProfileForm";
import ProfileHeader from "./profile/ProfileHeader";
import RoomContent from "./RoomContent";

// ✅ date-fns import
import { addDays, endOfMonth, endOfWeek, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";

export default function TeacherDashboard() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  // ✅ logged-in user
  const [userName, setUserName] = useState("");

  // ✅ notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // ✅ refs for positioning
  const bellRef = useRef(null);

  // ✅ calendar state
  const [materials, setMaterials] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

// ✅ build weeks for table layout
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

  useEffect(() => {
    const fetchRoomsAndUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        console.log("🔑 Token used for fetchRooms:", token);

        if (!token) {
          console.warn("⚠️ No auth token found in AsyncStorage");
          return;
        }

        // ✅ fetch teacher rooms
        const response = await api.get("/teacher/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("✅ Teacher rooms fetched:", response.data);
        setRooms(response.data);

        // ✅ fetch logged-in user (using api helper, not localhost!)
        const userRes = await api.get("/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("👤 Logged-in user:", userRes.data);
        setUserName(userRes.data.name);

      } catch (error) {
        console.error(
          "Error fetching teacher dashboard:",
          error.response?.data || error.message
        );
      }
    };

    fetchRoomsAndUser();
  }, []);

  // ✅ fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await api.get("/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setNotifications(res.data.data); // ✅ corrected
        const unread = res.data.data.filter(n => !n.read_at).length; // ✅ use read_at
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notifications:", err.response?.data || err.message);
      }
    };

    fetchNotifications();
  }, []);

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
      setCurrentView("announcements");   // ✅ now works
    }
    setDropdownVisible(false); // always close after click
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleProfileModal = () => setProfileModalVisible(!profileModalVisible);
  const logout = () => router.replace('/');

  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? '#fff' : '#000' };
  const textStyles = isDarkMode ? styles.textLight : styles.textDark;

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setCurrentView('detail');
  };

  return (
    <View style={[styles.container, themeStyles]}>
      {/* Navbar */}
      <View style={[styles.navbar, themeStyles]}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.sidebarToggle}>
            <Ionicons name="menu" size={28} color={textColor.color} />
          </TouchableOpacity>

          {/* ✅ Added Logo here (same as login dashboard style) */}
          <Image
            source={require('../../assets/edutrack-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={[styles.brandText, textColor]}>EduTrack</Text>
        </View>

        <View style={styles.navRight}>
          {/* ✅ Notification Bell with Dropdown */}
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
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out-outline" size={30} color={textColor.color} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ Notifications Dropdown */}
      {dropdownVisible && (
        <View style={[styles.dropdown, isDarkMode ? styles.dropdownDark : styles.dropdownLight]}>
          <Text style={[styles.dropdownHeader, textColor]}>Notifications</Text>
          <FlatList
            data={notifications}
            keyExtractor={(item, index) => index.toString()}
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleNotificationClick(item)}> {/* 🟢 CLICK HANDLER */}
                <View style={styles.notificationItem}>
                  <Text style={[styles.notificationText, textColor]}>
                    [{item.type?.toUpperCase()}] {item.title}
                  </Text>
                  {/* ✅ FIX: Show sender for messages + announcements */}
                  <Text style={[{ fontSize: 12 }, textColor]}>
                    {item.type === "message"
                      ? `A new message from ${item.sender_name || "Unknown"}`
                      : item.type === "announcement"
                        ? `A new announcement from ${item.sender_name || "Unknown"}`
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
              setCurrentView('notifications');  // switch main content
              setDropdownVisible(false);
            }}      // close dropdown
          >
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>View all</Text>
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
              style={[styles.userContainer, { backgroundColor: isDarkMode ? "#1e1e1e" : "#f9f9f9" }]}
              onPress={() => setCurrentView("profileHeader")}>
              <Text style={[styles.userLabel, { color: isDarkMode ? "#ccc" : "#333" }]}>
                👤 Logged in as:
              </Text>
              <Text style={[styles.userName, { color: isDarkMode ? "#fff" : "#000" }]}>
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
              <Text style={[styles.mainText, { color: isDarkMode ? "#FFD700" : "#000" }]}>
                Teacher Dashboard
              </Text>
              <View style={styles.subjectsContainer}>
                {rooms.map((room, index) => (
                  <Animated.View
                    key={index}
                    style={[styles.subjectCard, { backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff", borderColor: isDarkMode ? "#006400" : "#007b55", borderWidth: 1, shadowColor: isDarkMode ? "#006400" : "#333", },
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
                      <Text style={[styles.subjectDetails, { color: isDarkMode ? "#ddd" : "#444" },]}>
                        Schedule: {room.day} {room.time}
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

          {/* My Classes */}
          {currentView === 'myClasses' && (
            <ScrollView style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>My Classes</Text>
              {rooms.length === 0 ? (
                <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>No classes assigned.</Text>
              ) : (
                rooms.map((room, index) => (
                  <View key={index} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#333' : '#ccc' }}>
                    <Text style={[{ fontSize: 18, fontWeight: '600' }, textColor]}>{room.subject?.name}</Text>
                    <Text style={{ color: isDarkMode ? '#ccc' : '#555' }}>{room.day} {room.time}</Text>
                    {/* 🟢 NEW: Show Token */}
                    <Text style={{ color: "#4ade80", fontStyle: "italic" }}>
                      Code: {room.token || "No Token"}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* Subject Detail */}
          {currentView === "detail" && selectedRoom && (
            <ScrollView contentContainerStyle={styles.detailContainer}>
              {/* Left side - Instructor */}
              <View
                style={[styles.leftContainer, { backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff", borderColor: isDarkMode ? "#006400" : "#007b55", borderWidth: 1, shadowColor: isDarkMode ? "#006400" : "#333", },]}>
                <Image source={{ uri: selectedRoom.teacher?.user?.avatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", }} style={styles.profileImage} />
                <Text style={[styles.instructorName, { color: isDarkMode ? "#FFD700" : "#006400" },]}>
                  {selectedRoom.teacher?.user?.name || selectedRoom.teacher?.name || "No Name"}
                </Text>
                <Text style={[styles.instructorSection, { color: isDarkMode ? "#fff" : "#333" },]}>
                  Section: {selectedRoom.section?.name || "No Section"}
                </Text>
                <Text style={[styles.instructorSchedule, { color: isDarkMode ? "#ddd" : "#444" },]}>
                  Schedule: {selectedRoom.day} {selectedRoom.time}
                </Text>
                <Text style={{ color: isDarkMode ? "#32CD32" : "#006400", fontStyle: "italic", marginTop: 4, }}>
                  Code: {selectedRoom.token || "No Token"}
                </Text>
              </View>

              {/* Right side - Modules/Activities/Quizzes */}
              <View style={[styles.rightContainer]}>
                <RoomContent room={selectedRoom} /> {/* ✅ inserted here */}
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
              <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>No Grades</Text>
            </View>
          )}

          {/* Messages */}
          {currentView === 'messages' && (
            <View style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>Messages</Text>
              <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>No Messages</Text>
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
            <ProfileHeader isDarkMode={isDarkMode}
              onEdit={() => setCurrentView("profileForm")}
            />
          )}

          {currentView === "profileForm" && (
            <ProfileForm isDarkMode={isDarkMode}
              onBack={() => setCurrentView("profileHeader")}
            />
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
    fontWeight: '700',
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
  sidebarDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333333',
  },
  sidebarLight: {
    backgroundColor: '#f1f1f1',
    borderColor: '#e0e0e0',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  sidebarText: {
    fontSize: 20,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  mainContentDark: {
    backgroundColor: '#000000',
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
    backgroundColor: '#1f2937',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    transform: [{ scale: 1 }],
    transitionDuration: '200ms',
  },
  subjectCardHover: {
    transform: [{ scale: 1.05 }],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
  },
  subjectTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 6,
  },
  subjectDetails: {
    color: '#ccc',
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
    backgroundColor: '#1f2937',
    padding: 55,
    borderRadius: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  instructorName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  instructorSchedule: {
    color: '#ccc',
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
    marginTop: 300,
    marginHorizontal: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  userLabel: {
    fontSize: 14,
    color: '#aaa',
    fontWeight: '500',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4caf50', // ✅ green highlight for username
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
});