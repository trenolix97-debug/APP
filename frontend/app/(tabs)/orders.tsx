import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { Order, Reservation } from '../../types';
import { format } from 'date-fns';

type Tab = 'active' | 'reservations' | 'history';

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, reservationsData] = await Promise.all([
        api.getOrders(),
        api.getReservations(),
      ]);
      setOrders(ordersData);
      setReservations(reservationsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeOrders = orders.filter((o) => o.status === 'active');
  const historyOrders = orders.filter((o) => o.status !== 'active');
  const upcomingReservations = reservations.filter((r) => r.status === 'upcoming');

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="fast-food" size={24} color="#FFC107" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.restaurantName}</Text>
          <Text style={styles.cardSubtitle}>
            {item.orderType.charAt(0).toUpperCase() + item.orderType.slice(1)}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.itemCount}>
          {item.items.reduce((sum, i) => sum + i.quantity, 0)} items
        </Text>
        <Text style={styles.price}>${item.totalPrice.toFixed(2)}</Text>
      </View>
      {item.deliveryAddress && (
        <Text style={styles.address} numberOfLines={1}>
          {item.deliveryAddress}
        </Text>
      )}
    </View>
  );

  const renderReservation = ({ item }: { item: Reservation }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="calendar" size={24} color="#FFC107" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.restaurantName}</Text>
          <Text style={styles.cardSubtitle}>Table Reservation</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.people} people</Text>
        </View>
      </View>
      {item.preOrderedFood.length > 0 && (
        <View style={styles.preOrderBadge}>
          <Ionicons name="restaurant" size={14} color="#FFC107" />
          <Text style={styles.preOrderText}>
            Food pre-ordered ({item.preOrderedFood.length} items)
          </Text>
        </View>
      )}
      {item.totalPrice > 0 && (
        <Text style={styles.price}>${item.totalPrice.toFixed(2)}</Text>
      )}
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFC107" />
        </View>
      );
    }

    if (activeTab === 'active') {
      if (activeOrders.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="basket-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No active orders</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={activeOrders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id || ''}
          contentContainerStyle={styles.listContent}
        />
      );
    }

    if (activeTab === 'reservations') {
      if (upcomingReservations.length === 0) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No upcoming reservations</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={upcomingReservations}
          renderItem={renderReservation}
          keyExtractor={(item) => item.id || ''}
          contentContainerStyle={styles.listContent}
        />
      );
    }

    // History
    if (historyOrders.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No order history</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={historyOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id || ''}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reservations' && styles.activeTab]}
          onPress={() => setActiveTab('reservations')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'reservations' && styles.activeTabText,
            ]}
          >
            Reservations
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}
          >
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFC107',
  },
  tabText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    color: '#388E3C',
    fontWeight: '600',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  preOrderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  preOrderText: {
    fontSize: 13,
    color: '#000',
    marginLeft: 6,
    fontWeight: '500',
  },
});
