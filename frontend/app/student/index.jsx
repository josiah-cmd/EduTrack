import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🟢 Added for token
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AnnouncementList from './AnnouncementList';
import RoomContent from "./RoomContent";

export default function AdminDashboard() {
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

  // 🟢 Fetch subjects & student rooms
  useEffect(() => {
    axios
      .get('http://localhost:8000/api/subjects')
      .then((response) => setSubjects(response.data))
      .catch((error) => console.error('Error fetching subjects:', error));

    const fetchRooms = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        const res = await axios.get("http://localhost:8000/api/student/rooms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(res.data || []);
      } catch (err) {
        console.error("❌ Error fetching student rooms:", err.response?.data || err.message);
      }
    };

    fetchRooms();
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

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setCurrentView('detail');
  };

  // 🟢 Join Room logic
  const handleJoinRoom = async () => {
    if (!joinToken.trim()) {
      setJoinMessage('⚠️ Please enter a token');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setJoinMessage('⚠️ No auth token found. Please login again.');
        return;
      }
      const res = await axios.post(
        'http://localhost:8000/api/rooms/join',
        { token: joinToken.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
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
          <TouchableOpacity onPress={toggleProfileModal}>
            <Ionicons name="person-circle-outline" size={30} color={textColor.color} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out-outline" size={30} color={textColor.color} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Modal */}
      <Modal transparent visible={profileModalVisible} animationType="fade" onRequestClose={toggleProfileModal}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#111' : '#fff' }]}>
            <Text style={[styles.modalText, textColor]}>Profile Management</Text>
            <TouchableOpacity style={styles.modalButton} onPress={toggleProfileModal}>
              <Text style={{ color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
            <TouchableOpacity onPress={handleJoinRoom} style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Join Room</Text>
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
          </View>
        )}

        {/* Main Content */}
        <View style={[styles.mainContent, isDarkMode ? styles.mainContentDark : styles.mainContentLight, !sidebarOpen && styles.fullWidth]}>
          {/* Dashboard */}
          {currentView === 'dashboard' && !selectedSubject && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.mainText, textColor]}>Student Dashboard</Text>
                <TouchableOpacity onPress={() => setJoinModalVisible(true)} style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>Join Room</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.subjectsContainer}>
                {rooms.map((room, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.subjectCard,
                      { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }, // 🟢 adaptive color
                      hoveredIndex === index && Platform.OS === 'web' ? styles.subjectCardHover : {},
                    ]}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <TouchableOpacity onPress={() => handleRoomSelect(room)}>
                      <Text style={[styles.subjectTitle, { color: isDarkMode ? '#fff' : '#111' }]}>{room.subject?.name}</Text>
                      <Text style={[styles.subjectDetails, { color: isDarkMode ? '#ccc' : '#333' }]}>Section: {room.section?.name}</Text>
                      <Text style={[styles.subjectDetails, { color: isDarkMode ? '#ccc' : '#333' }]}>Schedule: {room.day} {room.time}</Text>
                      <Text style={{ fontStyle: "italic", color: "#4ade80" }}>
                        Code: {room.token || "No Token"}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </>
          )}

          {/* Subject Detail */}
          {currentView === 'detail' && selectedRoom && (
            <ScrollView contentContainerStyle={styles.detailContainer}>
              <View style={styles.leftContainer}>
                <Image source={{ uri: selectedRoom.teacher?.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }} style={styles.profileImage} />
                <Text style={styles.instructorName}>{selectedRoom.teacher?.user?.name || selectedRoom.teacher?.name || 'No Name'}</Text>
                <Text style={styles.instructorSection}>Section: {selectedRoom.section?.name || 'No Section'}</Text>
                <Text style={styles.instructorSchedule}>Schedule: {selectedRoom.day} {selectedRoom.time}</Text>
                <Text style={{ color: "#4ade80", fontStyle: "italic", marginTop: 4 }}>
                  Code: {selectedRoom.token || "No Token"}
                </Text>
              </View>
              <View style={styles.rightContainer}>
                <RoomContent room={selectedRoom} /> {/* ✅ inserted here */}
              </View>
            </ScrollView>
          )}

          {/* Calendar */}
          {currentView === 'calendar' && (
            <View style={{ padding: 20 }}>
              <Text style={[styles.mainText, textColor]}>Calendar</Text>
              <View style={styles.calendarBox}>
                <Calendar
                  firstDay={0}
                  theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    textSectionTitleColor: isDarkMode ? '#bbb' : '#2563eb',
                    dayTextColor: isDarkMode ? '#fff' : '#000',
                    todayBackgroundColor: isDarkMode ? '#fdf5d4' : '#fffbe6',
                    arrowColor: '#2563eb',
                    monthTextColor: isDarkMode ? '#fff' : '#000',
                    textDayFontSize: 14,
                    textMonthFontSize: 20,
                  }}
                  disableAllTouchEventsForDisabledDays={true}
                  dayComponent={({ date, state }) => {
                    const isToday = date.dateString === new Date().toISOString().split('T')[0];
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
                            color: state === 'disabled' ? (isDarkMode ? '#555' : '#ccc') : (isDarkMode ? '#fff' : '#000'),
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
              <AnnouncementList />
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
              <Text style={{ color: isDarkMode ? '#aaa' : '#333' }}>No messages yet</Text>
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
  brandText: {
    fontSize: 25,
    fontWeight: '700'
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
    backgroundColor: '#1a1a1a',
    borderColor: '#333333'
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
    fontSize: 20
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20
  },
  mainContentDark: {
    backgroundColor: '#000000'
  },
  mainContentLight: {
    backgroundColor: '#ffffff'
  },
  fullWidth: { 
    width: '100%' 
  },
  mainText: { 
    fontSize: 25, 
    marginBottom: 12 
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
    alignItems: 'center' },
  modalText: { 
    fontSize: 18, 
    marginBottom: 16 
  },
  modalButton: { 
    backgroundColor: '#2563eb', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    marginTop: 10 },
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
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 6,
  },
  subjectDetails: {
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
    width: 280,
    alignItems: 'center',
    padding: 20,
    borderRightWidth: 1,
    borderColor: '#333',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  instructorName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  instructorSection: {
    fontSize: 16,
    color: '#bbb',
    marginBottom: 2,
  },
  instructorSchedule: {
    fontSize: 15,
    color: '#bbb',
  },
  rightContainer: {
    flex: 1,
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
    fontWeight: '600',
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
});