import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../utils/api';
import { Restaurant, MenuItem } from '../../types';
import { useStore } from '../../store/useStore';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'reserve' | 'info'>('menu');
  const [selectedCategory, setSelectedCategory] = useState(0);

  const { addToCart, cart, setCurrentRestaurant } = useStore();

  useEffect(() => {
    loadRestaurant();
  }, [id]);

  const loadRestaurant = async () => {
    try {
      setLoading(true);
      const data = await api.getRestaurant(id as string);
      setRestaurant(data);
      setCurrentRestaurant(data);
    } catch (error) {
      console.error('Error loading restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    });
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading || !restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
      </View>
    );
  }

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuItem}>
      {item.image ? (
        <Image 
          source={{ uri: item.image }} 
          style={styles.menuItemImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.menuItemImagePlaceholder}>
          <Ionicons name="fast-food" size={24} color="#999" />
        </View>
      )}
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemName}>{item.name}</Text>
        <Text style={styles.menuItemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleAddToCart(item)}
      >
        <Ionicons name="add" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          {restaurant.heroImage ? (
            <Image 
              source={{ uri: restaurant.heroImage }} 
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="restaurant" size={64} color="#999" />
            </View>
          )}
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoSection}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={16} color="#FFC107" />
            <Text style={styles.rating}>{restaurant.rating}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.price}>{restaurant.priceRange}</Text>
          </View>
          <View style={styles.deliveryRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.deliveryTime}>{restaurant.deliveryTime}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'menu' && styles.activeTab]}
            onPress={() => setActiveTab('menu')}
          >
            <Text style={[styles.tabText, activeTab === 'menu' && styles.activeTabText]}>
              Menu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reserve' && styles.activeTab]}
            onPress={() => setActiveTab('reserve')}
          >
            <Text style={[styles.tabText, activeTab === 'reserve' && styles.activeTabText]}>
              Reserve
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'menu' && (
          <View style={styles.menuContent}>
            {/* Category Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {restaurant.menu.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryPill,
                    selectedCategory === index && styles.categoryPillActive,
                  ]}
                  onPress={() => setSelectedCategory(index)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === index && styles.categoryTextActive,
                    ]}
                  >
                    {category.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Menu Items */}
            <View style={styles.menuList}>
              <Text style={styles.categoryTitle}>
                {restaurant.menu[selectedCategory].category}
              </Text>
              {restaurant.menu[selectedCategory].items.map((item, index) => (
                <View key={index}>{renderMenuItem({ item })}</View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'reserve' && (
          <View style={styles.reserveContent}>
            <View style={styles.reserveCard}>
              <Ionicons name="calendar" size={48} color="#FFC107" />
              <Text style={styles.reserveTitle}>Reserve a Table</Text>
              <Text style={styles.reserveDescription}>
                Book your table for a great dining experience
              </Text>
              <TouchableOpacity
                style={styles.reserveButton}
                onPress={() => router.push('/reservation')}
              >
                <Text style={styles.reserveButtonText}>Make Reservation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'info' && (
          <View style={styles.infoContent}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={24} color="#FFC107" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{restaurant.address}</Text>
                <Text style={styles.infoValue}>{restaurant.city}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={24} color="#FFC107" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Opening Hours</Text>
                <Text style={styles.infoValue}>{restaurant.openingHours}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="call" size={24} color="#FFC107" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Contact</Text>
                <Text style={styles.infoValue}>+1 (555) 123-4567</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      {activeTab === 'menu' && cartItemCount > 0 && (
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => router.push('/cart')}
        >
          <View style={styles.cartButtonContent}>
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{cartItemCount}</Text>
            </View>
            <Text style={styles.cartButtonText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  heroPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    color: '#000',
    marginLeft: 4,
    fontWeight: '600',
  },
  separator: {
    marginHorizontal: 8,
    color: '#999',
  },
  cuisine: {
    fontSize: 16,
    color: '#666',
  },
  price: {
    fontSize: 16,
    color: '#666',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryTime: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  tabs: {
    flexDirection: 'row',
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
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#000',
  },
  menuContent: {
    flex: 1,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#FFC107',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#000',
  },
  menuList: {
    padding: 16,
    paddingBottom: 100,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemContent: {
    flex: 1,
    marginRight: 12,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reserveContent: {
    padding: 24,
    alignItems: 'center',
  },
  reserveCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    width: '100%',
  },
  reserveTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  reserveDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  reserveButton: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  reserveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  infoContent: {
    padding: 16,
  },
  infoItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
  },
  cartButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFC107',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountBadge: {
    backgroundColor: '#000',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cartCountText: {
    color: '#FFC107',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
  },
});
