import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { Calendar, AlertCircle } from 'lucide-react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: upcoming } = trpc.notifications.getUpcoming.useQuery();
  const { data: overdue } = trpc.notifications.getOverdue.useQuery();

  const renderFollowUp = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/lead-detail?id=${item.leadId}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.clientName}>{item.clientName}</Text>
        <Text style={styles.time}>
          {new Date(item.followUpDateTime).toLocaleDateString()} {new Date(item.followUpDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
        </Text>
      </View>
      <Text style={styles.notes}>{item.notes}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={20} color="#e74c3c" />
            <Text style={styles.sectionTitle}>Overdue ({overdue?.length || 0})</Text>
          </View>
          <FlatList
            data={overdue}
            renderItem={renderFollowUp}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No overdue follow-ups</Text>
            }
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#2ecc71" />
            <Text style={styles.sectionTitle}>Upcoming ({upcoming?.length || 0})</Text>
          </View>
          <FlatList
            data={upcoming}
            renderItem={renderFollowUp}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No upcoming follow-ups</Text>
            }
          />
        </View>
      </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  notes: {
    fontSize: 14,
    color: '#bbb',
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
