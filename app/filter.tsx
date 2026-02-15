import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

const SOURCES = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Walk-in', 'Other'];
const PROJECTS = ['Skyline Towers', 'Green Valley', 'Plaza Residency', 'Marina Bay', 'Urban Heights'];
const OWNERSHIPS = ['self', 'investment'];
const FURNISHINGS = ['unfurnished', 'semi', 'fully'];
const INTEREST_LEVELS = ['cold', 'warm', 'hot'];
const CALL_STATUSES = ['not_received', 'connected', 'follow_up_needed', 'not_interested'];

export default function FilterScreen() {
  const router = useRouter();

  const [source, setSource] = useState<string | undefined>(undefined);
  const [project, setProject] = useState<string | undefined>(undefined);
  const [ownership, setOwnership] = useState<string | undefined>(undefined);
  const [furnishing, setFurnishing] = useState<string | undefined>(undefined);
  const [interestLevel, setInterestLevel] = useState<string | undefined>(undefined);
  const [callStatus, setCallStatus] = useState<string | undefined>(undefined);
  
  const [createdFrom, setCreatedFrom] = useState<Date | undefined>(undefined);
  const [createdTo, setCreatedTo] = useState<Date | undefined>(undefined);
  const [modifiedFrom, setModifiedFrom] = useState<Date | undefined>(undefined);
  const [modifiedTo, setModifiedTo] = useState<Date | undefined>(undefined);
  
  const [showDatePicker, setShowDatePicker] = useState<{ type: string; value: Date } | null>(null);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (showDatePicker && selectedDate) {
      switch (showDatePicker.type) {
        case 'createdFrom':
          setCreatedFrom(selectedDate);
          break;
        case 'createdTo':
          setCreatedTo(selectedDate);
          break;
        case 'modifiedFrom':
          setModifiedFrom(selectedDate);
          break;
        case 'modifiedTo':
          setModifiedTo(selectedDate);
          break;
      }
    }
    setShowDatePicker(null);
  };

  const handleApply = () => {
    const filters: any = {};
    if (source) filters.source = source;
    if (project) filters.project = project;
    if (ownership) filters.ownership = ownership;
    if (furnishing) filters.furnishing = furnishing;
    if (interestLevel) filters.interestLevel = interestLevel;
    if (callStatus) filters.callStatus = callStatus;
    if (createdFrom) filters.createdFrom = createdFrom.toISOString();
    if (createdTo) filters.createdTo = createdTo.toISOString();
    if (modifiedFrom) filters.modifiedFrom = modifiedFrom.toISOString();
    if (modifiedTo) filters.modifiedTo = modifiedTo.toISOString();

    router.back();
  };

  const handleReset = () => {
    setSource(undefined);
    setProject(undefined);
    setOwnership(undefined);
    setFurnishing(undefined);
    setInterestLevel(undefined);
    setCallStatus(undefined);
    setCreatedFrom(undefined);
    setCreatedTo(undefined);
    setModifiedFrom(undefined);
    setModifiedTo(undefined);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Source</Text>
          <View style={styles.chipContainer}>
            {SOURCES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, source === s && styles.chipActive]}
                onPress={() => setSource(source === s ? undefined : s)}
              >
                <Text style={[styles.chipText, source === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Project</Text>
          <View style={styles.chipContainer}>
            {PROJECTS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, project === p && styles.chipActive]}
                onPress={() => setProject(project === p ? undefined : p)}
              >
                <Text style={[styles.chipText, project === p && styles.chipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ownership</Text>
          <View style={styles.segmentContainer}>
            {OWNERSHIPS.map((o) => (
              <TouchableOpacity
                key={o}
                style={[styles.segment, ownership === o && styles.segmentActive]}
                onPress={() => setOwnership(ownership === o ? undefined : o)}
              >
                <Text style={[styles.segmentText, ownership === o && styles.segmentTextActive]}>
                  {o}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Furnishing</Text>
          <View style={styles.segmentContainer}>
            {FURNISHINGS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.segment, furnishing === f && styles.segmentActive]}
                onPress={() => setFurnishing(furnishing === f ? undefined : f)}
              >
                <Text style={[styles.segmentText, furnishing === f && styles.segmentTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Interest Level</Text>
          <View style={styles.segmentContainer}>
            {INTEREST_LEVELS.map((i) => (
              <TouchableOpacity
                key={i}
                style={[styles.segment, interestLevel === i && styles.segmentActive]}
                onPress={() => setInterestLevel(interestLevel === i ? undefined : i)}
              >
                <Text style={[styles.segmentText, interestLevel === i && styles.segmentTextActive]}>
                  {i}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Call Status</Text>
          <View style={styles.chipContainer}>
            {CALL_STATUSES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, callStatus === c && styles.chipActive]}
                onPress={() => setCallStatus(callStatus === c ? undefined : c)}
              >
                <Text style={[styles.chipText, callStatus === c && styles.chipTextActive]}>
                  {c.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Created Date Range</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker({ type: 'createdFrom', value: createdFrom || new Date() })}
            >
              <Text style={styles.dateButtonText}>
                {createdFrom ? createdFrom.toLocaleDateString() : 'From'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker({ type: 'createdTo', value: createdTo || new Date() })}
            >
              <Text style={styles.dateButtonText}>
                {createdTo ? createdTo.toLocaleDateString() : 'To'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Modified Date Range</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker({ type: 'modifiedFrom', value: modifiedFrom || new Date() })}
            >
              <Text style={styles.dateButtonText}>
                {modifiedFrom ? modifiedFrom.toLocaleDateString() : 'From'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker({ type: 'modifiedTo', value: modifiedTo || new Date() })}
            >
              <Text style={styles.dateButtonText}>
                {modifiedTo ? modifiedTo.toLocaleDateString() : 'To'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={showDatePicker.value}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  content: {
    flex: 1,
    padding: 20,
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
    textTransform: 'capitalize' as const,
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
    gap: 4,
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
    textTransform: 'capitalize' as const,
  },
  segmentTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 40,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
