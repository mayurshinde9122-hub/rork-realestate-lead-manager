import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle, RefreshCw, Settings } from 'lucide-react-native';

export default function LeadImportScreen() {
  const { user } = useAuth();
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [sheetName, setSheetName] = useState<string>('Sheet1');

  const configQuery = trpc.import.getConfiguration.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  const createConfigMutation = trpc.import.createConfiguration.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Google Sheet configuration saved successfully');
      configQuery.refetch();
      setGoogleSheetUrl('');
      setSheetName('Sheet1');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const updateConfigMutation = trpc.import.updateConfiguration.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Configuration updated');
      configQuery.refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const triggerImportMutation = trpc.import.triggerManualImport.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Manual import triggered. Check back in a few moments.');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const stateQuery = trpc.import.getImportState.useQuery(
    { configurationId: configQuery.data?.id || '' },
    { enabled: !!configQuery.data?.id }
  );

  const logsQuery = trpc.import.getImportLogs.useQuery(
    { configurationId: configQuery.data?.id || '', limit: 10 },
    { enabled: !!configQuery.data?.id }
  );

  const handleSaveConfiguration = () => {
    if (!googleSheetUrl.trim() || !sheetName.trim()) {
      Alert.alert('Error', 'Please provide both Google Sheet URL and Sheet Name');
      return;
    }

    createConfigMutation.mutate({
      googleSheetUrl: googleSheetUrl.trim(),
      sheetName: sheetName.trim(),
      pollIntervalMinutes: 10,
    });
  };

  const handleToggleActive = () => {
    if (!configQuery.data) return;

    updateConfigMutation.mutate({
      id: configQuery.data.id,
      isActive: !configQuery.data.isActive,
    });
  };

  const handleTriggerImport = () => {
    Alert.alert(
      'Trigger Manual Import',
      'This will immediately start importing leads from the Google Sheet. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', onPress: () => triggerImportMutation.mutate() },
      ]
    );
  };

  if (user?.role !== 'admin') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Lead Import' }} />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#EF4444" />
          <Text style={styles.errorText}>Only admins can access this page</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Lead Import Configuration' }} />
      <StatusBar style="dark" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>Configuration</Text>
          </View>

          {configQuery.isLoading ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : configQuery.data ? (
            <View style={styles.configCard}>
              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Status:</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, { backgroundColor: configQuery.data.isActive ? '#10B981' : '#EF4444' }]} />
                  <Text style={styles.statusText}>{configQuery.data.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Sheet URL:</Text>
                <Text style={styles.configValue} numberOfLines={1}>{configQuery.data.googleSheetUrl}</Text>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Sheet Name:</Text>
                <Text style={styles.configValue}>{configQuery.data.sheetName}</Text>
              </View>

              <View style={styles.configRow}>
                <Text style={styles.configLabel}>Poll Interval:</Text>
                <Text style={styles.configValue}>{configQuery.data.pollIntervalMinutes} minutes</Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={handleToggleActive}
                  disabled={updateConfigMutation.isPending}
                >
                  {updateConfigMutation.isPending ? (
                    <ActivityIndicator size="small" color="#3B82F6" />
                  ) : (
                    <Text style={styles.buttonSecondaryText}>
                      {configQuery.data.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleTriggerImport}
                  disabled={triggerImportMutation.isPending || !configQuery.data.isActive}
                >
                  {triggerImportMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <RefreshCw size={16} color="#FFFFFF" />
                      <Text style={styles.buttonPrimaryText}>Manual Import</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.inputLabel}>Google Sheet URL</Text>
              <TextInput
                style={styles.input}
                value={googleSheetUrl}
                onChangeText={setGoogleSheetUrl}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.inputLabel}>Sheet Name</Text>
              <TextInput
                style={styles.input}
                value={sheetName}
                onChangeText={setSheetName}
                placeholder="Sheet1"
              />

              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, styles.saveButton]}
                onPress={handleSaveConfiguration}
                disabled={createConfigMutation.isPending}
              >
                {createConfigMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonPrimaryText}>Save Configuration</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {stateQuery.data && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Import State</Text>
            <View style={styles.stateCard}>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Last Processed Row:</Text>
                <Text style={styles.stateValue}>{stateQuery.data.lastProcessedRow}</Text>
              </View>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Last Run:</Text>
                <Text style={styles.stateValue}>
                  {new Date(stateQuery.data.lastRunAt).toLocaleString()}
                </Text>
              </View>
              <View style={styles.stateRow}>
                <Text style={styles.stateLabel}>Next Run:</Text>
                <Text style={styles.stateValue}>
                  {new Date(stateQuery.data.nextRunAt).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {logsQuery.data && logsQuery.data.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Import Logs</Text>
            {logsQuery.data.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View style={styles.logStatus}>
                    {log.status === 'success' ? (
                      <CheckCircle size={16} color="#10B981" />
                    ) : (
                      <AlertCircle size={16} color="#EF4444" />
                    )}
                    <Text style={[styles.logStatusText, { color: log.status === 'success' ? '#10B981' : '#EF4444' }]}>
                      {log.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.logTime}>{new Date(log.runAt).toLocaleString()}</Text>
                </View>
                <View style={styles.logStats}>
                  <Text style={styles.logStat}>Scanned: {log.rowsScanned}</Text>
                  <Text style={styles.logStat}>New: {log.newRowsDetected}</Text>
                  <Text style={styles.logStat}>Inserted: {log.leadsInserted}</Text>
                  <Text style={styles.logStat}>Duplicates: {log.duplicatesSkipped}</Text>
                </View>
                {log.errors.length > 0 && (
                  <View style={styles.logErrors}>
                    <Text style={styles.logErrorTitle}>Errors:</Text>
                    {log.errors.slice(0, 3).map((error, idx) => (
                      <Text key={idx} style={styles.logError}>• {error}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  configCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  configValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonPrimary: {
    backgroundColor: '#3B82F6',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    marginTop: 16,
  },
  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  stateValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  logStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  logStat: {
    fontSize: 12,
    color: '#6B7280',
  },
  logErrors: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
  },
  logErrorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 4,
  },
  logError: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 2,
  },
});
