import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../lib/axios";
import AssignmentDetail from "./AssignmentDetail";

export default function RoomContent({ room, openMaterial, onOpenConsumed }) { // ✅ prop name aligned
    const [activeTab, setActiveTab] = useState("modules");
    const [materials, setMaterials] = useState([]);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const consumedRef = useRef(false); // ensure we consume only once

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

    // ✅ If a notification asked us to open a specific material, switch to the right tab
    useEffect(() => {
        if (openMaterial && room) {
            if (openMaterial.type === "assignment") setActiveTab("assignments");
            else if (openMaterial.type === "quiz") setActiveTab("quizzes");
            else setActiveTab("modules");
            // Reset consumedRef when new openMaterial arrives
            consumedRef.current = false;
        }
    }, [openMaterial, room]);

    // ✅ After materials are loaded, try to auto-open the target (only once)
    useEffect(() => {
        if (openMaterial && materials.length > 0 && !consumedRef.current) {
            const found = materials.find((m) => String(m.id) === String(openMaterial.id));
            if (found) {
                setSelectedMaterial(found);
                consumedRef.current = true;
                // Tell the parent dashboard we used the notification so it won't trigger again
                if (typeof onOpenConsumed === "function") {
                    onOpenConsumed();
                }
            }
        }
    }, [openMaterial, materials]);

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                {["modules", "assignments", "quizzes"].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => {
                            setActiveTab(tab);
                            setSelectedMaterial(null);
                        }}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Main content: list OR detail */}
            {selectedMaterial ? (
                <AssignmentDetail
                    material={selectedMaterial}
                    onBack={() => setSelectedMaterial(null)}
                    room={room}
                />
            ) : (
                <FlatList
                    data={materials}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setSelectedMaterial(item)}
                            style={styles.fileCard}
                        >
                            <Text style={styles.fileTitle}>{item.title}</Text>
                            <Text style={styles.fileDesc}>{item.description}</Text>
                            {item.deadline && (
                                <Text style={styles.deadline}>
                                    ⏳ Deadline: {format(new Date(item.deadline), "MMM dd, yyyy h:mm a")}
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