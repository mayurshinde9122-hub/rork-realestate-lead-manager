import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { trpc } from '@/lib/trpc';
import DateTimePicker from '@react-native-community/datetimepicker';

const CALL_STATUSES = [
  { value: 'not_received', label: 'Not Received' },
  { value: 'connected', label: 'Connected' },
  { value: 'follow_up_needed', label: 'Follow-up Needed' },
  { value: 'not_interested', label: 'Not Interested' },
] as const;

const INTEREST_LEVELS = [
  { value: 'cold', label: 'Cold', color: '#3498db' },
  { value: 'warm', label: 'Warm', color: '#f39c12' },
  { value: 'hot', label: 'Hot', color: '#e74c3c' },
] as const;

const formatIndianCurrency = (num: number): string => {
  if (num === 0) return '0';
  if (isNaN(num)) return '';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 10000000) {
    const crores = absNum / 10000000;
    const formatted = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2).replace(/\.?0+$/, '');
    return `${sign}${formatted} Crore${crores >= 2 ? 's' : ''}`;
  }
  if (absNum >= 100000) {
    const lakhs = absNum / 100000;
    const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2).replace(/\.?0+$/, '');
    return `${sign}${formatted} Lakh${lakhs >= 2 ? 's' : ''}`;
  }
  if (absNum >= 1000) {
    const thousands = absNum / 1000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(2).replace(/\.?0+$/, '');
    return `${sign}${formatted} Thousand`;
  }
  return `${sign}${absNum.toLocaleString('en-IN')}`;
};

export default function LogInteractionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const leadId = params.leadId as string;

  const [callStatus, setCallStatus] = useState<'not_received' | 'connected' | 'follow_up_needed' | 'not_interested'>('connected');
  const [interestLevel, setInterestLevel] = useState<'cold' | 'warm' | 'hot'>('warm');
  const [budget, setBudget] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  const createMutation = trpc.interactions.create.useMutation();
  const queryClient = trpc.useUtils();

  const handleSubmit = async () => {
    if (!notes.trim()) {
      Alert.alert('Error', 'Please add some notes');
      return;
    }

    const budgetNum = budget ? parseFloat(budget.replace(/,/g, '')) : 0;

    if (budget && isNaN(budgetNum)) {
      Alert.alert('Error', 'Please enter a valid budget');
      return;
    }

    try {
      await createMutation.mutateAsync({
        leadId,
        callStatus,
        interestLevel,
        budget: budgetNum,
        notes,
        followUpDateTime: followUpDate,
      });

      queryClient.interactions.getByLeadId.invalidate({ leadId });
      queryClient.dashboard.getStats.invalidate();
      queryClient.notifications.getUpcoming.invalidate();
      queryClient.notifications.getOverdue.invalidate();

      Alert.alert('Success', 'Interaction logged successfully');
      router.back();
    } catch (error) {
      console.error('Error logging interaction:', error);
      Alert.alert('Error', 'Failed to log interaction. Please try again.');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const current = followUpDate || new Date();
      current.setFullYear(selectedDate.getFullYear());
      current.setMonth(selectedDate.getMonth());
      current.setDate(selectedDate.getDate());
      setFollowUpDate(current);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const current = followUpDate || new Date();
      current.setHours(selectedTime.getHours());
      current.setMinutes(selectedTime.getMinutes());
      setFollowUpDate(current);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.label}>Call Status <Text style={styles.required}>*</Text></Text>
            <View style={styles.statusGrid}>
              {CALL_STATUSES.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  style={[
                    styles.statusButton,
                    callStatus === status.value && styles.statusButtonActive,
                  ]}
                  onPress={() => setCallStatus(status.value)}
                >
                  <Text
                    style={[
                      styles.statusButtonText,
                      callStatus === status.value && styles.statusButtonTextActive,
                    ]}
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Interest Level <Text style={styles.required}>*</Text></Text>
            <View style={styles.interestGrid}>
              {INTEREST_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.interestButton,
                    interestLevel === level.value && { backgroundColor: level.color },
                  ]}
                  onPress={() => setInterestLevel(level.value)}
                >
                  <Text
                    style={[
                      styles.interestButtonText,
                      interestLevel === level.value && styles.interestButtonTextActive,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Budget (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter budget amount in INR"
              placeholderTextColor="#666"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              testID="budget-input"
            />
            {budget.length > 0 && !isNaN(parseFloat(budget.replace(/,/g, ''))) && (
              <View style={styles.budgetTextContainer}>
                <Text style={styles.budgetTextLabel}>₹ {formatIndianCurrency(parseFloat(budget.replace(/,/g, '')))}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Follow-up Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {followUpDate
                    ? followUpDate.toLocaleDateString()
                    : 'Select Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {followUpDate
                    ? followUpDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'Select Time'}
                </Text>
              </TouchableOpacity>
            </View>
            {followUpDate && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setFollowUpDate(undefined)}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={followUpDate || new Date()}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={followUpDate || new Date()}
              mode="time"
              display="default"
              onChange={onTimeChange}
            />
          )}

          <View style={styles.section}>
            <Text style={styles.label}>Notes <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add notes about this interaction..."
              placeholderTextColor="#666"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              testID="notes-input"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, createMutation.isPending && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            testID="submit-button"
          >
            <Text style={styles.buttonText}>
              {createMutation.isPending ? 'Saving...' : 'Log Interaction'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  statusGrid: {
    gap: 8,
  },
  statusButton: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  statusButtonActive: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  statusButtonText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  statusButtonTextActive: {
    color: '#fff',
    fontWeight: '600' as const,
  },
  interestGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  interestButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  interestButtonText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '600' as const,
  },
  interestButtonTextActive: {
    color: '#fff',
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
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  budgetTextContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4a90e2',
  },
  budgetTextLabel: {
    fontSize: 15,
    color: '#4a90e2',
    fontWeight: '600' as const,
  },
  dateTimeContainer: {
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
  clearButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#e74c3c',
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
});
