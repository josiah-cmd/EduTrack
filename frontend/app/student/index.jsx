import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🟢 Added for token
import { format } from "date-fns";
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import api from "../lib/axios";
import AnnouncementList from './AnnouncementList';
import Messages from "./messages";
import NotificationList from './NotificationList';
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

  // ✅ helper to remove <p>, <br>, <b>, etc.
  const stripHtml = (html) => {
    if (!html) return "No content";
    const text = html.replace(/<\/?[^>]+(>|$)/g, "").trim();
    return text.length > 0 ? text : "No content";
  };

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
    // clear any stale notification target when user manually opens a room
    setNotificationTarget(null);
  };

  // 🟢 Handle notification click → updated logic
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
          {/* ✅ Notification Bell */}
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
                {/* 🟢 Pass openMaterial directly and a callback to clear it once consumed */}
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
              <View style={styles.calendarBox}>
                <Calendar
                  firstDay={0}
                  theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    textSectionTitleColor: isDarkMode ? '#bbb' : '#2563eb',
                    dayTextColor: isDarkMode ? '#fff' : '#000',
                    monthTextColor: isDarkMode ? '#fff' : '#000',
                    todayTextColor: '#2563eb',
                    arrowColor: '#2563eb',
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
              <Text style={{ color: textColor.color }}>Your grades will appear here.</Text>
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
                  }
                }}
                onOpenMessages={() => setCurrentView("messages")}
                onOpenAnnouncements={() => setCurrentView("announcements")}
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
  // ✅ new styles for logged-in user
  userContainer: {
    marginTop: 340,
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