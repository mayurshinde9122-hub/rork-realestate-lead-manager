import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, Plus, Edit3 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_PROJECTS = ['Skyline Towers', 'Green Valley', 'Plaza Residency', 'Marina Bay', 'Urban Heights'];
const DEFAULT_AREAS = ['Downtown', 'Suburb', 'City Center', 'Waterfront', 'Uptown'];

export default function ManageOptionsScreen() {
  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [customProjects, setCustomProjects] = useState<string[]>([]);
  const [showAddAreaModal, setShowAddAreaModal] = useState<boolean>(false);
  const [showAddProjectModal, setShowAddProjectModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editType, setEditType] = useState<'area' | 'project'>('area');
  const [editIndex, setEditIndex] = useState<number>(-1);
  const [editText, setEditText] = useState<string>('');
  const [newText, setNewText] = useState<string>('');

  useEffect(() => {
    loadCustomOptions();
  }, []);

  const loadCustomOptions = async () => {
    try {
      const areasJson = await AsyncStorage.getItem('customAreas');
      const projectsJson = await AsyncStorage.getItem('customProjects');
      if (areasJson) setCustomAreas(JSON.parse(areasJson));
      if (projectsJson) setCustomProjects(JSON.parse(projectsJson));
    } catch (error) {
      console.error('Error loading custom options:', error);
    }
  };

  const addArea = async () => {
    const trimmed = newText.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter an area name');
      return;
    }
    const allAreas = [...DEFAULT_AREAS, ...customAreas];
    if (allAreas.includes(trimmed)) {
      Alert.alert('Error', 'This area already exists');
      return;
    }
    const updated = [...customAreas, trimmed];
    setCustomAreas(updated);
    await AsyncStorage.setItem('customAreas', JSON.stringify(updated));
    setNewText('');
    setShowAddAreaModal(false);
    Alert.alert('Success', 'Area added successfully');
  };

  const addProject = async () => {
    const trimmed = newText.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a project name');
      return;
    }
    const allProjects = [...DEFAULT_PROJECTS, ...customProjects];
    if (allProjects.includes(trimmed)) {
      Alert.alert('Error', 'This project already exists');
      return;
    }
    const updated = [...customProjects, trimmed];
    setCustomProjects(updated);
    await AsyncStorage.setItem('customProjects', JSON.stringify(updated));
    setNewText('');
    setShowAddProjectModal(false);
    Alert.alert('Success', 'Project added successfully');
  };

  const deleteArea = async (index: number) => {
    Alert.alert(
      'Delete Area',
      `Are you sure you want to delete "${customAreas[index]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = customAreas.filter((_, i) => i !== index);
            setCustomAreas(updated);
            await AsyncStorage.setItem('customAreas', JSON.stringify(updated));
          },
        },
      ]
    );
  };

  const deleteProject = async (index: number) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${customProjects[index]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = customProjects.filter((_, i) => i !== index);
            setCustomProjects(updated);
            await AsyncStorage.setItem('customProjects', JSON.stringify(updated));
          },
        },
      ]
    );
  };

  const startEdit = (type: 'area' | 'project', index: number, currentValue: string) => {
    setEditType(type);
    setEditIndex(index);
    setEditText(currentValue);
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (editType === 'area') {
      const allAreas = [...DEFAULT_AREAS, ...customAreas.filter((_, i) => i !== editIndex)];
      if (allAreas.includes(trimmed)) {
        Alert.alert('Error', 'This area already exists');
        return;
      }
      const updated = [...customAreas];
      updated[editIndex] = trimmed;
      setCustomAreas(updated);
      await AsyncStorage.setItem('customAreas', JSON.stringify(updated));
    } else {
      const allProjects = [...DEFAULT_PROJECTS, ...customProjects.filter((_, i) => i !== editIndex)];
      if (allProjects.includes(trimmed)) {
        Alert.alert('Error', 'This project already exists');
        return;
      }
      const updated = [...customProjects];
      updated[editIndex] = trimmed;
      setCustomProjects(updated);
      await AsyncStorage.setItem('customProjects', JSON.stringify(updated));
    }

    setShowEditModal(false);
    setEditText('');
    Alert.alert('Success', 'Updated successfully');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Interested Areas</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddAreaModal(true)}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Default Areas</Text>
            <View style={styles.itemsList}>
              {DEFAULT_AREAS.map((area) => (
                <View key={area} style={[styles.item, styles.defaultItem]}>
                  <Text style={styles.itemText}>{area}</Text>
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {customAreas.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Custom Areas</Text>
              <View style={styles.itemsList}>
                {customAreas.map((area, index) => (
                  <View key={index} style={styles.item}>
                    <Text style={styles.itemText}>{area}</Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => startEdit('area', index, area)}
                      >
                        <Edit3 size={18} color="#4a90e2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => deleteArea(index)}
                      >
                        <Trash2 size={18} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Interested Projects</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddProjectModal(true)}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Default Projects</Text>
            <View style={styles.itemsList}>
              {DEFAULT_PROJECTS.map((project) => (
                <View key={project} style={[styles.item, styles.defaultItem]}>
                  <Text style={styles.itemText}>{project}</Text>
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {customProjects.length > 0 && (
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>Custom Projects</Text>
              <View style={styles.itemsList}>
                {customProjects.map((project, index) => (
                  <View key={index} style={styles.item}>
                    <Text style={styles.itemText}>{project}</Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => startEdit('project', index, project)}
                      >
                        <Edit3 size={18} color="#4a90e2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => deleteProject(index)}
                      >
                        <Trash2 size={18} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showAddAreaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Area</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter area name"
              placeholderTextColor="#666"
              value={newText}
              onChangeText={setNewText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddAreaModal(false);
                  setNewText('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={addArea}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddProjectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Project</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter project name"
              placeholderTextColor="#666"
              value={newText}
              onChangeText={setNewText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddProjectModal(false);
                  setNewText('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={addProject}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {editType === 'area' ? 'Area' : 'Project'}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`Enter ${editType} name`}
              placeholderTextColor="#666"
              value={editText}
              onChangeText={setEditText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditText('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveEdit}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#888',
    marginBottom: 12,
  },
  itemsList: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  defaultItem: {
    opacity: 0.7,
  },
  itemText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600' as const,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#2a2a3e',
  },
  modalButtonSave: {
    backgroundColor: '#4a90e2',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});