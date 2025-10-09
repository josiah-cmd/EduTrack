import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../lib/axios";
import AssignmentDetail from "./AssignmentDetail";
import QuizList from "./quizzes/QuizList"; // ✅ ADDED this import (kept your structure)
import QuizResult from "./quizzes/QuizResult"; // ✅ ADDED import for result display
import QuizTake from "./quizzes/QuizTake"; // ✅ make sure this import exists in your project

if (typeof window !== "undefined") {
  window.onQuizSubmitSuccess = (data) => {
    if (window._roomContentSetView && window._roomContentSetResult) {
      window._roomContentSetResult(data);
      window._roomContentSetView("result");
    }
  };
}

export default function RoomContent({ room, openMaterial, onOpenConsumed, isDarkMode }) {
  const [activeTab, setActiveTab] = useState("modules");
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const consumedRef = useRef(false);

  // ✅ NEW STATES for showing quiz result directly inside RoomContent
  const [view, setView] = useState("default"); // "default" | "result"
  const [quizResultProps, setQuizResultProps] = useState(null);

  // ✅ make functions globally accessible to QuizTake.jsx
    useEffect(() => {
    if (typeof window !== "undefined") {
        window._roomContentSetView = setView;
        window._roomContentSetResult = setQuizResultProps;
    }
    return () => {
        if (typeof window !== "undefined") {
        window._roomContentSetView = null;
        window._roomContentSetResult = null;
        }
    };
    }, []);

  const fetchMaterials = async () => {
    if (!room) return;

    try {
      let res;

      if (activeTab === "quizzes") {
        // ✅ Fetch quizzes separately (from StudentQuizController)
        res = await api.get("/student/quizzes", {
          params: { room_id: room.id },
        });
      } else {
        // ✅ Keep fetching materials for modules and assignments
        const typeParam =
          activeTab === "modules"
            ? "module"
            : activeTab === "assignments"
            ? "assignment"
            : "quiz";

        res = await api.get("/materials", {
          params: { type: typeParam, room_id: room.id },
        });
      }

      console.log(`Fetched ${activeTab}:`, res.data);
      setMaterials(res.data);
    } catch (err) {
      console.error(
        `❌ Error fetching ${activeTab}:`,
        err.response?.data || err.message
      );
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [activeTab, room]);

  useEffect(() => {
    if (openMaterial && room) {
      if (openMaterial.type === "assignment") setActiveTab("assignments");
      else if (openMaterial.type === "quiz") setActiveTab("quizzes");
      else setActiveTab("modules");
      consumedRef.current = false;
    }
  }, [openMaterial, room]);

  useEffect(() => {
    if (openMaterial && materials.length > 0 && !consumedRef.current) {
      const found = materials.find((m) => String(m.id) === String(openMaterial.id));
      if (found) {
        setSelectedMaterial(found);
        consumedRef.current = true;
        if (typeof onOpenConsumed === "function") {
          onOpenConsumed();
        }
      }
    }
  }, [openMaterial, materials]);

  // ✅ NEW FUNCTION - when quiz submits successfully
  const handleQuizSubmit = (attemptId, quizId, score, total, percentage) => {
    setQuizResultProps({ attemptId, quizId, score, total, percentage });
    setView("result");
  };

  // ✅ LISTEN to global event from QuizTake (since QuizTake cannot directly access RoomContent props)
  useEffect(() => {
    window.onQuizSubmitSuccess = (data) => {
      setQuizResultProps(data);
      setView("result");
    };
    return () => {
      delete window.onQuizSubmitSuccess;
    };
  }, []);

  // ✅ CONDITIONAL RENDER
    if (view === "result" && quizResultProps) {
    return (
        <QuizResult
        {...quizResultProps}
        onBack={() => {
            setView("default");
            setQuizResultProps(null);
        }}
        />
    );
    }

  return (
    <View style={[styles.container]}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["modules", "assignments", "quizzes"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              setActiveTab(tab);
              setSelectedMaterial(null);
            }}
            style={[
              styles.tab,
              { backgroundColor: isDarkMode ? "#333333" : "#ccc" },
              activeTab === tab && {
                backgroundColor: isDarkMode ? "#228B22" : "#006400",
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: isDarkMode ? "#f0f0f0" : "#333" },
                activeTab === tab && { color: "#FFD700" },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main content */}
      {selectedMaterial ? (
        selectedMaterial.type === "quiz" ? (
          <QuizTake
            quiz={selectedMaterial}
            onBack={() => setSelectedMaterial(null)}
            room={room}
            isDarkMode={isDarkMode}

            // ✅ ADD THIS CALLBACK
            onSubmitSuccess={(data) => {
              setQuizResultProps(data);
              setView("result");
            }}
          />
        ) : (
          <AssignmentDetail
            material={selectedMaterial}
            onBack={() => setSelectedMaterial(null)}
            room={room}
            isDarkMode={isDarkMode}
          />
        )
      ) : activeTab === "quizzes" ? (
        // ✅ When quizzes tab is active, show your QuizList design
        <QuizList />
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedMaterial(item)}
              style={[
                styles.fileCard,
                {
                  backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                  borderColor: isDarkMode ? "#444" : "#ddd",
                },
              ]}
            >
              <Text
                style={[
                  styles.fileTitle,
                  { color: isDarkMode ? "#fff" : "#000" },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.fileDesc,
                  { color: isDarkMode ? "#ccc" : "#555" },
                ]}
              >
                {item.description}
              </Text>
              {item.deadline && (
                <Text style={[styles.deadline, { color: "#B22222" }]}>
                  ⏳ Deadline:{" "}
                  {format(new Date(item.deadline), "MMM dd, yyyy h:mm a")}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
container: {
flex: 1,
padding: 12
},

tabContainer: {
flexDirection: "row",
marginBottom: 15
},
tab: {
flex: 1,
paddingVertical: 10,
marginHorizontal: 5,
borderRadius: 20,
backgroundColor: "#ccc",
},
activeTab: {
backgroundColor: "#007bff"
},
tabText: {
textAlign: "center",
fontWeight: "600",
color: "#333"
},
activeTabText: {
color: "#fff"
},

fileCard: {
padding: 15,
marginBottom: 10,
borderRadius: 8,
backgroundColor: "#fff",
borderWidth: 1,
borderColor: "#ddd",
shadowColor: "#000",
shadowOpacity: 0.05,
shadowOffset: { width: 0, height: 2 },
shadowRadius: 4,
},
fileTitle: {
fontSize: 16,
fontWeight: "bold",
marginBottom: 3
},
fileDesc: {
color: "#555"
},
deadline: {
color: "red",
fontWeight: "600",
marginTop: 4
},
});