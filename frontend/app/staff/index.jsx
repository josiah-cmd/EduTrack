  import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AnnouncementForm from './AnnouncementForm';
import RoomForm from './RoomForm';
import UserForm from './UserForm';

  export default function AdminDashboard() {
    const router = useRouter();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [subjects, setSubjects] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [currentView, setCurrentView] = useState('dashboard');

    useEffect(() => {
      axios
        .get('http://localhost:8000/api/subjects')
        .then((response) => setSubjects(response.data))
        .catch((error) => console.error('Error fetching subjects:', error));
    }, []);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const toggleProfileModal = () => setProfileModalVisible(!profileModalVisible);
    const logout = () => router.replace('/');

    const themeStyles = isDarkMode ? styles.dark : styles.light;
    const textColor = { color: isDarkMode ? '#fff' : '#000' };
    const textStyles = isDarkMode ? styles.textLight : styles.textDark;

    const handleSubjectSelect = (subject) => {
      setSelectedSubject(subject);
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
              <>
                <Text style={[styles.mainText, textColor]}>Staff Dashboard</Text>
              </>
            )}

            {/* Subject Detail */}
            {currentView === 'detail' && selectedSubject && (
              <ScrollView contentContainerStyle={styles.detailContainer}>
                <View style={styles.leftContainer}>
                  <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.profileImage} />
                  <Text style={styles.instructorName}>{selectedSubject.faculty}</Text>
                </View>
                <View style={styles.rightContainer}>
                  <TouchableOpacity style={styles.dropdown}><Text style={styles.dropdownText}>Quiz</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.dropdown}><Text style={styles.dropdownText}>Activities / Assignments</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.dropdown}><Text style={styles.dropdownText}>Materials / Modules</Text></TouchableOpacity>
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
              <View style={{ padding: 20 }}>
                <Text style={[styles.mainText, textColor]}>Announcements</Text>
                <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>Create Announcements here.</Text>
                <AnnouncementForm />
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
              <View style={{ padding: 20 }}>
                <Text style={[styles.mainText, textColor]}>User Management</Text>
                <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>Create and Manage users here.</Text>
                <UserForm />
              </View>
            )}

            {/* Room Management */}
            {currentView === 'roomManagement' && (
              <View style={{ padding: 20 }}>
                <Text style={[styles.mainText, textColor]}>Room Management</Text>
                <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>Create and Manage rooms here.</Text>
                <RoomForm />
              </View>
            )}

            {/* Reports */}
            {currentView === 'reports' && (
              <View style={{ padding: 20 }}>
                <Text style={[styles.mainText, textColor]}>Reports</Text>
                <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>Generate reports here.</Text>
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
    modalBackdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
      width: 300,
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalText: {
      fontSize: 18,
      marginBottom: 16,
    },
    modalButton: {
      backgroundColor: '#333333',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
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
    rightContainer: {
      flex: 1,
      gap: 12,
    },
    dropdown: {
      backgroundColor: '#2563eb',
      padding: 16,
      borderRadius: 10,
    },
    dropdownText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },
  });