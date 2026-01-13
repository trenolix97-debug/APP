import Constants from 'expo-constants';
import { Restaurant, Order, Reservation } from '../types';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL || '';

const API_BASE = `${BACKEND_URL}/api`;

export const api = {
  // Restaurants
  getRestaurants: async (search?: string, cuisine?: string): Promise<Restaurant[]> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (cuisine) params.append('cuisine', cuisine);
    const url = `${API_BASE}/restaurants${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    return response.json();
  },

  getRestaurant: async (id: string): Promise<Restaurant> => {
    const response = await fetch(`${API_BASE}/restaurants/${id}`);
    return response.json();
  },

  // Orders
  createOrder: async (orderData: any): Promise<Order> => {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return response.json();
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await fetch(`${API_BASE}/orders`);
    return response.json();
  },

  // Reservations
  createReservation: async (reservationData: any): Promise<Reservation> => {
    const response = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData),
    });
    return response.json();
  },

  getReservations: async (): Promise<Reservation[]> => {
    const response = await fetch(`${API_BASE}/reservations`);
    return response.json();
  },
};
