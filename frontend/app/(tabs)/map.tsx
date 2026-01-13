import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../utils/api';
import { Restaurant } from '../../types';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const data = await api.getRestaurants();
      setRestaurants(data);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  };

  const renderPin = (restaurant: Restaurant, index: number) => {
    // Simple positioning based on lat/long
    const x = ((restaurant.longitude + 74) * width) / 0.03;
    const y = ((40.76 - restaurant.latitude) * height) / 0.02;

    return (
      <TouchableOpacity
        key={restaurant.id}
        style={[styles.pin, { left: x, top: y }]}
        onPress={() => setSelectedRestaurant(restaurant)}
      >
        <Ionicons name="location" size={32} color="#FF0000" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Mock Map */}
      <View style={styles.map}>
        <View style={styles.mapBackground}>
          <Text style={styles.mapLabel}>New York</Text>
          <Text style={styles.mapSubLabel}>Interactive Restaurant Map</Text>
        </View>
        
        {/* Restaurant Pins */}
        {restaurants.map((restaurant, index) => renderPin(restaurant, index))}
      </View>

      {/* Selected Restaurant Card */}
      {selectedRestaurant && (
        <View style={styles.infoCard}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedRestaurant(null)}
          >
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.cardHeader}>
            <View style={styles.iconPlaceholder}>
              <Ionicons name="restaurant" size={24} color="#999" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{selectedRestaurant.name}</Text>
              <View style={styles.cardMeta}>
                <Ionicons name="star" size={14} color="#FFC107" />
                <Text style={styles.rating}>{selectedRestaurant.rating}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.cuisine}>{selectedRestaurant.cuisine}</Text>
              </View>
              <Text style={styles.address}>{selectedRestaurant.address}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              router.push(`/restaurant/${selectedRestaurant.id}`);
              setSelectedRestaurant(null);
            }}
          >
            <Text style={styles.viewButtonText}>View Restaurant</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  map: {
    flex: 1,
    position: 'relative',
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C8E6C9',
  },
  mapLabel: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 8,
  },
  mapSubLabel: {
    fontSize: 16,
    color: '#66BB6A',
  },
  pin: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  infoCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#000',
    marginLeft: 4,
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 8,
    color: '#999',
  },
  cuisine: {
    fontSize: 14,
    color: '#666',
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
  viewButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
