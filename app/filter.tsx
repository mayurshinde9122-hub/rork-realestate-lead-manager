import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { trpc } from '@/lib/trpc';

const INTEREST_LEVELS = ['cold', 'warm', 'hot'];
const CALL_STATUSES = ['not_received', 'connected', 'follow_up_needed', 'not_interested'];

export default function FilterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [source, setSource] = useState<string | undefined>(params.source as string | undefined);
  const [project, setProject] = useState<string | undefined>(params.project as string | undefined);
  const [interestedArea, setInterestedArea] = useState<string | undefined>(params.interestedArea as string | undefined);
  const [ownership, setOwnership] = useState<string | undefined>(params.ownership as string | undefined);
  const [furnishing, setFurnishing] = useState<string | undefined>(params.furnishing as string | undefined);
  const [interestLevel, setInterestLevel] = useState<string | undefined>(params.interestLevel as string | undefined);
  const [callStatus, setCallStatus] = useState<string | undefined>(params.callStatus as string | undefined);

  const [createdFrom, setCreatedFrom] = useState<Date | undefined>(
    params.createdFrom ? new Date(params.createdFrom as string) : undefined
  );
  const [createdTo, setCreatedTo] = useState<Date | undefined>(
    params.createdTo ? new Date(params.createdTo as string) : undefined
  );
  const [modifiedFrom, setModifiedFrom] = useState<Date | undefined>(
    params.modifiedFrom ? new Date(params.modifiedFrom as string) : undefined
  );
  const [modifiedTo, setModifiedTo] = useState<Date | undefined>(
    params.modifiedTo ? new Date(params.modifiedTo as string) : undefined
  );

  const [showDatePicker, setShowDatePicker] = useState<{ type: string; value: Date } | null>(null);

  const { data: filterValues, isLoading } = trpc.leads.getFilterValues.useQuery();

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
    const filters: Record<string, string> = {};
    if (source) filters.source = source;
    if (project) filters.project = project;
    if (interestedArea) filters.interestedArea = interestedArea;
    if (ownership) filters.ownership = ownership;
    if (furnishing) filters.furnishing = furnishing;
    if (interestLevel) filters.interestLevel = interestLevel;
    if (callStatus) filters.callStatus = callStatus;
    if (createdFrom) filters.createdFrom = createdFrom.toISOString();
    if (createdTo) filters.createdTo = createdTo.toISOString();
    if (modifiedFrom) filters.modifiedFrom = modifiedFrom.toISOString();
    if (modifiedTo) filters.modifiedTo = modifiedTo.toISOString();

    router.replace({ pathname: '/leads', params: filters });
  };

  const handleReset = () => {
    setSource(undefined);
    setProject(undefined);
    setInterestedArea(undefined);
    setOwnership(undefined);
    setFurnishing(undefined);
    setInterestLevel(undefined);
    setCallStatus(undefined);
    setCreatedFrom(undefined);
    setCreatedTo(undefined);
    setModifiedFrom(undefined);
    setModifiedTo(undefined);
  };

  const activeFilterCount = [source, project, interestedArea, ownership, furnishing, interestLevel, callStatus, createdFrom, createdTo, modifiedFrom, modifiedTo].filter(Boolean).length;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Loading filters...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sources = filterValues?.sources || [];
  const areas = filterValues?.interestedAreas || [];
  const projects = filterValues?.interestedProjects || [];
  const ownerships = filterValues?.ownerships || [];
  const furnishings = filterValues?.furnishings || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeFilterCount > 0 && (
          <View style={styles.activeFiltersBar}>
            <Text style={styles.activeFiltersText}>{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}

        {sources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Source</Text>
            <View style={styles.chipContainer}>
              {sources.map((s) => (
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
        )}

        {areas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Interested Area</Text>
            <View style={styles.chipContainer}>
              {areas.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, interestedArea === a && styles.chipActive]}
                  onPress={() => setInterestedArea(interestedArea === a ? undefined : a)}
                >
                  <Text style={[styles.chipText, interestedArea === a && styles.chipTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Project</Text>
            <View style={styles.chipContainer}>
              {projects.map((p) => (
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
        )}

        {ownerships.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Ownership</Text>
            <View style={styles.segmentContainer}>
              {ownerships.map((o) => (
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
        )}

        {furnishings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Furnishing</Text>
            <View style={styles.segmentContainer}>
              {furnishings.map((f) => (
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
        )}

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
              style={[styles.dateButton, createdFrom && styles.dateButtonActive]}
              onPress={() => setShowDatePicker({ type: 'createdFrom', value: createdFrom || new Date() })}
            >
              <Text style={[styles.dateButtonText, createdFrom && styles.dateButtonTextActive]}>
                {createdFrom ? createdFrom.toLocaleDateString() : 'From'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateButton, createdTo && styles.dateButtonActive]}
              onPress={() => setShowDatePicker({ type: 'createdTo', value: createdTo || new Date() })}
            >
              <Text style={[styles.dateButtonText, createdTo && styles.dateButtonTextActive]}>
                {createdTo ? createdTo.toLocaleDateString() : 'To'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Modified Date Range</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity
              style={[styles.dateButton, modifiedFrom && styles.dateButtonActive]}
              onPress={() => setShowDatePicker({ type: 'modifiedFrom', value: modifiedFrom || new Date() })}
            >
              <Text style={[styles.dateButtonText, modifiedFrom && styles.dateButtonTextActive]}>
                {modifiedFrom ? modifiedFrom.toLocaleDateString() : 'From'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateButton, modifiedTo && styles.dateButtonActive]}
              onPress={() => setShowDatePicker({ type: 'modifiedTo', value: modifiedTo || new Date() })}
            >
              <Text style={[styles.dateButtonText, modifiedTo && styles.dateButtonTextActive]}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#888',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  activeFiltersText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '600' as const,
  },
  clearAllText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500' as const,
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
  dateButtonActive: {
    borderColor: '#4a90e2',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  dateButtonTextActive: {
    color: '#fff',
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
