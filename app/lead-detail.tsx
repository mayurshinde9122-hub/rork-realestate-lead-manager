import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, Edit, MessageSquare, MessageCircle } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { ApiInteraction } from '@/types/api';

const getInterestColor = (level: string) => {
  switch (level) {
    case 'hot':
      return '#e74c3c';
    case 'warm':
      return '#f39c12';
    case 'cold':
      return '#3498db';
    default:
      return '#888';
  }
};

const getCallStatusText = (status: string) => {
  switch (status) {
    case 'not_received':
      return 'Not Received';
    case 'connected':
      return 'Connected';
    case 'follow_up_needed':
      return 'Follow-up Needed';
    case 'not_interested':
      return 'Not Interested';
    default:
      return status;
  }
};

export default function LeadDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const leadId = params.id as string;

  const { data: lead, isLoading: leadLoading } = trpc.leads.getById.useQuery({ id: leadId });
  const { data: interactions, isLoading: interactionsLoading } =
    trpc.interactions.getByLeadId.useQuery({ leadId });

  const handleCall = async () => {
    if (!lead?.contactNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }

    const phoneNumber = lead.contactNumber.replace(/\s+/g, '');
    const phoneUrl = `tel:${phoneNumber}`;

    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Unable to open phone dialer');
      }
    } catch (error) {
      console.error('Error opening phone dialer:', error);
      Alert.alert('Error', 'Failed to open phone dialer');
    }
  };

  const handleWhatsApp = async () => {
    if (!lead?.contactNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }

    let phoneNumber = lead.contactNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+91' + phoneNumber;
    }
    
    const whatsappNumber = phoneNumber.replace('+', '');
    const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const renderInteraction = (interaction: ApiInteraction) => (
    <View key={interaction.id} style={styles.interactionCard}>
      <View style={styles.interactionHeader}>
        <View
          style={[
            styles.interestBadge,
            { backgroundColor: getInterestColor(interaction.interestLevel) },
          ]}
        >
          <Text style={styles.interestText}>{interaction.interestLevel.toUpperCase()}</Text>
        </View>
        <Text style={styles.interactionDate}>
          {new Date(interaction.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.interactionRow}>
        <Text style={styles.interactionLabel}>Call Status:</Text>
        <Text style={styles.interactionValue}>{getCallStatusText(interaction.callStatus)}</Text>
      </View>

      {interaction.budget > 0 && (
        <View style={styles.interactionRow}>
          <Text style={styles.interactionLabel}>Budget:</Text>
          <Text style={styles.interactionValue}>₹{interaction.budget.toLocaleString('en-IN')}</Text>
        </View>
      )}

      {interaction.followUpDateTime && (
        <View style={styles.interactionRow}>
          <Text style={styles.interactionLabel}>Follow-up:</Text>
          <Text style={styles.interactionValue}>
            {new Date(interaction.followUpDateTime).toLocaleDateString()} {new Date(interaction.followUpDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
          </Text>
        </View>
      )}

      {interaction.notes && (
        <View style={styles.interactionNotes}>
          <Text style={styles.notesText}>{interaction.notes}</Text>
        </View>
      )}
    </View>
  );

  if (leadLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#4a90e2" />
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Lead not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.leadCard}>
          <View style={styles.leadHeader}>
            <View>
              <Text style={styles.leadName}>{lead.clientName}</Text>
              <Text style={styles.leadPhone}>{lead.contactNumber}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push(`/edit-lead?id=${lead.id}`)}
            >
              <Edit size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.leadDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Source:</Text>
              <Text style={styles.detailValue}>{lead.source}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Areas:</Text>
              <Text style={styles.detailValue}>{lead.interestedAreas.join(', ')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Projects:</Text>
              <Text style={styles.detailValue}>{lead.interestedProjects.join(', ')}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ownership:</Text>
              <Text style={styles.detailValue}>{lead.ownership}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Furnishing:</Text>
              <Text style={styles.detailValue}>{lead.furnishing}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCall}
          >
            <Phone size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.whatsappButton]}
            onPress={handleWhatsApp}
          >
            <MessageCircle size={20} color="#fff" />
            <Text style={styles.actionButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, styles.logButton, styles.fullWidthButton]}
          onPress={() => router.push(`/log-interaction?leadId=${lead.id}`)}
        >
          <MessageSquare size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Log Interaction</Text>
        </TouchableOpacity>

        <View style={styles.timeline}>
          <Text style={styles.timelineTitle}>Interaction Timeline</Text>
          {interactionsLoading ? (
            <ActivityIndicator size="small" color="#4a90e2" style={{ marginTop: 20 }} />
          ) : interactions && interactions.length > 0 ? (
            interactions.map(renderInteraction)
          ) : (
            <Text style={styles.emptyText}>No interactions yet</Text>
          )}
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1e',
  },
  errorText: {
    fontSize: 16,
    color: '#888',
  },
  leadCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  leadName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  leadPhone: {
    fontSize: 16,
    color: '#888',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  callButton: {
    backgroundColor: '#2ecc71',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  logButton: {
    backgroundColor: '#4a90e2',
  },
  fullWidthButton: {
    marginBottom: 24,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  timeline: {
    marginTop: 8,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  interactionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  interactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  interestBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  interactionDate: {
    fontSize: 12,
    color: '#888',
  },
  interactionRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  interactionLabel: {
    fontSize: 14,
    color: '#888',
    width: 100,
  },
  interactionValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  interactionNotes: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  notesText: {
    fontSize: 14,
    color: '#bbb',
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
