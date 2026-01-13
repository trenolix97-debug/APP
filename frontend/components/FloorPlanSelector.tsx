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
const PLAN_HEIGHT = 480;

const getTableSize = (capacity: number) => {
  if (capacity <= 2) return { width: 55, height: 55, shape: 'round' };
  if (capacity <= 4) return { width: 70, height: 70, shape: 'square' };
  if (capacity <= 6) return { width: 90, height: 60, shape: 'rect' };
  return { width: 110, height: 70, shape: 'rect' };
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
        <Text style={styles.loadingText}>Se încarcă planul...</Text>
      </View>
    );
  }

  const totalCapacity = selectedTables.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selectează Masa</Text>
      <Text style={styles.subtitle}>Apasă pentru a selecta una sau mai multe mese</Text>

      {selectedTables.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryIcon}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Selectate:</Text>
              <Text style={styles.summaryValue}>
                {selectedTables.map((t) => t.tableNumber).join(' + ')}
              </Text>
            </View>
            <View style={styles.capacityBadge}>
              <Ionicons name="people" size={14} color="#388E3C" />
              <Text style={styles.capacityText}>{totalCapacity}</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView 
        style={styles.floorPlanScroll}
        contentContainerStyle={styles.floorPlanScrollContent}
      >
        <View style={[styles.floorPlan, { width: PLAN_WIDTH, height: PLAN_HEIGHT }]}>
          
          {/* Restaurant Areas - Elegant Lines */}
          
          {/* Kitchen */}
          <View style={[styles.area, styles.kitchen, { 
            top: 12, 
            left: 12, 
            width: PLAN_WIDTH * 0.22, 
            height: 60 
          }]}>
            <View style={styles.areaIcon}>
              <Ionicons name="restaurant-outline" size={16} color="#999" />
            </View>
            <Text style={styles.areaLabel}>Bucătărie</Text>
          </View>

          {/* Entrance */}
          <View style={[styles.area, styles.entrance, { 
            bottom: 12, 
            left: PLAN_WIDTH / 2 - 45, 
            width: 90, 
            height: 45 
          }]}>
            <View style={styles.areaIcon}>
              <Ionicons name="enter-outline" size={16} color="#666" />
            </View>
            <Text style={styles.areaLabel}>Intrare</Text>
          </View>

          {/* Restroom */}
          <View style={[styles.area, styles.restroom, { 
            top: 12, 
            right: 12, 
            width: PLAN_WIDTH * 0.18, 
            height: 55 
          }]}>
            <View style={styles.areaIcon}>
              <Ionicons name="man-outline" size={16} color="#999" />
            </View>
            <Text style={styles.areaLabel}>Baie</Text>
          </View>

          {/* Watermark */}
          <View style={styles.watermark}>
            <Text style={styles.watermarkText}>Plan Restaurant</Text>
          </View>

          {/* Tables - Elegant Design */}
          {tables.map((table) => {
            const selected = isTableSelected(table.tableNumber);
            const tableSize = getTableSize(table.capacity);
            
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
                    borderRadius: tableSize.shape === 'round' ? tableSize.width / 2 : 8,
                  },
                  !table.available && styles.tableUnavailable,
                  selected && styles.tableSelected,
                ]}
                onPress={() => handleTablePress(table)}
                disabled={!table.available}
                activeOpacity={0.7}
              >
                {/* Table Surface */}
                <View style={[
                  styles.tableSurface,
                  {
                    borderRadius: tableSize.shape === 'round' ? tableSize.width / 2 : 6,
                  },
                  !table.available && styles.tableSurfaceUnavailable,
                  selected && styles.tableSurfaceSelected,
                ]}>
                  {/* Table Number */}
                  <Text
                    style={[
                      styles.tableNumber,
                      { fontSize: tableSize.width > 65 ? 14 : 12 },
                      !table.available && styles.tableNumberUnavailable,
                      selected && styles.tableNumberSelected,
                    ]}
                  >
                    {table.tableNumber}
                  </Text>
                  
                  {/* Capacity Badge */}
                  <View
                    style={[
                      styles.tableCapacity,
                      !table.available && styles.tableCapacityUnavailable,
                      selected && styles.tableCapacitySelected,
                    ]}
                  >
                    <Ionicons
                      name="person"
                      size={10}
                      color={selected ? '#000' : table.available ? '#666' : '#999'}
                    />
                    <Text
                      style={[
                        styles.capacityNumber,
                        { color: selected ? '#000' : table.available ? '#666' : '#999' },
                      ]}
                    >
                      {table.capacity}
                    </Text>
                  </View>

                  {/* Chairs - Minimalist Dots */}
                  {Array.from({ length: Math.min(table.capacity, 4) }).map((_, idx) => {
                    const positions = [
                      { top: -3, left: '50%', marginLeft: -2.5 },
                      { bottom: -3, left: '50%', marginLeft: -2.5 },
                      { left: -3, top: '50%', marginTop: -2.5 },
                      { right: -3, top: '50%', marginTop: -2.5 },
                    ];
                    return (
                      <View
                        key={idx}
                        style={[
                          styles.chairDot,
                          positions[idx],
                          {
                            backgroundColor: selected ? '#FFC107' : 
                                          table.available ? '#AAA' : '#CCC',
                          },
                        ]}
                      />
                    );
                  })}
                </View>

                {/* Selected Indicator */}
                {selected && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend - Minimalist */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FAFAFA' }]} />
          <Text style={styles.legendText}>Disponibilă</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFC107' }]} />
          <Text style={styles.legendText}>Selectată</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E8E8E8' }]} />
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
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    paddingHorizontal: 16,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    paddingHorizontal: 16,
    fontWeight: '400',
  },
  summaryCard: {
    backgroundColor: '#F0F9F1',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1F0E3',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    marginRight: 10,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.2,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1F0E3',
  },
  capacityText: {
    fontSize: 13,
    color: '#388E3C',
    marginLeft: 4,
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
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  area: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#DDD',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  kitchen: {
    backgroundColor: 'rgba(255, 240, 240, 0.3)',
    borderColor: '#E8D4D4',
  },
  entrance: {
    backgroundColor: 'rgba(230, 245, 230, 0.3)',
    borderColor: '#D4E8D4',
  },
  restroom: {
    backgroundColor: 'rgba(240, 248, 255, 0.3)',
    borderColor: '#D4DDE8',
  },
  areaIcon: {
    marginBottom: 2,
  },
  areaLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -10 }],
    opacity: 0.06,
  },
  watermarkText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
  },
  table: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableSelected: {
    zIndex: 10,
  },
  tableUnavailable: {
    opacity: 0.5,
  },
  tableSurface: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tableSurfaceSelected: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFC107',
    borderWidth: 2,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tableSurfaceUnavailable: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  tableNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  tableNumberSelected: {
    color: '#000',
    fontWeight: '700',
  },
  tableNumberUnavailable: {
    color: '#AAA',
  },
  tableCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  tableCapacitySelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFC107',
  },
  tableCapacityUnavailable: {
    backgroundColor: '#FAFAFA',
    borderColor: '#F0F0F0',
  },
  capacityNumber: {
    fontSize: 10,
    marginLeft: 2,
    fontWeight: '600',
  },
  chairDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
  },
  legendText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
});
