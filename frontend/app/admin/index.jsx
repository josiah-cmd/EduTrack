import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AnnouncementForm from './AnnouncementForm';
import AnnouncementList from './AnnouncementList'; // ✅ added import
import Reports from './Reports';
import RoomForm from './RoomForm';
import UserForm from './UserForm';

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

  // ✅ fetch counts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await AsyncStorage.getItem("token"); // ✅ get saved token
        if (!token) {
          console.warn("No token found");
          return;
        }

        const res = await axios.get("http://localhost:8000/api/stats", {
          headers: { Authorization: `Bearer ${token}` }, // ✅ send token
        });

        setTotalUsers(res.data.totalUsers);
        setTotalTeachers(res.data.totalTeachers);
        setTotalStudents(res.data.totalStudents);
      } catch (err) {
        console.error("Error fetching stats:", err.response?.data || err.message);
      }
    };

    fetchStats();
  }, []);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const logout = () => router.replace('/');

  const themeStyles = isDarkMode ? styles.dark : styles.light;
  const textColor = { color: isDarkMode ? '#fff' : '#000' };
  const textStyles = isDarkMode ? styles.textLight : styles.textDark;

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
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={30} color={textColor.color} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleDarkMode}>
            <Ionicons name={isDarkMode ? 'sunny-outline' : 'moon-outline'} size={30} color={textColor.color} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out-outline" size={30} color={textColor.color} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      <View style={[styles.body, themeStyles]}>
        {/* Sidebar */}
        {sidebarOpen && (
          <View style={[styles.sidebar, isDarkMode ? styles.sidebarDark : styles.sidebarLight]}>
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

            <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('settings')}>
              <Ionicons name="settings-outline" size={20} color={textColor.color} />
              <Text style={[styles.sidebarText, textStyles]}>System Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarItem} onPress={() => setCurrentView('maintenance')}>
              <Ionicons name="build-outline" size={20} color={textColor.color} />
              <Text style={[styles.sidebarText, textStyles]}>Maintenance</Text>
            </TouchableOpacity>
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
                <Calendar
                  firstDay={0}
                  theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    textSectionTitleColor: isDarkMode ? '#bbb' : '#2563eb',
                    textSectionTitleDisabledColor: isDarkMode ? '#555' : '#999',
                    dayTextColor: isDarkMode ? '#fff' : '#000',
                    todayTextColor: isDarkMode ? '#000' : '#000',
                    todayBackgroundColor: isDarkMode ? '#fdf5d4' : '#fffbe6',
                    arrowColor: '#2563eb',
                    monthTextColor: isDarkMode ? '#fff' : '#000',
                    textDayFontSize: 14,
                    textMonthFontSize: 20,
                    textDayHeaderFontSize: 14,
                    'stylesheet.calendar.header': {
                      header: {
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                        paddingHorizontal: 10,
                      },
                      monthText: {
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: isDarkMode ? '#fff' : '#000',
                      },
                    },
                  }}
                  disableAllTouchEventsForDisabledDays={true}
                  dayComponent={({ date, state }) => {
                    const isToday =
                      date.dateString === new Date().toISOString().split('T')[0];
                    return (
                      <View
                        style={{
                          width: 46,
                          height: 46,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1,
                          borderColor: isDarkMode ? '#333' : '#ddd',
                          backgroundColor: isToday
                            ? isDarkMode
                              ? '#fdf5d4'
                              : '#fffbe6'
                            : isDarkMode
                              ? '#1a1a1a'
                              : '#fff',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: isToday ? 'bold' : 'normal',
                            color:
                              state === 'disabled'
                                ? isDarkMode
                                  ? '#555'
                                  : '#ccc'
                                : isDarkMode
                                  ? '#fff'
                                  : '#000',
                          }}
                        >
                          {date.day}
                        </Text>
                      </View>
                    );
                  }}
                />
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

          {/* System Settings */}
          {currentView === 'settings' && (
            <View style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>System Settings</Text>
              <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>Adjust system settings here.</Text>
            </View>
          )}

          {/* Maintenance */}
          {currentView === 'maintenance' && (
            <View style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>Maintenance</Text>
              <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>Perform maintenance tasks here.</Text>
            </View>
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

  // ✅ new styles for stats
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
});