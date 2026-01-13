import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface Table {
  tableNumber: string;
  capacity: number;
  x: number;
  y: number;
  available: boolean;
}

interface FloorPlanSelectorProps {
  restaurantId: string;
  onTablesSelected: (tables: Table[], totalCapacity: number) => void;
  selectedTables: Table[];
}

const { width } = Dimensions.get('window');
const PLAN_WIDTH = width - 32;
const PLAN_HEIGHT = 450;

export default function FloorPlanSelector({
  restaurantId,
  onTablesSelected,
  selectedTables,
}: FloorPlanSelectorProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFloorPlan();
  }, [restaurantId]);

  const loadFloorPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/restaurants/${restaurantId}/floor-plan`);
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Error loading floor plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTablePress = (table: Table) => {
    if (!table.available) return;

    const isSelected = selectedTables.some((t) => t.tableNumber === table.tableNumber);
    let newSelectedTables: Table[];

    if (isSelected) {
      // Deselect
      newSelectedTables = selectedTables.filter((t) => t.tableNumber !== table.tableNumber);
    } else {
      // Select
      newSelectedTables = [...selectedTables, table];
    }

    const totalCapacity = newSelectedTables.reduce((sum, t) => sum + t.capacity, 0);
    onTablesSelected(newSelectedTables, totalCapacity);
  };

  const isTableSelected = (tableNumber: string) => {
    return selectedTables.some((t) => t.tableNumber === tableNumber);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={styles.loadingText}>Loading floor plan...</Text>
      </View>
    );
  }

  const totalCapacity = selectedTables.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Table</Text>
      <Text style={styles.subtitle}>Tap to select one or multiple tables</Text>

      {/* Selected Tables Summary */}
      {selectedTables.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Selected:</Text>
              <Text style={styles.summaryValue}>
                {selectedTables.map((t) => t.tableNumber).join(' + ')}
              </Text>
              <Text style={styles.capacityText}>
                Total capacity: {totalCapacity} people
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Floor Plan */}
      <ScrollView 
        style={styles.floorPlanScroll}
        contentContainerStyle={styles.floorPlanScrollContent}
      >
        <View style={[styles.floorPlan, { width: PLAN_WIDTH, height: PLAN_HEIGHT }]}>
          <View style={styles.floorPlanBackground}>
            <Text style={styles.floorPlanLabel}>Restaurant Floor Plan</Text>
          </View>

          {tables.map((table) => {
            const selected = isTableSelected(table.tableNumber);
            const xPos = (table.x / 100) * PLAN_WIDTH - 35;
            const yPos = (table.y / 160) * PLAN_HEIGHT - 35;

            return (
              <TouchableOpacity
                key={table.tableNumber}
                style={[
                  styles.table,
                  {
                    left: xPos,
                    top: yPos,
                  },
                  !table.available && styles.tableUnavailable,
                  selected && styles.tableSelected,
                ]}
                onPress={() => handleTablePress(table)}
                disabled={!table.available}
              >
                <View style={styles.tableContent}>
                  <Text
                    style={[
                      styles.tableNumber,
                      !table.available && styles.tableNumberUnavailable,
                      selected && styles.tableNumberSelected,
                    ]}
                  >
                    {table.tableNumber}
                  </Text>
                  <View
                    style={[
                      styles.capacityBadge,
                      !table.available && styles.capacityBadgeUnavailable,
                      selected && styles.capacityBadgeSelected,
                    ]}
                  >
                    <Ionicons
                      name="people"
                      size={12}
                      color={selected ? '#000' : table.available ? '#666' : '#999'}
                    />
                    <Text
                      style={[
                        styles.capacityText2,
                        !table.available && styles.capacityTextUnavailable,
                        selected && styles.capacityTextSelected,
                      ]}
                    >
                      {table.capacity}
                    </Text>
                  </View>
                </View>
                {selected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={16} color="#000" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#FFFFFF' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#FFC107' }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#E0E0E0' }]} />
          <Text style={styles.legendText}>Unavailable</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  capacityText: {
    fontSize: 14,
    color: '#388E3C',
    fontWeight: '600',
  },
  floorPlanScroll: {
    flex: 1,
  },
  floorPlanScrollContent: {
    padding: 16,
  },
  floorPlan: {
    position: 'relative',
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  floorPlanBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floorPlanLabel: {
    fontSize: 18,
    color: '#DDD',
    fontWeight: 'bold',
  },
  table: {
    position: 'absolute',
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tableSelected: {
    backgroundColor: '#FFC107',
    borderColor: '#FFA000',
    borderWidth: 3,
    elevation: 4,
  },
  tableUnavailable: {
    backgroundColor: '#E0E0E0',
    borderColor: '#BDBDBD',
  },
  tableContent: {
    alignItems: 'center',
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  tableNumberSelected: {
    color: '#000',
  },
  tableNumberUnavailable: {
    color: '#999',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  capacityBadgeSelected: {
    backgroundColor: '#FFFFFF',
  },
  capacityBadgeUnavailable: {
    backgroundColor: '#F0F0F0',
  },
  capacityText2: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
    fontWeight: '600',
  },
  capacityTextSelected: {
    color: '#000',
  },
  capacityTextUnavailable: {
    color: '#999',
  },
  checkmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFC107',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
});
