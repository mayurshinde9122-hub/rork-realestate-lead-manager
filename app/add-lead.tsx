import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { trpc } from '@/lib/trpc';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOURCES = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Walk-in', 'Other'];
const DEFAULT_PROJECTS = ['Skyline Towers', 'Green Valley', 'Plaza Residency', 'Marina Bay', 'Urban Heights'];
const DEFAULT_AREAS = ['Downtown', 'Suburb', 'City Center', 'Waterfront', 'Uptown'];

export default function AddEditLeadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const leadId = params.id as string | undefined;

  const { data: existingLead } = trpc.leads.getById.useQuery(
    { id: leadId! },
    { enabled: !!leadId }
  );

  const [clientName, setClientName] = useState<string>('');
  const [contactNumber, setContactNumber] = useState<string>('');
  const [source, setSource] = useState<string>('Website');
  const [interestedAreas, setInterestedAreas] = useState<string[]>([]);
  const [interestedProjects, setInterestedProjects] = useState<string[]>([]);
  const [ownership, setOwnership] = useState<'self' | 'investment'>('self');
  const [furnishing, setFurnishing] = useState<'unfurnished' | 'semi' | 'fully'>('unfurnished');

  const [customAreas, setCustomAreas] = useState<string[]>([]);
  const [customProjects, setCustomProjects] = useState<string[]>([]);
  const [showAreaModal, setShowAreaModal] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [newAreaText, setNewAreaText] = useState<string>('');
  const [newProjectText, setNewProjectText] = useState<string>('');

  useEffect(() => {
    loadCustomOptions();
  }, []);

  useEffect(() => {
    if (existingLead) {
      setClientName(existingLead.clientName);
      setContactNumber(existingLead.contactNumber);
      setSource(existingLead.source);
      setInterestedAreas(existingLead.interestedAreas);
      setInterestedProjects(existingLead.interestedProjects);
      setOwnership(existingLead.ownership);
      setFurnishing(existingLead.furnishing);
    }
  }, [existingLead]);

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

  const saveCustomArea = async () => {
    const trimmed = newAreaText.trim();
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
    setInterestedAreas([...interestedAreas, trimmed]);
    setNewAreaText('');
    setShowAreaModal(false);
  };

  const saveCustomProject = async () => {
    const trimmed = newProjectText.trim();
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
    setInterestedProjects([...interestedProjects, trimmed]);
    setNewProjectText('');
    setShowProjectModal(false);
  };

  const createMutation = trpc.leads.create.useMutation();
  const updateMutation = trpc.leads.update.useMutation();
  const queryClient = trpc.useUtils();

  const toggleArea = (area: string) => {
    setInterestedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const toggleProject = (project: string) => {
    setInterestedProjects((prev) =>
      prev.includes(project) ? prev.filter((p) => p !== project) : [...prev, project]
    );
  };

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      Alert.alert('Error', 'Client name is required');
      return;
    }

    if (!contactNumber.trim()) {
      Alert.alert('Error', 'Contact number is required');
      return;
    }

    if (interestedAreas.length === 0) {
      Alert.alert('Error', 'Please select at least one interested area');
      return;
    }

    if (interestedProjects.length === 0) {
      Alert.alert('Error', 'Please select at least one interested project');
      return;
    }

    try {
      if (leadId) {
        await updateMutation.mutateAsync({
          id: leadId,
          clientName,
          contactNumber,
          source,
          interestedAreas,
          interestedProjects,
          ownership,
          furnishing,
        });
      } else {
        await createMutation.mutateAsync({
          clientName,
          contactNumber,
          source,
          interestedAreas,
          interestedProjects,
          ownership,
          furnishing,
        });
      }

      queryClient.leads.getAll.invalidate();
      Alert.alert('Success', `Lead ${leadId ? 'updated' : 'created'} successfully`);
      router.back();
    } catch (error) {
      console.error('Error saving lead:', error);
      Alert.alert('Error', 'Failed to save lead. Please try again.');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const allAreas = [...DEFAULT_AREAS, ...customAreas];
  const allProjects = [...DEFAULT_PROJECTS, ...customProjects];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>
              Client Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter client name"
              placeholderTextColor="#666"
              value={clientName}
              onChangeText={setClientName}
              editable={!isLoading}
              testID="client-name-input"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Contact Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#666"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              editable={!isLoading}
              testID="contact-number-input"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Source</Text>
            <View style={styles.chipContainer}>
              {SOURCES.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, source === s && styles.chipActive]}
                  onPress={() => setSource(s)}
                  disabled={isLoading}
                >
                  <Text style={[styles.chipText, source === s && styles.chipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Interested Areas <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipContainer}>
              {allAreas.map((area) => (
                <TouchableOpacity
                  key={area}
                  style={[styles.chip, interestedAreas.includes(area) && styles.chipActive]}
                  onPress={() => toggleArea(area)}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.chipText,
                      interestedAreas.includes(area) && styles.chipTextActive,
                    ]}
                  >
                    {area}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.chip, styles.otherChip]}
                onPress={() => setShowAreaModal(true)}
                disabled={isLoading}
              >
                <Text style={[styles.chipText, styles.otherChipText]}>+ Other</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>
              Interested Projects <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chipContainer}>
              {allProjects.map((project) => (
                <TouchableOpacity
                  key={project}
                  style={[
                    styles.chip,
                    interestedProjects.includes(project) && styles.chipActive,
                  ]}
                  onPress={() => toggleProject(project)}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.chipText,
                      interestedProjects.includes(project) && styles.chipTextActive,
                    ]}
                  >
                    {project}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.chip, styles.otherChip]}
                onPress={() => setShowProjectModal(true)}
                disabled={isLoading}
              >
                <Text style={[styles.chipText, styles.otherChipText]}>+ Other</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Ownership</Text>
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[styles.segment, ownership === 'self' && styles.segmentActive]}
                onPress={() => setOwnership('self')}
                disabled={isLoading}
              >
                <Text
                  style={[styles.segmentText, ownership === 'self' && styles.segmentTextActive]}
                >
                  Self
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, ownership === 'investment' && styles.segmentActive]}
                onPress={() => setOwnership('investment')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.segmentText,
                    ownership === 'investment' && styles.segmentTextActive,
                  ]}
                >
                  Investment
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Furnishing</Text>
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[styles.segment, furnishing === 'unfurnished' && styles.segmentActive]}
                onPress={() => setFurnishing('unfurnished')}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.segmentText,
                    furnishing === 'unfurnished' && styles.segmentTextActive,
                  ]}
                >
                  Unfurnished
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, furnishing === 'semi' && styles.segmentActive]}
                onPress={() => setFurnishing('semi')}
                disabled={isLoading}
              >
                <Text
                  style={[styles.segmentText, furnishing === 'semi' && styles.segmentTextActive]}
                >
                  Semi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, furnishing === 'fully' && styles.segmentActive]}
                onPress={() => setFurnishing('fully')}
                disabled={isLoading}
              >
                <Text
                  style={[styles.segmentText, furnishing === 'fully' && styles.segmentTextActive]}
                >
                  Fully
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            testID="submit-button"
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Saving...' : leadId ? 'Update Lead' : 'Create Lead'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showAreaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Area</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter area name"
              placeholderTextColor="#666"
              value={newAreaText}
              onChangeText={setNewAreaText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAreaModal(false);
                  setNewAreaText('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveCustomArea}
              >
                <Text style={styles.modalButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showProjectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Project</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter project name"
              placeholderTextColor="#666"
              value={newProjectText}
              onChangeText={setNewProjectText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowProjectModal(false);
                  setNewProjectText('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={saveCustomProject}
              >
                <Text style={styles.modalButtonText}>Add</Text>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  chipActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  chipText: {
    fontSize: 14,
    color: '#888',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: '#4a90e2',
  },
  segmentText: {
    fontSize: 14,
    color: '#888',
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  otherChip: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#4a90e2',
    backgroundColor: 'transparent',
  },
  otherChipText: {
    color: '#4a90e2',
    fontWeight: '600' as const,
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
