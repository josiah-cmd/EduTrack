import { format } from "date-fns";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../lib/axios";
import AssignmentDetail from "./AssignmentDetail";

export default function RoomContent({ room }) {
    const [activeTab, setActiveTab] = useState("modules");
    const [materials, setMaterials] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null); // ✅ works for both modules + assignments

    // ✅ Fetch materials
    const fetchMaterials = async () => {
        if (!room) return;
        try {
            const typeParam =
                activeTab === "modules"
                    ? "module"
                    : activeTab === "assignments"
                        ? "assignment"
                        : "quiz";

            const res = await api.get("/materials", {
                params: { type: typeParam, room_id: room.id },
            });

            console.log("Fetched materials:", res.data);
            setMaterials(res.data);
        } catch (err) {
            console.error("❌ Error fetching materials:", err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, [activeTab, room]);

    // ✅ If material selected → show AssignmentDetail
    if (selectedMaterial) {
        return (
            <AssignmentDetail
                material={selectedMaterial}
                onBack={() => setSelectedMaterial(null)}
                room={room}
            />
        );
    }

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                {["modules", "assignments", "quizzes"].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Materials list */}
            <FlatList
                data={materials}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setSelectedMaterial(item)} // ✅ open detail for both modules + assignments
                        style={styles.fileCard}
                    >
                        <Text style={styles.fileTitle}>{item.title}</Text>
                        <Text style={styles.fileDesc}>{item.description}</Text>
                        {item.deadline && (
                            <Text style={styles.deadline}>⏳ Deadline: {format(new Date(item.deadline), "MMM dd, yyyy h:mm a")}</Text>
                        )}
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 12 
  },
  
  /* Tabs */
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

  /* Materials list */
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
