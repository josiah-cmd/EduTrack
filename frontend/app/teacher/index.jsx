import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import api from "../lib/axios";
import AnnouncementForm from './AnnouncementForm';
import AnnouncementList from './AnnouncementList';
import RoomContent from "./RoomContent";
import Messages from "./messages";

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
            <View style={styles.userContainer}>
              <Text style={styles.userLabel}>👤 Logged in as:</Text>
              <Text style={styles.userName}>
                {userName ? userName : "Loading..."}
              </Text>
            </View>
          </View>
        )}

        {/* Main Content */}
        <View style={[styles.mainContent, isDarkMode ? styles.mainContentDark : styles.mainContentLight, !sidebarOpen && styles.fullWidth]}>
          {/* Dashboard */}
          {currentView === 'dashboard' && !selectedRoom && (
            <>
              <Text style={[styles.mainText, textColor]}>Teacher Dashboard</Text>
              <View style={styles.subjectsContainer}>
                {rooms.map((room, index) => (
                  <Animated.View
                    key={index}
                    style={[styles.subjectCard, hoveredIndex === index && Platform.OS === 'web' ? styles.subjectCardHover : {}]}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <TouchableOpacity onPress={() => handleRoomSelect(room)}>
                      <Text style={styles.subjectTitle}>{room.subject?.name}</Text>
                      <Text style={styles.subjectDetails}>Section: {room.section?.name}</Text>
                      <Text style={styles.subjectDetails}>Schedule: {room.day} {room.time}</Text>
                      {/* 🟢 NEW: Show Token */}
                      <Text style={[styles.subjectDetails, { fontStyle: "italic", color: "#4ade80" }]}>
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
          {currentView === 'detail' && selectedRoom && (
            <ScrollView contentContainerStyle={styles.detailContainer}>
              {/* Left side - Instructor */}
              <View style={styles.leftContainer}>
                <Image source={{ uri: selectedRoom.teacher?.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.profileImage} />
                <Text style={styles.instructorName}>{selectedRoom.teacher?.user?.name || selectedRoom.teacher?.name || 'No Name'}</Text>
                <Text style={styles.instructorSection}>Section: {selectedRoom.section?.name || 'No Section'}</Text>
                <Text style={styles.instructorSchedule}>Schedule: {selectedRoom.day} {selectedRoom.time}</Text>
                {/* 🟢 NEW: Show Token */}
                <Text style={{ color: "#4ade80", fontStyle: "italic", marginTop: 4 }}>
                  Code: {selectedRoom.token || "No Token"}
                </Text>
              </View>

              {/* Right side - Modules/Activities/Quizzes */}
              <View style={styles.rightContainer}>
                <RoomContent room={selectedRoom} /> {/* ✅ inserted here */}
              </View>
            </ScrollView>
          )}

          {/* Calendar */}
          {currentView === 'calendar' && (
            <View style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>Calendar</Text>
              <Calendar theme={{
                calendarBackground: isDarkMode ? '#000' : '#fff',
                dayTextColor: isDarkMode ? '#fff' : '#000',
                monthTextColor: isDarkMode ? '#fff' : '#000',
              }} />
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
});