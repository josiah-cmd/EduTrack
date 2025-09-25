import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AnnouncementForm from './AnnouncementForm';
import AnnouncementList from './AnnouncementList';
import Reports from './Reports';
import RoomForm from './RoomForm';
import UserForm from './UserForm';
import Messages from "./messages";

// ✅ system settings pages
import General from './system-settings/General';
import Maintenance from './system-settings/Maintenance';
import Security from './system-settings/Security';

// ✅ date-fns import
import { addDays, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";

export default function AdminDashboard() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  // ✅ new states
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);

  // ✅ logged-in user
  const [userName, setUserName] = useState("");

  // ✅ system settings dropdown toggle
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

  // ✅ notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // ✅ refs for positioning
  const bellRef = useRef(null);

  // ✅ calendar state
  const [materials, setMaterials] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // ✅ fetch counts
  useEffect(() => {
    const fetchStatsAndUser = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:8000/api/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTotalUsers(res.data.totalUsers);
        setTotalTeachers(res.data.totalTeachers);
        setTotalStudents(res.data.totalStudents);

        const userRes = await axios.get("http://localhost:8000/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserName(userRes.data.name);
      } catch (err) {
        console.error("Error fetching stats/user:", err.response?.data || err.message);
      }
    };

    fetchStatsAndUser();
  }, []);

  // ✅ fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await axios.get("http://localhost:8000/api/notifications", {
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

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const logout = () => router.replace('/');

  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? '#fff' : '#000' };
  const textStyles = isDarkMode ? styles.textLight : styles.textDark;

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

  return (
    <View style={[styles.container, themeStyles]}>
      {/* Navbar */}
      <View style={[styles.navbar, themeStyles]}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.sidebarToggle}>
            <Ionicons name="menu" size={28} color={textColor.color} />
          </TouchableOpacity>
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
              <View style={styles.notificationItem}>
                {/* ✅ show only notification title */}
                <Text style={[styles.notificationText, textColor]}>{item.title}</Text>
                {/* ✅ show formatted created_at */}
                <Text style={{ fontSize: 12, color: "gray" }}>
                  {format(new Date(item.created_at), "MMM dd, yyyy h:mm a")}
                </Text>
              </View>
            )}
          />
          <TouchableOpacity style={styles.dropdownFooter}>
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>View all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Body */}
      <View style={[styles.body, themeStyles]}>
        {/* Sidebar */}
        {sidebarOpen && (
          <View style={[styles.sidebar, isDarkMode ? styles.sidebarDark : styles.sidebarLight]}>
            {/* ✅ Wrap sidebar content in ScrollView */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              <TouchableOpacity style={styles.sidebarItem} onPress={() => { setCurrentView('dashboard'); setSelectedSubject(null); }}>
                <Ionicons name="home-outline" size={20} color={textColor.color} />
                <Text style={[styles.sidebarText, textStyles]}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('userManagement')}>
                <Ionicons name="people-outline" size={20} color={textColor.color} />
                <Text style={[styles.sidebarText, textStyles]}>User Management</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('roomManagement')}>
                <Ionicons name="school-outline" size={20} color={textColor.color} />
                <Text style={[styles.sidebarText, textStyles]}>Room Management</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('calendar')}>
                <Ionicons name="calendar-outline" size={20} color={textColor.color} />
                <Text style={[styles.sidebarText, textStyles]}>Calendar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('announcements')}>
                <Ionicons name="megaphone-outline" size={20} color={textColor.color} />
                <Text style={[styles.sidebarText, textStyles]}>Announcements</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('reports')}>
                <Ionicons name="document-text-outline" size={20} color={textColor.color} />
                <Text style={[styles.sidebarText, textStyles]}>Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('grades')}>
                <Ionicons name="bar-chart-outline" size={20} color={textColor.color} />
                <Text style={[styles.sidebarText, textStyles]}>Grades</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('messages')}>
                <Ionicons name="chatbubbles-outline" size={20} color={textColor.color} />
                <Text style={[styles.sidebarText, textStyles]}>Messages</Text>
              </TouchableOpacity>

              {/* ✅ NEW System Settings Dropdown */}
              <TouchableOpacity style={styles.sidebarItem} onPress={() => setSettingsMenuOpen(!settingsMenuOpen)}>
                <Ionicons name="settings-outline" size={20} color={textColor.color} />
                <Text style={[styles.sidebarText, textStyles]}>System Settings</Text>
                <Ionicons
                  name={settingsMenuOpen ? "chevron-up-outline" : "chevron-down-outline"}
                  size={16}
                  color={textColor.color}
                />
              </TouchableOpacity>

              {settingsMenuOpen && (
                <View style={{ marginLeft: 30 }}>
                  <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('general')}>
                    <Text style={[styles.sidebarText, textStyles]}>General Settings</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('maintenance')}>
                    <Text style={[styles.sidebarText, textStyles]}>System Maintenance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('security')}>
                    <Text style={[styles.sidebarText, textStyles]}>Security & Access</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.userContainer}>
                <Text style={styles.userLabel}>👤 Logged in as:</Text>
                <Text style={styles.userName}>
                  {userName ? userName : "Loading..."}
                </Text>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Main Content */}
        <View style={[styles.mainContent, isDarkMode ? styles.mainContentDark : styles.mainContentLight, !sidebarOpen && styles.fullWidth]}>
          {/* Dashboard */}
          {currentView === 'dashboard' && !selectedSubject && (
            <ScrollView>
              <Text style={[styles.mainText, textColor]}>Admin Dashboard</Text>

              {/* ✅ Stats container */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{totalUsers}</Text>
                  <Text style={styles.statLabel}>Users</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{totalTeachers}</Text>
                  <Text style={styles.statLabel}>Teachers</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{totalStudents}</Text>
                  <Text style={styles.statLabel}>Students</Text>
                </View>
              </View>

              {/* ✅ Announcements preview */}
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.mainText, textColor]}>Latest Announcements</Text>
                <AnnouncementList />
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
            <View style={{ flex: 20 }}>
              <Text style={[styles.mainText, textColor]}>Announcements</Text>
              <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>Create Announcements here.</Text>
              <AnnouncementForm isDarkMode={isDarkMode} />
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
            <View style={{ flex: 20 }}>
              <Text style={[styles.mainText, textColor]}>Messages</Text>
              <Messages isDarkMode={isDarkMode} />
            </View>
          )}

          {/* User Management */}
          {currentView === 'userManagement' && (
            <View style={{ flex: 20 }}>
              <Text style={[styles.mainText, textColor]}>User Management</Text>
              <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>Create and Manage users here.</Text>
              <UserForm isDarkMode={isDarkMode} />
            </View>
          )}

          {currentView === 'roomManagement' && (
            <View style={{ flex: 1 }}>
              <Text style={[styles.mainText, textColor]}>Room Management</Text>
              <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>Create and Manage rooms here.</Text>
              <RoomForm isDarkMode={isDarkMode} />
            </View>
          )}

          {/* Reports */}
          {currentView === 'reports' && (
            <View style={{ flex: 20 }}>
              <Text style={[styles.mainText, textColor]}>Reports</Text>
              <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>Generate reports here.</Text>
              <Reports isDarkMode={isDarkMode} />
            </View>
          )}

          {/* ✅ New Settings Pages */}
          {currentView === 'general' && (
            <General isDarkMode={isDarkMode} />
          )}
          {currentView === 'maintenance' && (
            <Maintenance isDarkMode={isDarkMode} />
          )}
          {currentView === 'security' && (
            <Security isDarkMode={isDarkMode} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 🔹 existing styles unchanged...
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

  // ✅ stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    marginHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  statLabel: {
    fontSize: 16,
    color: 'gray',
    marginTop: 6,
  },

  // ✅ user info
  userContainer: {
    marginTop: 70,
    marginHorizontal: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
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
    backgroundColor: "red",
    borderRadius: 12,
    paddingHorizontal: 5,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
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