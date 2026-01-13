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
const PLAN_HEIGHT = 500;

// Table size based on capacity
const getTableSize = (capacity: number) => {
  if (capacity <= 2) return { width: 60, height: 60, shape: 'round' };
  if (capacity <= 4) return { width: 80, height: 80, shape: 'square' };
  if (capacity <= 6) return { width: 100, height: 70, shape: 'rect' };
  return { width: 120, height: 80, shape: 'rect' };
};

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
      newSelectedTables = selectedTables.filter((t) => t.tableNumber !== table.tableNumber);
    } else {
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
        <Text style={styles.loadingText}>Se încarcă planul restaurantului...</Text>
      </View>
    );
  }

  const totalCapacity = selectedTables.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selectează Masa</Text>
      <Text style={styles.subtitle}>Apasă pentru a selecta una sau mai multe mese</Text>

      {/* Selected Tables Summary */}
      {selectedTables.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Selectate:</Text>
              <Text style={styles.summaryValue}>
                {selectedTables.map((t) => t.tableNumber).join(' + ')}
              </Text>
              <Text style={styles.capacityText}>
                Capacitate totală: {totalCapacity} persoane
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
          
          {/* Restaurant Background Structure */}
          
          {/* Kitchen Area */}
          <View style={[styles.roomArea, styles.kitchen, { 
            top: 10, 
            left: 10, 
            width: PLAN_WIDTH * 0.25, 
            height: 80 
          }]}>
            <Ionicons name="restaurant" size={20} color="#999" />
            <Text style={styles.roomLabel}>Bucătărie</Text>
          </View>

          {/* Entrance */}
          <View style={[styles.roomArea, styles.entrance, { 
            top: PLAN_HEIGHT - 70, 
            left: PLAN_WIDTH / 2 - 50, 
            width: 100, 
            height: 60 
          }]}>
            <Ionicons name="enter" size={20} color="#666" />
            <Text style={styles.roomLabel}>Intrare</Text>
          </View>

          {/* Restroom */}
          <View style={[styles.roomArea, styles.restroom, { 
            top: 10, 
            right: 10, 
            width: PLAN_WIDTH * 0.2, 
            height: 70 
          }]}>
            <Ionicons name="man" size={18} color="#999" />
            <Text style={styles.roomLabel}>Baie</Text>
          </View>

          {/* Bar/Counter (if space allows) */}
          {PLAN_WIDTH > 300 && (
            <View style={[styles.roomArea, styles.bar, { 
              bottom: 100, 
              left: 10, 
              width: PLAN_WIDTH * 0.3, 
              height: 50 
            }]}>
              <Ionicons name="wine" size={18} color="#8D6E63" />
              <Text style={styles.roomLabel}>Bar</Text>
            </View>
          )}

          {/* Dining Area Label */}
          <View style={styles.diningAreaLabel}>
            <Text style={styles.diningAreaText}>Zona de Servire</Text>
          </View>

          {/* Tables */}
          {tables.map((table) => {
            const selected = isTableSelected(table.tableNumber);
            const tableSize = getTableSize(table.capacity);
            
            // Position calculation
            const xPos = (table.x / 100) * PLAN_WIDTH - tableSize.width / 2;
            const yPos = (table.y / 160) * PLAN_HEIGHT - tableSize.height / 2;

            return (
              <TouchableOpacity
                key={table.tableNumber}
                style={[
                  styles.table,
                  {
                    left: xPos,
                    top: yPos,
                    width: tableSize.width,
                    height: tableSize.height,
                    borderRadius: tableSize.shape === 'round' ? tableSize.width / 2 : 12,
                  },
                  !table.available && styles.tableUnavailable,
                  selected && styles.tableSelected,
                ]}
                onPress={() => handleTablePress(table)}
                disabled={!table.available}
              >
                {/* Table Top View - Wood Texture Effect */}
                <View style={[
                  styles.tableTop,
                  {
                    borderRadius: tableSize.shape === 'round' ? tableSize.width / 2 : 8,
                  }
                ]}>
                  <Text
                    style={[
                      styles.tableNumber,
                      { fontSize: tableSize.width > 70 ? 16 : 14 },
                      !table.available && styles.tableNumberUnavailable,
                      selected && styles.tableNumberSelected,
                    ]}
                  >
                    {table.tableNumber}
                  </Text>
                  
                  {/* Chairs indicators around table */}
                  {Array.from({ length: Math.min(table.capacity, 4) }).map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.chair,
                        {
                          position: 'absolute',
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          backgroundColor: selected ? '#FFD54F' : table.available ? '#8D6E63' : '#BDBDBD',
                        },
                        idx === 0 && { top: -6, left: '50%', marginLeft: -6 },
                        idx === 1 && { bottom: -6, left: '50%', marginLeft: -6 },
                        idx === 2 && { left: -6, top: '50%', marginTop: -6 },
                        idx === 3 && { right: -6, top: '50%', marginTop: -6 },
                      ]}
                    />
                  ))}

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
                      color={selected ? '#000' : table.available ? '#FFF' : '#999'}
                    />
                    <Text
                      style={[
                        styles.capacityText2,
                        { color: selected ? '#000' : table.available ? '#FFF' : '#999' },
                      ]}
                    >
                      {table.capacity}
                    </Text>
                  </View>
                </View>

                {selected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={18} color="#000" />
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
          <View style={[styles.legendCircle, { backgroundColor: '#8D6E63' }]} />
          <Text style={styles.legendText}>Disponibilă</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#FFC107' }]} />
          <Text style={styles.legendText}>Selectată</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendCircle, { backgroundColor: '#E0E0E0' }]} />
          <Text style={styles.legendText}>Ocupată</Text>
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
    backgroundColor: '#F5E6D3',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#8D6E63',
  },
  roomArea: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#999',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  kitchen: {
    backgroundColor: 'rgba(255, 235, 235, 0.6)',
  },
  entrance: {
    backgroundColor: 'rgba(200, 230, 201, 0.6)',
  },
  restroom: {
    backgroundColor: 'rgba(225, 245, 254, 0.6)',
  },
  bar: {
    backgroundColor: 'rgba(255, 243, 224, 0.6)',
  },
  roomLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
    marginTop: 4,
  },
  diningAreaLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -15 }],
    opacity: 0.15,
  },
  diningAreaText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8D6E63',
  },
  table: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  tableSelected: {
    elevation: 6,
    shadowOpacity: 0.4,
  },
  tableUnavailable: {
    elevation: 1,
    shadowOpacity: 0.1,
  },
  tableTop: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8D6E63',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#6D4C41',
  },
  chair: {
    borderWidth: 1,
    borderColor: '#5D4037',
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 4,
  },
  capacityBadgeSelected: {
    backgroundColor: '#FFFFFF',
  },
  capacityBadgeUnavailable: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  capacityText2: {
    fontSize: 12,
    marginLeft: 3,
    fontWeight: 'bold',
  },
  checkmark: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
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
  legendCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#6D4C41',
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});
