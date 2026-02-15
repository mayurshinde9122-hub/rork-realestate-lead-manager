import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Filter, Plus, Phone } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';
import { ApiLead } from '@/types/api';

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

export default function LeadsScreen() {
  const [search, setSearch] = useState<string>('');
  const router = useRouter();

  const { data: leads, isLoading, refetch } = trpc.leads.getAll.useQuery({
    search: search || undefined,
  });

  const renderLeadCard = ({ item }: { item: ApiLead }) => {
    return (
      <TouchableOpacity
        style={styles.leadCard}
        onPress={() => router.push(`/lead-detail?id=${item.id}`)}
        testID={`lead-card-${item.id}`}
      >
        <View style={styles.leadHeader}>
          <View style={styles.leadInfo}>
            <Text style={styles.leadName}>{item.clientName}</Text>
            <Text style={styles.leadPhone}>{item.contactNumber}</Text>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={(e) => {
              e.stopPropagation();
              console.log('Call:', item.contactNumber);
            }}
          >
            <Phone size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.leadDetails}>
          <Text style={styles.leadProject}>{item.interestedProjects.join(', ')}</Text>
          <View style={styles.leadMeta}>
            <View style={[styles.interestBadge, { backgroundColor: getInterestColor('warm') }]}>
              <Text style={styles.interestText}>Warm</Text>
            </View>
            <Text style={styles.leadDate}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or phone..."
              placeholderTextColor="#666"
              value={search}
              onChangeText={setSearch}
              testID="search-input"
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => router.push('/filter')}
            testID="filter-button"
          >
            <Filter size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#4a90e2" />
        </View>
      ) : (
        <FlatList
          data={leads}
          renderItem={renderLeadCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#4a90e2"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No leads found</Text>
              <Text style={styles.emptySubtext}>Add a new lead to get started</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-lead')}
        testID="add-lead-fab"
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  leadCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4a90e2',
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
  },
  leadPhone: {
    fontSize: 14,
    color: '#888',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadDetails: {
    gap: 8,
  },
  leadProject: {
    fontSize: 14,
    color: '#bbb',
  },
  leadMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  interestBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  leadDate: {
    fontSize: 12,
    color: '#888',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
