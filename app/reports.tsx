import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  ArrowLeft,
  Download,
  Users,
  PhoneCall,
  Calendar,
  TrendingUp,
  BarChart3,
  Activity,
  Target,
  FileSpreadsheet,
} from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

type ReportType = 
  | 'leads'
  | 'interactions'
  | 'followUps'
  | 'sourceAnalysis'
  | 'agentPerformance'
  | 'conversionFunnel'
  | 'dailyActivity'
  | 'callStatus';

interface ReportConfig {
  id: ReportType;
  title: string;
  description: string;
  icon: any;
  color: string;
  hasDateRange: boolean;
  hasTypeFilter?: boolean;
}

const reportConfigs: ReportConfig[] = [
  {
    id: 'leads',
    title: 'Leads Report',
    description: 'Complete list of all leads with details',
    icon: Users,
    color: '#4a90e2',
    hasDateRange: true,
  },
  {
    id: 'interactions',
    title: 'Interactions Report',
    description: 'All interactions with leads',
    icon: PhoneCall,
    color: '#2ecc71',
    hasDateRange: true,
  },
  {
    id: 'followUps',
    title: 'Follow-ups Report',
    description: 'Scheduled and overdue follow-ups',
    icon: Calendar,
    color: '#e74c3c',
    hasDateRange: false,
    hasTypeFilter: true,
  },
  {
    id: 'sourceAnalysis',
    title: 'Source Analysis',
    description: 'Lead sources and conversion rates',
    icon: TrendingUp,
    color: '#f39c12',
    hasDateRange: true,
  },
  {
    id: 'agentPerformance',
    title: 'Agent Performance',
    description: 'Performance metrics for all agents',
    icon: Target,
    color: '#9b59b6',
    hasDateRange: true,
  },
  {
    id: 'conversionFunnel',
    title: 'Conversion Funnel',
    description: 'Lead journey and conversion tracking',
    icon: BarChart3,
    color: '#1abc9c',
    hasDateRange: true,
  },
  {
    id: 'dailyActivity',
    title: 'Daily Activity',
    description: 'Day-by-day activity breakdown',
    icon: Activity,
    color: '#e67e22',
    hasDateRange: true,
  },
  {
    id: 'callStatus',
    title: 'Call Status Report',
    description: 'Detailed call status tracking',
    icon: FileSpreadsheet,
    color: '#16a085',
    hasDateRange: true,
  },
];

export default function ReportsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [generatingReport, setGeneratingReport] = useState<ReportType | null>(null);

  const leadsReportMutation = trpc.reports.generateLeadsReport.useMutation();
  const interactionsReportMutation = trpc.reports.generateInteractionsReport.useMutation();
  const followUpsReportMutation = trpc.reports.generateFollowUpsReport.useMutation();
  const sourceAnalysisReportMutation = trpc.reports.generateSourceAnalysisReport.useMutation();
  const agentPerformanceReportMutation = trpc.reports.generateAgentPerformanceReport.useMutation();
  const conversionFunnelReportMutation = trpc.reports.generateConversionFunnelReport.useMutation();
  const dailyActivityReportMutation = trpc.reports.generateDailyActivityReport.useMutation();
  const callStatusReportMutation = trpc.reports.generateCallStatusReport.useMutation();

  const downloadExcel = async (base64: string, fileName: string) => {
    try {
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const file = new File(Paths.document, fileName);
        await file.write(base64, { encoding: 'base64' });
        
        console.log('[Reports] File saved to:', file.uri);
        
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.uri);
        } else {
          Alert.alert('Success', `Report saved to ${file.uri}`);
        }
      }
    } catch (error) {
      console.error('[Reports] Download error:', error);
      Alert.alert('Error', 'Failed to download report');
    }
  };

  const handleGenerateReport = async (reportType: ReportType) => {
    setGeneratingReport(reportType);
    
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let result;

      switch (reportType) {
        case 'leads':
          result = await leadsReportMutation.mutateAsync({
            startDate: thirtyDaysAgo.toISOString(),
            endDate: now.toISOString(),
          });
          break;

        case 'interactions':
          result = await interactionsReportMutation.mutateAsync({
            startDate: thirtyDaysAgo.toISOString(),
            endDate: now.toISOString(),
          });
          break;

        case 'followUps':
          result = await followUpsReportMutation.mutateAsync({
            type: 'all',
          });
          break;

        case 'sourceAnalysis':
          result = await sourceAnalysisReportMutation.mutateAsync({
            startDate: thirtyDaysAgo.toISOString(),
            endDate: now.toISOString(),
          });
          break;

        case 'agentPerformance':
          result = await agentPerformanceReportMutation.mutateAsync({
            startDate: thirtyDaysAgo.toISOString(),
            endDate: now.toISOString(),
          });
          break;

        case 'conversionFunnel':
          result = await conversionFunnelReportMutation.mutateAsync({
            startDate: thirtyDaysAgo.toISOString(),
            endDate: now.toISOString(),
          });
          break;

        case 'dailyActivity':
          result = await dailyActivityReportMutation.mutateAsync({
            startDate: thirtyDaysAgo.toISOString(),
            endDate: now.toISOString(),
          });
          break;

        case 'callStatus':
          result = await callStatusReportMutation.mutateAsync({
            startDate: thirtyDaysAgo.toISOString(),
            endDate: now.toISOString(),
          });
          break;

        default:
          throw new Error('Invalid report type');
      }

      if (result) {
        console.log(`[Reports] Generated ${reportType} report with ${result.count} records`);
        await downloadExcel(result.base64, result.fileName);
        Alert.alert(
          'Success',
          `Report generated successfully with ${result.count} records!`
        );
      }
    } catch (error: any) {
      console.error('[Reports] Generation error:', error);
      Alert.alert('Error', error.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(null);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="back-button"
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Generate detailed reports in Excel format. All reports include data from the last 30 days by default.
        </Text>

        <View style={styles.reportsGrid}>
          {reportConfigs.map((config) => {
            const Icon = config.icon;
            const isGenerating = generatingReport === config.id;

            return (
              <TouchableOpacity
                key={config.id}
                style={[
                  styles.reportCard,
                  { borderLeftColor: config.color },
                  isGenerating && styles.reportCardDisabled,
                ]}
                onPress={() => handleGenerateReport(config.id)}
                disabled={isGenerating || generatingReport !== null}
                testID={`generate-${config.id}-report`}
              >
                <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
                  <Icon size={32} color={config.color} />
                </View>
                
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>{config.title}</Text>
                  <Text style={styles.reportDescription}>{config.description}</Text>
                </View>

                {isGenerating ? (
                  <ActivityIndicator size="small" color={config.color} />
                ) : (
                  <View style={[styles.downloadButton, { backgroundColor: config.color }]}>
                    <Download size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Reports</Text>
          <Text style={styles.infoText}>
            • All reports are exported in Excel (.xlsx) format{'\n'}
            • Default date range: Last 30 days{'\n'}
            • Reports include all accessible data based on your role{'\n'}
            • Tap any report card to generate and download{'\n'}
            • Files can be shared or saved to your device
          </Text>
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
    marginBottom: 24,
  },
  reportsGrid: {
    gap: 16,
  },
  reportCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderLeftWidth: 4,
  },
  reportCardDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  downloadButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    lineHeight: 22,
  },
});
