import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, currentRestaurant, getTotalPrice, clearCart } = useStore();
  
  const [selectedOrderType, setSelectedOrderType] = useState<'delivery' | 'pickup' | 'dine-in' | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [timeOption, setTimeOption] = useState<'now' | 'custom' | null>(null);
  const [customTime, setCustomTime] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate time slots for next 12 hours
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() + i * 30 * 60000); // 30 min intervals
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      slots.push(`${hours}:${minutes}`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handlePlaceOrder = async () => {
    if (!selectedOrderType) {
      Alert.alert('Error', 'Please select an order type');
      return;
    }

    if (selectedOrderType === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter a delivery address');
      return;
    }

    if (!currentRestaurant) {
      Alert.alert('Error', 'Restaurant information not available');
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        restaurantId: currentRestaurant.id,
        restaurantName: currentRestaurant.name,
        items: cart,
        orderType: selectedOrderType,
        totalPrice: getTotalPrice(),
        deliveryAddress: selectedOrderType === 'delivery' ? deliveryAddress : undefined,
        pickupTime: selectedOrderType === 'pickup' ? 'ASAP' : undefined,
      };

      await api.createOrder(orderData);
      clearCart();
      router.replace('/order-confirmation');
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.restaurantName}>{currentRestaurant?.name}</Text>
            <Text style={styles.itemCount}>{cart.length} items</Text>
            <Text style={styles.totalPrice}>${getTotalPrice().toFixed(2)}</Text>
          </View>
        </View>

        {/* Order Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Order Type</Text>
          
          <TouchableOpacity
            style={[
              styles.orderTypeCard,
              selectedOrderType === 'delivery' && styles.orderTypeCardActive,
            ]}
            onPress={() => setSelectedOrderType('delivery')}
          >
            <Ionicons 
              name="bicycle" 
              size={32} 
              color={selectedOrderType === 'delivery' ? '#FFC107' : '#666'} 
            />
            <View style={styles.orderTypeContent}>
              <Text style={styles.orderTypeTitle}>Delivery</Text>
              <Text style={styles.orderTypeDescription}>
                Get it delivered to your door
              </Text>
            </View>
            {selectedOrderType === 'delivery' && (
              <Ionicons name="checkmark-circle" size={24} color="#FFC107" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.orderTypeCard,
              selectedOrderType === 'pickup' && styles.orderTypeCardActive,
            ]}
            onPress={() => setSelectedOrderType('pickup')}
          >
            <Ionicons 
              name="bag-handle" 
              size={32} 
              color={selectedOrderType === 'pickup' ? '#FFC107' : '#666'} 
            />
            <View style={styles.orderTypeContent}>
              <Text style={styles.orderTypeTitle}>Pickup</Text>
              <Text style={styles.orderTypeDescription}>
                Pick up at the restaurant
              </Text>
            </View>
            {selectedOrderType === 'pickup' && (
              <Ionicons name="checkmark-circle" size={24} color="#FFC107" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.orderTypeCard,
              selectedOrderType === 'dine-in' && styles.orderTypeCardActive,
            ]}
            onPress={() => setSelectedOrderType('dine-in')}
          >
            <Ionicons 
              name="restaurant" 
              size={32} 
              color={selectedOrderType === 'dine-in' ? '#FFC107' : '#666'} 
            />
            <View style={styles.orderTypeContent}>
              <Text style={styles.orderTypeTitle}>Dine-in</Text>
              <Text style={styles.orderTypeDescription}>
                Order and eat at the restaurant
              </Text>
            </View>
            {selectedOrderType === 'dine-in' && (
              <Ionicons name="checkmark-circle" size={24} color="#FFC107" />
            )}
          </TouchableOpacity>
        </View>

        {/* Delivery Address */}
        {selectedOrderType === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adresa de Livrare</Text>
            <TextInput
              style={styles.input}
              placeholder="Introduceți adresa de livrare"
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Timing Selection */}
        {selectedOrderType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedOrderType === 'delivery' ? 'Când doriți livrarea?' : 
               selectedOrderType === 'pickup' ? 'Când ridicați comanda?' : 
               'Când ajungeți la restaurant?'}
            </Text>
            
            <TouchableOpacity
              style={[
                styles.timeOptionCard,
                timeOption === 'now' && styles.timeOptionCardActive,
              ]}
              onPress={() => {
                setTimeOption('now');
                setCustomTime('');
              }}
            >
              <Ionicons 
                name="flash" 
                size={32} 
                color={timeOption === 'now' ? '#FFC107' : '#666'} 
              />
              <View style={styles.timeOptionContent}>
                <Text style={styles.timeOptionTitle}>Acum (ASAP)</Text>
                <Text style={styles.timeOptionDescription}>
                  Cât mai repede posibil
                </Text>
              </View>
              {timeOption === 'now' && (
                <Ionicons name="checkmark-circle" size={24} color="#FFC107" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.timeOptionCard,
                timeOption === 'custom' && styles.timeOptionCardActive,
              ]}
              onPress={() => setTimeOption('custom')}
            >
              <Ionicons 
                name="time" 
                size={32} 
                color={timeOption === 'custom' ? '#FFC107' : '#666'} 
              />
              <View style={styles.timeOptionContent}>
                <Text style={styles.timeOptionTitle}>Alege Ora</Text>
                <Text style={styles.timeOptionDescription}>
                  Selectează timpul exact
                </Text>
              </View>
              {timeOption === 'custom' && (
                <Ionicons name="checkmark-circle" size={24} color="#FFC107" />
              )}
            </TouchableOpacity>

            {/* Time Picker */}
            {timeOption === 'custom' && (
              <View style={styles.timePickerContainer}>
                <Text style={styles.timePickerLabel}>Selectează ora:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.timeSlotScroll}
                >
                  {timeSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.timeSlot,
                        customTime === slot && styles.timeSlotActive,
                      ]}
                      onPress={() => setCustomTime(slot)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          customTime === slot && styles.timeSlotTextActive,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Payment Mock */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentCard}>
            <Ionicons name="card" size={24} color="#666" />
            <Text style={styles.paymentText}>**** **** **** 1234</Text>
            <Text style={styles.paymentBadge}>Demo</Text>
          </View>
        </View>
      </View>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, loading && styles.buttonDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          <Text style={styles.placeOrderButtonText}>
            {loading ? 'Processing...' : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  itemCount: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  orderTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  orderTypeCardActive: {
    borderColor: '#FFC107',
    backgroundColor: '#FFF9E6',
  },
  orderTypeContent: {
    flex: 1,
    marginLeft: 16,
  },
  orderTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  orderTypeDescription: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  paymentText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 16,
  },
  paymentBadge: {
    backgroundColor: '#E8F5E9',
    color: '#388E3C',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  placeOrderButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});
