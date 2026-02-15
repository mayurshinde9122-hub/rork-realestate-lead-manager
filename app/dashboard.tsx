import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  Home,
  PhoneCall,
  Calendar,
  AlertCircle,
  Users,
  Plus,
  Bell,
  User,
  LogOut,
  Settings,
  Upload,
  X,
  FileBarChart,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: stats, isLoading, refetch } = trpc.dashboard.getStats.useQuery();
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string } | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = trpc.import.uploadExcelFile.useMutation();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel.sheet.macroEnabled.12',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({ name: file.name, uri: file.uri });
        console.log('[Import] File selected:', file.name);
      }
    } catch (error: any) {
      console.error('[Import] Error picking file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedSource) {
      Alert.alert('Error', 'Please select a file and source type');
      return;
    }

    setIsUploading(true);
    try {
      console.log('[Import] Reading file:', selectedFile.uri);
      
      let base64: string;
      
      if (Platform.OS === 'web') {
        const response = await fetch(selectedFile.uri);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const file = new FileSystem.File(selectedFile.uri);
        base64 = await file.base64();
      }

      console.log('[Import] Uploading file...');
      const result = await uploadMutation.mutateAsync({
        fileData: base64,
        fileName: selectedFile.name,
        source: selectedSource,
      });

      console.log('[Import] Upload result:', result);
      
      let message = `Imported ${result.leadsInserted} leads successfully.\n${result.duplicatesSkipped} duplicates skipped.`;
      
      if (result.errors && result.errors.length > 0) {
        message += `\n\n${result.errors.length} errors:\n${result.errors.slice(0, 5).join('\n')}`;
        if (result.errors.length > 5) {
          message += `\n... and ${result.errors.length - 5} more`;
        }
      }
      
      Alert.alert(
        result.leadsInserted > 0 ? 'Import Complete' : 'Import Failed',
        message
      );
      setShowImportModal(false);
      setSelectedFile(null);
      setSelectedSource(null);
      refetch();
    } catch (error: any) {
      console.error('[Import] Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const sourceOptions = [
    { label: 'Cold Calls', value: 'cold_calls' },
    { label: 'Marketing Campaign', value: 'marketing_campaign' },
    { label: 'Website', value: 'website' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/notifications')}
              testID="notifications-button"
            >
              <Bell size={24} color="#fff" />
              {(stats?.overdueFollowUps || 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats?.overdueFollowUps}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/profile')}
              testID="profile-button"
            >
              <User size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#4a90e2"
          />
        }
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Today Overview</Text>

          <View style={styles.statsGrid}>
            <TouchableOpacity style={[styles.statCard, styles.statCard1]}>
              <View style={styles.statIcon}>
                <PhoneCall size={24} color="#4a90e2" />
              </View>
              <Text style={styles.statValue}>{stats?.callsMadeToday || 0}</Text>
              <Text style={styles.statLabel}>Calls Made</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.statCard, styles.statCard2]}>
              <View style={styles.statIcon}>
                <Calendar size={24} color="#2ecc71" />
              </View>
              <Text style={styles.statValue}>{stats?.followUpsToday || 0}</Text>
              <Text style={styles.statLabel}>Follow-ups</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, styles.statCard3]}
              onPress={() => router.push('/notifications')}
            >
              <View style={styles.statIcon}>
                <AlertCircle size={24} color="#e74c3c" />
              </View>
              <Text style={styles.statValue}>{stats?.overdueFollowUps || 0}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, styles.statCard4]}
              onPress={() => router.push('/leads')}
            >
              <View style={styles.statIcon}>
                <Users size={24} color="#9b59b6" />
              </View>
              <Text style={styles.statValue}>{stats?.totalActiveLeads || 0}</Text>
              <Text style={styles.statLabel}>Active Leads</Text>
            </TouchableOpacity>
          </View>

          {stats?.leadsBySource && Object.keys(stats.leadsBySource).length > 0 && (
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Leads by Source</Text>
              <View style={styles.chartCard}>
                {Object.entries(stats.leadsBySource).map(([source, count]) => (
                  <View key={source} style={styles.chartRow}>
                    <Text style={styles.chartLabel}>{source}</Text>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            width: `${Math.min(
                              ((count as number) / (stats.totalActiveLeads || 1)) * 100,
                              100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartValue}>{count as number}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {stats?.leadsByInterestLevel && (
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Interest Level</Text>
              <View style={styles.chartCard}>
                <View style={styles.chartRow}>
                  <Text style={styles.chartLabel}>Hot</Text>
                  <View style={styles.chartBarContainer}>
                    <View
                      style={[
                        styles.chartBar,
                        styles.chartBarHot,
                        {
                          width: `${Math.min(
                            ((stats.leadsByInterestLevel.hot || 0) /
                              (stats.totalActiveLeads || 1)) *
                              100,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartValue}>{stats.leadsByInterestLevel.hot}</Text>
                </View>
                <View style={styles.chartRow}>
                  <Text style={styles.chartLabel}>Warm</Text>
                  <View style={styles.chartBarContainer}>
                    <View
                      style={[
                        styles.chartBar,
                        styles.chartBarWarm,
                        {
                          width: `${Math.min(
                            ((stats.leadsByInterestLevel.warm || 0) /
                              (stats.totalActiveLeads || 1)) *
                              100,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartValue}>{stats.leadsByInterestLevel.warm}</Text>
                </View>
                <View style={styles.chartRow}>
                  <Text style={styles.chartLabel}>Cold</Text>
                  <View style={styles.chartBarContainer}>
                    <View
                      style={[
                        styles.chartBar,
                        styles.chartBarCold,
                        {
                          width: `${Math.min(
                            ((stats.leadsByInterestLevel.cold || 0) /
                              (stats.totalActiveLeads || 1)) *
                              100,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartValue}>{stats.leadsByInterestLevel.cold}</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/add-lead')}
                testID="add-lead-button"
              >
                <Plus size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Add Lead</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/leads')}
                testID="view-leads-button"
              >
                <Home size={24} color="#fff" />
                <Text style={styles.actionButtonText}>View Leads</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/notifications')}
                testID="follow-ups-button"
              >
                <Calendar size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Follow-ups</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.settingsButton]}
                onPress={() => router.push('/manage-options')}
                testID="manage-options-button"
              >
                <Settings size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Manage Options</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.importButton]}
                onPress={() => setShowImportModal(true)}
                testID="import-leads-button"
              >
                <Upload size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Import Leads</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.reportsButton]}
                onPress={() => router.push('/reports')}
                testID="reports-button"
              >
                <FileBarChart size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}
                testID="logout-button"
              >
                <LogOut size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showImportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Leads from Excel</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Select Excel File (.xls or .xlsx)</Text>
              <TouchableOpacity
                style={styles.filePickerButton}
                onPress={handlePickFile}
                disabled={isUploading}
              >
                <Upload size={20} color="#4a90e2" />
                <Text style={styles.filePickerText}>
                  {selectedFile ? selectedFile.name : 'Browse File'}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.formatHint}>Required columns: name, phone</Text>
              <Text style={styles.formatHint}>Optional: email, interested_areas, interested_projects, ownership, furnishing</Text>

              <Text style={styles.modalLabel}>Select Source Type</Text>
              <View style={styles.sourceOptions}>
                {sourceOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sourceOption,
                      selectedSource === option.value && styles.sourceOptionSelected,
                    ]}
                    onPress={() => setSelectedSource(option.value)}
                    disabled={isUploading}
                  >
                    <Text
                      style={[
                        styles.sourceOptionText,
                        selectedSource === option.value && styles.sourceOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  (!selectedFile || !selectedSource || isUploading) &&
                    styles.uploadButtonDisabled,
                ]}
                onPress={handleUpload}
                disabled={!selectedFile || !selectedSource || isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.uploadButtonText}>Upload and Import</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
  },
  safeArea: {
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#888',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: cardWidth,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
  },
  statCard1: {
    borderLeftColor: '#4a90e2',
  },
  statCard2: {
    borderLeftColor: '#2ecc71',
  },
  statCard3: {
    borderLeftColor: '#e74c3c',
  },
  statCard4: {
    borderLeftColor: '#9b59b6',
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  chartSection: {
    marginTop: 24,
  },
  chartCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartLabel: {
    width: 80,
    fontSize: 14,
    color: '#fff',
  },
  chartBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  chartBar: {
    height: '100%',
    backgroundColor: '#4a90e2',
    borderRadius: 12,
  },
  chartBarHot: {
    backgroundColor: '#e74c3c',
  },
  chartBarWarm: {
    backgroundColor: '#f39c12',
  },
  chartBarCold: {
    backgroundColor: '#3498db',
  },
  chartValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  quickActions: {
    marginTop: 24,
    marginBottom: 40,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  settingsButton: {
    backgroundColor: '#9b59b6',
  },
  importButton: {
    backgroundColor: '#16a085',
  },
  reportsButton: {
    backgroundColor: '#8e44ad',
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 12,
    marginTop: 8,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#4a90e2',
    borderStyle: 'dashed',
  },
  filePickerText: {
    fontSize: 14,
    color: '#4a90e2',
    flex: 1,
  },
  sourceOptions: {
    gap: 12,
  },
  sourceOption: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sourceOptionSelected: {
    borderColor: '#4a90e2',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  sourceOptionText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  sourceOptionTextSelected: {
    color: '#4a90e2',
    fontWeight: '600' as const,
  },
  uploadButton: {
    backgroundColor: '#4a90e2',
    borderRadius: 12,
    padding: 18,
    marginTop: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    backgroundColor: '#2a2a3e',
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  formatHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
});
