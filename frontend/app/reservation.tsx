import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';
import { format, addDays } from 'date-fns';

export default function ReservationScreen() {
  const router = useRouter();
  const { currentRestaurant, cart, getTotalPrice, clearCart } = useStore();
  
  const [step, setStep] = useState<'details' | 'food-decision' | 'menu' | 'confirm'>('details');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [duration, setDuration] = useState(60);
  const [people, setPeople] = useState(2);
  const [wantsFoodPreOrder, setWantsFoodPreOrder] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const durations = [30, 60, 90, 120];
  const timeSlots = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'MMM dd'),
    };
  });

  const handleNext = () => {
    if (step === 'details') {
      setStep('food-decision');
    } else if (step === 'food-decision') {
      if (wantsFoodPreOrder === true) {
        // Navigate to restaurant menu to add food
        Alert.alert(
          'Add Food',
          'You can add items from the restaurant menu. Go back to the restaurant page to add items to cart, then return here.',
          [
            {
              text: 'Go to Menu',
              onPress: () => router.back(),
            },
            {
              text: 'Skip for now',
              onPress: () => {
                setWantsFoodPreOrder(false);
                setStep('confirm');
              },
            },
          ]
        );
      } else {
        setStep('confirm');
      }
    } else if (step === 'confirm') {
      handleConfirmReservation();
    }
  };

  const handleConfirmReservation = async () => {
    if (!currentRestaurant) {
      Alert.alert('Error', 'Restaurant information not available');
      return;
    }

    try {
      setLoading(true);
      const reservationData = {
        restaurantId: currentRestaurant.id,
        restaurantName: currentRestaurant.name,
        date: selectedDate,
        time: selectedTime,
        duration,
        people,
        preOrderedFood: wantsFoodPreOrder ? cart : [],
        totalPrice: wantsFoodPreOrder ? getTotalPrice() : 0,
      };

      await api.createReservation(reservationData);
      if (wantsFoodPreOrder) {
        clearCart();
      }
      router.replace('/reservation-confirmation');
    } catch (error) {
      console.error('Error creating reservation:', error);
      Alert.alert('Error', 'Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDetailsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Reservation Details</Text>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
          {dates.map((date) => (
            <TouchableOpacity
              key={date.value}
              style={[
                styles.optionChip,
                selectedDate === date.value && styles.optionChipActive,
              ]}
              onPress={() => setSelectedDate(date.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedDate === date.value && styles.optionTextActive,
                ]}
              >
                {date.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Time Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Select Time</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.optionChip,
                selectedTime === time && styles.optionChipActive,
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedTime === time && styles.optionTextActive,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Duration Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Duration (minutes)</Text>
        <View style={styles.optionsGrid}>
          {durations.map((dur) => (
            <TouchableOpacity
              key={dur}
              style={[
                styles.gridOption,
                duration === dur && styles.optionChipActive,
              ]}
              onPress={() => setDuration(dur)}
            >
              <Text
                style={[
                  styles.optionText,
                  duration === dur && styles.optionTextActive,
                ]}
              >
                {dur} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Number of People */}
      <View style={styles.section}>
        <Text style={styles.label}>Number of People</Text>
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => setPeople(Math.max(1, people - 1))}
          >
            <Ionicons name="remove" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.counterValue}>{people}</Text>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => setPeople(Math.min(20, people + 1))}
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFoodDecisionStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pre-order Food?</Text>
      <Text style={styles.stepDescription}>
        Would you like to pre-order food for this reservation? Your food will be prepared and ready when you arrive.
      </Text>

      <TouchableOpacity
        style={[
          styles.decisionCard,
          wantsFoodPreOrder === true && styles.decisionCardActive,
        ]}
        onPress={() => setWantsFoodPreOrder(true)}
      >
        <Ionicons
          name="restaurant"
          size={48}
          color={wantsFoodPreOrder === true ? '#FFC107' : '#666'}
        />
        <Text style={styles.decisionTitle}>Yes, pre-order food</Text>
        <Text style={styles.decisionDescription}>
          Add items from the menu and we'll have them ready
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.decisionCard,
          wantsFoodPreOrder === false && styles.decisionCardActive,
        ]}
        onPress={() => setWantsFoodPreOrder(false)}
      >
        <Ionicons
          name="calendar"
          size={48}
          color={wantsFoodPreOrder === false ? '#FFC107' : '#666'}
        />
        <Text style={styles.decisionTitle}>No, just reserve table</Text>
        <Text style={styles.decisionDescription}>
          Reserve the table only, order when you arrive
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Confirm Reservation</Text>

      <View style={styles.confirmCard}>
        <View style={styles.confirmRow}>
          <Ionicons name="business" size={20} color="#666" />
          <Text style={styles.confirmLabel}>Restaurant</Text>
          <Text style={styles.confirmValue}>{currentRestaurant?.name}</Text>
        </View>

        <View style={styles.confirmRow}>
          <Ionicons name="calendar" size={20} color="#666" />
          <Text style={styles.confirmLabel}>Date</Text>
          <Text style={styles.confirmValue}>{selectedDate}</Text>
        </View>

        <View style={styles.confirmRow}>
          <Ionicons name="time" size={20} color="#666" />
          <Text style={styles.confirmLabel}>Time</Text>
          <Text style={styles.confirmValue}>{selectedTime}</Text>
        </View>

        <View style={styles.confirmRow}>
          <Ionicons name="hourglass" size={20} color="#666" />
          <Text style={styles.confirmLabel}>Duration</Text>
          <Text style={styles.confirmValue}>{duration} minutes</Text>
        </View>

        <View style={styles.confirmRow}>
          <Ionicons name="people" size={20} color="#666" />
          <Text style={styles.confirmLabel}>People</Text>
          <Text style={styles.confirmValue}>{people}</Text>
        </View>
      </View>

      {wantsFoodPreOrder && cart.length > 0 && (
        <View style={styles.foodSection}>
          <Text style={styles.foodSectionTitle}>Pre-ordered Food</Text>
          {cart.map((item, index) => (
            <View key={index} style={styles.foodItem}>
              <Text style={styles.foodItemName}>
                {item.quantity}x {item.name}
              </Text>
              <Text style={styles.foodItemPrice}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Food Total</Text>
            <Text style={styles.totalValue}>${getTotalPrice().toFixed(2)}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width:
                step === 'details'
                  ? '33%'
                  : step === 'food-decision'
                  ? '66%'
                  : '100%',
            },
          ]}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {step === 'details' && renderDetailsStep()}
        {step === 'food-decision' && renderFoodDecisionStep()}
        {step === 'confirm' && renderConfirmStep()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {step !== 'details' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === 'food-decision') setStep('details');
              else if (step === 'confirm') setStep('food-decision');
            }}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            (step === 'food-decision' && wantsFoodPreOrder === null) && styles.buttonDisabled,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={(step === 'food-decision' && wantsFoodPreOrder === null) || loading}
        >
          <Text style={styles.nextButtonText}>
            {loading
              ? 'Processing...'
              : step === 'confirm'
              ? 'Confirm Reservation'
              : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFC107',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  optionsScroll: {
    flexDirection: 'row',
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionChipActive: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#000',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  gridOption: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginHorizontal: 32,
    minWidth: 60,
    textAlign: 'center',
  },
  decisionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  decisionCardActive: {
    borderColor: '#FFC107',
    backgroundColor: '#FFF9E6',
  },
  decisionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 12,
    marginBottom: 8,
  },
  decisionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  confirmLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  foodSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  foodSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  foodItemName: {
    fontSize: 14,
    color: '#000',
  },
  foodItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#FFC107',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
