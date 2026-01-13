#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Food Super App
Tests all endpoints: restaurants, orders, and reservations
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Backend URL from frontend .env
BASE_URL = "https://platehub-1.preview.emergentagent.com/api"

class FoodAppTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.restaurant_ids = []
        self.test_results = {
            "restaurants": {"passed": 0, "failed": 0, "details": []},
            "orders": {"passed": 0, "failed": 0, "details": []},
            "reservations": {"passed": 0, "failed": 0, "details": []}
        }
        
    def log_result(self, category, test_name, passed, details=""):
        """Log test result"""
        if passed:
            self.test_results[category]["passed"] += 1
            status = "✅ PASS"
        else:
            self.test_results[category]["failed"] += 1
            status = "❌ FAIL"
        
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        
        self.test_results[category]["details"].append(result)
        print(result)
        
    def test_api_health(self):
        """Test basic API connectivity"""
        print(f"\n🔍 Testing API Health at {self.base_url}")
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                print("✅ API is accessible")
                return True
            else:
                print(f"❌ API returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API connection failed: {str(e)}")
            return False
    
    def test_restaurants_endpoints(self):
        """Test all restaurant-related endpoints"""
        print(f"\n🍽️  Testing Restaurant Endpoints")
        
        # Test GET /restaurants (all restaurants)
        try:
            response = self.session.get(f"{self.base_url}/restaurants")
            if response.status_code == 200:
                restaurants = response.json()
                if len(restaurants) >= 4:  # Should have 4 demo restaurants
                    self.restaurant_ids = [r["id"] for r in restaurants]
                    self.log_result("restaurants", "GET /restaurants", True, 
                                  f"Retrieved {len(restaurants)} restaurants")
                    
                    # Verify restaurant structure
                    first_restaurant = restaurants[0]
                    required_fields = ["id", "name", "cuisine", "rating", "menu"]
                    missing_fields = [f for f in required_fields if f not in first_restaurant]
                    if not missing_fields:
                        self.log_result("restaurants", "Restaurant data structure", True, 
                                      "All required fields present")
                    else:
                        self.log_result("restaurants", "Restaurant data structure", False, 
                                      f"Missing fields: {missing_fields}")
                else:
                    self.log_result("restaurants", "GET /restaurants", False, 
                                  f"Expected 4+ restaurants, got {len(restaurants)}")
            else:
                self.log_result("restaurants", "GET /restaurants", False, 
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("restaurants", "GET /restaurants", False, str(e))
        
        # Test GET /restaurants with search filter
        try:
            response = self.session.get(f"{self.base_url}/restaurants?search=Italian")
            if response.status_code == 200:
                restaurants = response.json()
                italian_found = any("italian" in r["cuisine"].lower() for r in restaurants)
                self.log_result("restaurants", "GET /restaurants?search=Italian", italian_found,
                              f"Found {len(restaurants)} results")
            else:
                self.log_result("restaurants", "GET /restaurants?search=Italian", False,
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("restaurants", "GET /restaurants?search=Italian", False, str(e))
        
        # Test GET /restaurants with cuisine filter
        try:
            response = self.session.get(f"{self.base_url}/restaurants?cuisine=Japanese")
            if response.status_code == 200:
                restaurants = response.json()
                japanese_found = any("japanese" in r["cuisine"].lower() for r in restaurants)
                self.log_result("restaurants", "GET /restaurants?cuisine=Japanese", japanese_found,
                              f"Found {len(restaurants)} Japanese restaurants")
            else:
                self.log_result("restaurants", "GET /restaurants?cuisine=Japanese", False,
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("restaurants", "GET /restaurants?cuisine=Japanese", False, str(e))
        
        # Test GET /restaurants/{id} for each restaurant
        if self.restaurant_ids:
            for i, restaurant_id in enumerate(self.restaurant_ids[:2]):  # Test first 2
                try:
                    response = self.session.get(f"{self.base_url}/restaurants/{restaurant_id}")
                    if response.status_code == 200:
                        restaurant = response.json()
                        has_menu = "menu" in restaurant and len(restaurant["menu"]) > 0
                        self.log_result("restaurants", f"GET /restaurants/{restaurant_id}", has_menu,
                                      f"Restaurant: {restaurant.get('name', 'Unknown')}")
                    else:
                        self.log_result("restaurants", f"GET /restaurants/{restaurant_id}", False,
                                      f"Status code: {response.status_code}")
                except Exception as e:
                    self.log_result("restaurants", f"GET /restaurants/{restaurant_id}", False, str(e))
    
    def test_orders_endpoints(self):
        """Test all order-related endpoints"""
        print(f"\n📦 Testing Order Endpoints")
        
        if not self.restaurant_ids:
            self.log_result("orders", "Order tests", False, "No restaurant IDs available")
            return
        
        # Test data for different order types
        order_tests = [
            {
                "type": "delivery",
                "data": {
                    "restaurantId": self.restaurant_ids[0],
                    "restaurantName": "Bella Italia",
                    "items": [
                        {"name": "Spaghetti Carbonara", "price": 16.99, "quantity": 1, "image": ""},
                        {"name": "Tiramisu", "price": 7.99, "quantity": 1, "image": ""}
                    ],
                    "orderType": "delivery",
                    "totalPrice": 24.98,
                    "deliveryAddress": "123 Test Street, New York, NY 10001"
                }
            },
            {
                "type": "pickup",
                "data": {
                    "restaurantId": self.restaurant_ids[1],
                    "restaurantName": "Sushi Master",
                    "items": [
                        {"name": "California Roll", "price": 9.99, "quantity": 2, "image": ""},
                        {"name": "Miso Soup", "price": 3.99, "quantity": 1, "image": ""}
                    ],
                    "orderType": "pickup",
                    "totalPrice": 23.97,
                    "pickupTime": "2024-01-15 18:30"
                }
            },
            {
                "type": "dine-in",
                "data": {
                    "restaurantId": self.restaurant_ids[2],
                    "restaurantName": "Burger Junction",
                    "items": [
                        {"name": "Double Deluxe", "price": 14.99, "quantity": 1, "image": ""},
                        {"name": "French Fries", "price": 3.99, "quantity": 1, "image": ""}
                    ],
                    "orderType": "dine-in",
                    "totalPrice": 18.98
                }
            }
        ]
        
        created_order_ids = []
        
        # Test POST /orders for each order type
        for order_test in order_tests:
            try:
                response = self.session.post(f"{self.base_url}/orders", 
                                           json=order_test["data"],
                                           headers={"Content-Type": "application/json"})
                if response.status_code == 200:
                    order = response.json()
                    if "id" in order and order["orderType"] == order_test["type"]:
                        created_order_ids.append(order["id"])
                        self.log_result("orders", f"POST /orders ({order_test['type']})", True,
                                      f"Order ID: {order['id']}")
                    else:
                        self.log_result("orders", f"POST /orders ({order_test['type']})", False,
                                      "Missing ID or incorrect order type")
                else:
                    self.log_result("orders", f"POST /orders ({order_test['type']})", False,
                                  f"Status code: {response.status_code}")
            except Exception as e:
                self.log_result("orders", f"POST /orders ({order_test['type']})", False, str(e))
        
        # Test GET /orders
        try:
            response = self.session.get(f"{self.base_url}/orders")
            if response.status_code == 200:
                orders = response.json()
                if len(orders) >= len(created_order_ids):
                    self.log_result("orders", "GET /orders", True,
                                  f"Retrieved {len(orders)} orders")
                    
                    # Verify orders are sorted by creation date (newest first)
                    if len(orders) >= 2:
                        dates_sorted = all(orders[i]["createdAt"] >= orders[i+1]["createdAt"] 
                                         for i in range(len(orders)-1))
                        self.log_result("orders", "Orders sorted by date", dates_sorted,
                                      "Newest first ordering")
                else:
                    self.log_result("orders", "GET /orders", False,
                                  f"Expected {len(created_order_ids)}+ orders, got {len(orders)}")
            else:
                self.log_result("orders", "GET /orders", False,
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("orders", "GET /orders", False, str(e))
    
    def test_reservations_endpoints(self):
        """Test all reservation-related endpoints (CRITICAL FEATURE)"""
        print(f"\n🪑 Testing Reservation Endpoints (CRITICAL)")
        
        if not self.restaurant_ids:
            self.log_result("reservations", "Reservation tests", False, "No restaurant IDs available")
            return
        
        # Test reservation WITHOUT food pre-order
        reservation_without_food = {
            "restaurantId": self.restaurant_ids[0],
            "restaurantName": "Bella Italia",
            "date": "2024-01-20",
            "time": "19:00",
            "duration": 120,
            "people": 4,
            "preOrderedFood": [],
            "totalPrice": 0
        }
        
        # Test reservation WITH food pre-order (CRITICAL)
        reservation_with_food = {
            "restaurantId": self.restaurant_ids[1],
            "restaurantName": "Sushi Master",
            "date": "2024-01-22",
            "time": "20:00",
            "duration": 90,
            "people": 2,
            "preOrderedFood": [
                {"name": "Dragon Roll", "price": 14.99, "quantity": 1, "image": ""},
                {"name": "Salmon Sashimi", "price": 13.99, "quantity": 1, "image": ""},
                {"name": "Miso Soup", "price": 3.99, "quantity": 2, "image": ""}
            ],
            "totalPrice": 36.97
        }
        
        created_reservation_ids = []
        
        # Test POST /reservations WITHOUT food
        try:
            response = self.session.post(f"{self.base_url}/reservations",
                                       json=reservation_without_food,
                                       headers={"Content-Type": "application/json"})
            if response.status_code == 200:
                reservation = response.json()
                has_required_fields = all(field in reservation for field in 
                                        ["id", "qrCode", "date", "time", "people"])
                if has_required_fields and len(reservation["preOrderedFood"]) == 0:
                    created_reservation_ids.append(reservation["id"])
                    self.log_result("reservations", "POST /reservations (no food)", True,
                                  f"Reservation ID: {reservation['id']}, QR: {reservation['qrCode'][:20]}...")
                else:
                    self.log_result("reservations", "POST /reservations (no food)", False,
                                  "Missing required fields or incorrect preOrderedFood")
            else:
                self.log_result("reservations", "POST /reservations (no food)", False,
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("reservations", "POST /reservations (no food)", False, str(e))
        
        # Test POST /reservations WITH food pre-order (CRITICAL)
        try:
            response = self.session.post(f"{self.base_url}/reservations",
                                       json=reservation_with_food,
                                       headers={"Content-Type": "application/json"})
            if response.status_code == 200:
                reservation = response.json()
                has_required_fields = all(field in reservation for field in 
                                        ["id", "qrCode", "date", "time", "people", "preOrderedFood", "totalPrice"])
                correct_food_items = len(reservation["preOrderedFood"]) == 3
                correct_total = reservation["totalPrice"] == 36.97
                
                if has_required_fields and correct_food_items and correct_total:
                    created_reservation_ids.append(reservation["id"])
                    self.log_result("reservations", "POST /reservations (WITH food) - CRITICAL", True,
                                  f"ID: {reservation['id']}, Items: {len(reservation['preOrderedFood'])}, Total: ${reservation['totalPrice']}")
                else:
                    issues = []
                    if not has_required_fields: issues.append("missing fields")
                    if not correct_food_items: issues.append(f"wrong food count: {len(reservation.get('preOrderedFood', []))}")
                    if not correct_total: issues.append(f"wrong total: {reservation.get('totalPrice', 0)}")
                    self.log_result("reservations", "POST /reservations (WITH food) - CRITICAL", False,
                                  f"Issues: {', '.join(issues)}")
            else:
                self.log_result("reservations", "POST /reservations (WITH food) - CRITICAL", False,
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("reservations", "POST /reservations (WITH food) - CRITICAL", False, str(e))
        
        # Test GET /reservations
        try:
            response = self.session.get(f"{self.base_url}/reservations")
            if response.status_code == 200:
                reservations = response.json()
                if len(reservations) >= len(created_reservation_ids):
                    # Verify we can find our reservations with food
                    food_reservation_found = any(
                        len(r.get("preOrderedFood", [])) == 3 and r.get("totalPrice") == 36.97 
                        for r in reservations
                    )
                    self.log_result("reservations", "GET /reservations", True,
                                  f"Retrieved {len(reservations)} reservations, food reservation found: {food_reservation_found}")
                else:
                    self.log_result("reservations", "GET /reservations", False,
                                  f"Expected {len(created_reservation_ids)}+ reservations, got {len(reservations)}")
            else:
                self.log_result("reservations", "GET /reservations", False,
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("reservations", "GET /reservations", False, str(e))
    
    def test_mongodb_objectid_handling(self):
        """Test MongoDB ObjectId handling"""
        print(f"\n🔧 Testing MongoDB ObjectId Handling")
        
        if not self.restaurant_ids:
            return
        
        # Test with valid ObjectId
        test_id = self.restaurant_ids[0]
        try:
            response = self.session.get(f"{self.base_url}/restaurants/{test_id}")
            if response.status_code == 200:
                self.log_result("restaurants", "Valid ObjectId handling", True,
                              "Successfully retrieved restaurant by ID")
            else:
                self.log_result("restaurants", "Valid ObjectId handling", False,
                              f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("restaurants", "Valid ObjectId handling", False, str(e))
        
        # Test with invalid ObjectId
        try:
            response = self.session.get(f"{self.base_url}/restaurants/invalid_id")
            if response.status_code == 400:
                self.log_result("restaurants", "Invalid ObjectId handling", True,
                              "Correctly returned 400 for invalid ID")
            else:
                self.log_result("restaurants", "Invalid ObjectId handling", False,
                              f"Expected 400, got {response.status_code}")
        except Exception as e:
            self.log_result("restaurants", "Invalid ObjectId handling", False, str(e))
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print(f"\n" + "="*60)
        print(f"🧪 FOOD SUPER APP BACKEND TEST SUMMARY")
        print(f"="*60)
        
        total_passed = 0
        total_failed = 0
        critical_issues = []
        
        for category, results in self.test_results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            print(f"\n📊 {category.upper()} TESTS:")
            print(f"   ✅ Passed: {passed}")
            print(f"   ❌ Failed: {failed}")
            
            # Show details for failed tests
            if failed > 0:
                print(f"   📋 Details:")
                for detail in results["details"]:
                    if "❌" in detail:
                        print(f"      {detail}")
                        if "CRITICAL" in detail:
                            critical_issues.append(detail)
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"   Total Passed: {total_passed}")
        print(f"   Total Failed: {total_failed}")
        
        if critical_issues:
            print(f"\n🚨 CRITICAL ISSUES FOUND:")
            for issue in critical_issues:
                print(f"   {issue}")
        
        success_rate = (total_passed / (total_passed + total_failed)) * 100 if (total_passed + total_failed) > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        if total_failed == 0:
            print(f"\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
        elif len(critical_issues) == 0:
            print(f"\n⚠️  Some tests failed but no critical issues found.")
        else:
            print(f"\n🚨 CRITICAL ISSUES DETECTED - Immediate attention required!")
        
        return total_failed == 0, critical_issues

def main():
    """Run all backend API tests"""
    print("🚀 Starting Food Super App Backend API Tests")
    print(f"🌐 Testing against: {BASE_URL}")
    
    tester = FoodAppTester()
    
    # Test API connectivity first
    if not tester.test_api_health():
        print("❌ Cannot connect to API. Exiting.")
        sys.exit(1)
    
    # Run all endpoint tests
    tester.test_restaurants_endpoints()
    tester.test_orders_endpoints()
    tester.test_reservations_endpoints()
    tester.test_mongodb_objectid_handling()
    
    # Print summary and determine exit code
    all_passed, critical_issues = tester.print_summary()
    
    if critical_issues:
        sys.exit(2)  # Critical issues found
    elif not all_passed:
        sys.exit(1)  # Some tests failed
    else:
        sys.exit(0)  # All tests passed

if __name__ == "__main__":
    main()