import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../store/useStore';
import { api } from '../utils/api';
import { format, addDays } from 'date-fns';
import FloorPlanSelector from '../components/FloorPlanSelector';

interface Table {
  tableNumber: string;
  capacity: number;
  x: number;
  y: number;
  available: boolean;
}

type Step = 'tables' | 'datetime' | 'food-decision' | 'confirm';

export default function ReservationScreen() {
  const router = useRouter();
  const { currentRestaurant, cart, getTotalPrice, clearCart } = useStore();
  
  // Step 1: Tables
  const [step, setStep] = useState<Step>('tables');
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);
  const [totalCapacity, setTotalCapacity] = useState(0);
  
  // Step 2: Date/Time
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState('19:00');
  const [duration, setDuration] = useState(60);
  
  // Step 3: Food decision
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
    if (step === 'tables') {
      if (selectedTables.length === 0) {
        Alert.alert('Select Tables', 'Please select at least one table');
        return;
      }
      setStep('datetime');
    } else if (step === 'datetime') {
      setStep('food-decision');
    } else if (step === 'food-decision') {
      if (wantsFoodPreOrder === true) {
        Alert.alert(
          'Add Food',
          'Go back to the restaurant menu to add items to your cart, then return to complete your reservation.',
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

  const handleBack = () => {
    if (step === 'datetime') setStep('tables');
    else if (step === 'food-decision') setStep('datetime');
    else if (step === 'confirm') setStep('food-decision');
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
        people: totalCapacity,
        selectedTables: selectedTables.map(t => ({
          tableNumber: t.tableNumber,
          capacity: t.capacity,
        })),
        totalCapacity,
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

  const renderTablesStep = () => (
    <FloorPlanSelector
      restaurantId={currentRestaurant?.id || ''}
      onTablesSelected={(tables, capacity) => {
        setSelectedTables(tables);
        setTotalCapacity(capacity);
      }}
      selectedTables={selectedTables}
    />
  );

  const renderDateTimeStep = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>When would you like to visit?</Text>

      {/* Selected Tables Reminder */}
      <View style={styles.reminderCard}>
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        <View style={styles.reminderText}>
          <Text style={styles.reminderLabel}>Selected Tables:</Text>
          <Text style={styles.reminderValue}>
            {selectedTables.map(t => t.tableNumber).join(' + ')} ({totalCapacity} people)
          </Text>
        </View>
      </View>

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
    </ScrollView>
  );

  const renderFoodDecisionStep = () => (
    <ScrollView style={styles.stepContent}>
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
    </ScrollView>
  );

  const renderConfirmStep = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Confirm Reservation</Text>

      <View style={styles.confirmCard}>
        <View style={styles.confirmRow}>
          <Ionicons name="business" size={20} color="#666" />
          <Text style={styles.confirmLabel}>Restaurant</Text>
          <Text style={styles.confirmValue}>{currentRestaurant?.name}</Text>
        </View>

        <View style={styles.confirmRow}>
          <Ionicons name="grid" size={20} color="#666" />
          <Text style={styles.confirmLabel}>Tables</Text>
          <Text style={styles.confirmValue}>
            {selectedTables.map(t => t.tableNumber).join(' + ')}
          </Text>
        </View>

        <View style={styles.confirmRow}>
          <Ionicons name="people" size={20} color="#666" />
          <Text style={styles.confirmLabel}>Capacity</Text>
          <Text style={styles.confirmValue}>{totalCapacity} people</Text>
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
    </ScrollView>
  );

  const getProgressWidth = () => {
    if (step === 'tables') return '25%';
    if (step === 'datetime') return '50%';
    if (step === 'food-decision') return '75%';
    return '100%';
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: getProgressWidth() }]} />
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        {step === 'tables' && renderTablesStep()}
        {step === 'datetime' && renderDateTimeStep()}
        {step === 'food-decision' && renderFoodDecisionStep()}
        {step === 'confirm' && renderConfirmStep()}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.footer}>
        {step !== 'tables' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.nextButton,
            (step === 'tables' && selectedTables.length === 0) && styles.buttonDisabled,
            (step === 'food-decision' && wantsFoodPreOrder === null) && styles.buttonDisabled,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={
            (step === 'tables' && selectedTables.length === 0) ||
            (step === 'food-decision' && wantsFoodPreOrder === null) ||
            loading
          }
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
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
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
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reminderText: {
    marginLeft: 12,
    flex: 1,
  },
  reminderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reminderValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#388E3C',
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
