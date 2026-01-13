export interface MenuItem {
  name: string;
  description: string;
  price: number;
  image?: string;
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  logo?: string;
  heroImage?: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  address: string;
  city: string;
  deliveryTime: string;
  latitude: number;
  longitude: number;
  menu: MenuCategory[];
  openingHours?: string;
}

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id?: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  orderType: string;
  status: string;
  totalPrice: number;
  deliveryAddress?: string;
  pickupTime?: string;
  createdAt?: string;
}

export interface Reservation {
  id?: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  time: string;
  duration: number;
  people: number;
  preOrderedFood: CartItem[];
  status: string;
  totalPrice: number;
  qrCode?: string;
  createdAt?: string;
}
