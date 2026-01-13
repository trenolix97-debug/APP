from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ========================
# MODELS
# ========================

class MenuItem(BaseModel):
    name: str
    description: str
    price: float
    image: str = ""  # base64 or empty for demo

class MenuCategory(BaseModel):
    category: str
    items: List[MenuItem]

class Restaurant(BaseModel):
    id: Optional[str] = None
    name: str
    logo: str = ""  # base64
    cuisine: str
    rating: float
    priceRange: str
    address: str
    city: str
    deliveryTime: str
    latitude: float
    longitude: float
    menu: List[MenuCategory]
    openingHours: str = "9:00 AM - 10:00 PM"

class CartItem(BaseModel):
    name: str
    price: float
    quantity: int
    image: str = ""

class OrderCreate(BaseModel):
    restaurantId: str
    restaurantName: str
    items: List[CartItem]
    orderType: str  # "delivery", "pickup", "dine-in"
    totalPrice: float
    deliveryAddress: Optional[str] = None
    pickupTime: Optional[str] = None

class Order(BaseModel):
    id: Optional[str] = None
    restaurantId: str
    restaurantName: str
    items: List[CartItem]
    orderType: str
    status: str = "active"
    totalPrice: float
    deliveryAddress: Optional[str] = None
    pickupTime: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ReservationCreate(BaseModel):
    restaurantId: str
    restaurantName: str
    date: str
    time: str
    duration: int
    people: int
    preOrderedFood: List[CartItem] = []
    totalPrice: float = 0

class Reservation(BaseModel):
    id: Optional[str] = None
    restaurantId: str
    restaurantName: str
    date: str
    time: str
    duration: int
    people: int
    preOrderedFood: List[CartItem] = []
    status: str = "upcoming"
    totalPrice: float = 0
    qrCode: str = ""
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# ========================
# SEED DEMO DATA
# ========================

DEMO_RESTAURANTS = [
    {
        "name": "Bella Italia",
        "logo": "",
        "cuisine": "Italian",
        "rating": 4.7,
        "priceRange": "$$",
        "address": "123 Main Street",
        "city": "New York",
        "deliveryTime": "25-35 min",
        "latitude": 40.7580,
        "longitude": -73.9855,
        "openingHours": "11:00 AM - 11:00 PM",
        "menu": [
            {
                "category": "Appetizers",
                "items": [
                    {"name": "Bruschetta", "description": "Grilled bread with tomatoes and basil", "price": 8.99, "image": ""},
                    {"name": "Caprese Salad", "description": "Fresh mozzarella, tomatoes, and basil", "price": 10.99, "image": ""}
                ]
            },
            {
                "category": "Pasta",
                "items": [
                    {"name": "Spaghetti Carbonara", "description": "Creamy pasta with bacon and parmesan", "price": 16.99, "image": ""},
                    {"name": "Fettuccine Alfredo", "description": "Rich cream sauce with parmesan", "price": 15.99, "image": ""},
                    {"name": "Penne Arrabbiata", "description": "Spicy tomato sauce with garlic", "price": 14.99, "image": ""}
                ]
            },
            {
                "category": "Pizza",
                "items": [
                    {"name": "Margherita Pizza", "description": "Classic tomato, mozzarella, and basil", "price": 13.99, "image": ""},
                    {"name": "Pepperoni Pizza", "description": "Pepperoni and mozzarella", "price": 15.99, "image": ""},
                    {"name": "Quattro Formaggi", "description": "Four cheese blend", "price": 17.99, "image": ""}
                ]
            },
            {
                "category": "Desserts",
                "items": [
                    {"name": "Tiramisu", "description": "Coffee-flavored Italian dessert", "price": 7.99, "image": ""},
                    {"name": "Panna Cotta", "description": "Creamy vanilla dessert", "price": 6.99, "image": ""}
                ]
            }
        ]
    },
    {
        "name": "Sushi Master",
        "logo": "",
        "cuisine": "Japanese",
        "rating": 4.8,
        "priceRange": "$$$",
        "address": "456 Park Avenue",
        "city": "New York",
        "deliveryTime": "30-40 min",
        "latitude": 40.7614,
        "longitude": -73.9776,
        "openingHours": "12:00 PM - 10:30 PM",
        "menu": [
            {
                "category": "Appetizers",
                "items": [
                    {"name": "Edamame", "description": "Steamed soybeans with sea salt", "price": 5.99, "image": ""},
                    {"name": "Gyoza", "description": "Pan-fried dumplings", "price": 7.99, "image": ""},
                    {"name": "Miso Soup", "description": "Traditional Japanese soup", "price": 3.99, "image": ""}
                ]
            },
            {
                "category": "Sushi Rolls",
                "items": [
                    {"name": "California Roll", "description": "Crab, avocado, cucumber", "price": 9.99, "image": ""},
                    {"name": "Spicy Tuna Roll", "description": "Tuna with spicy mayo", "price": 11.99, "image": ""},
                    {"name": "Dragon Roll", "description": "Eel, cucumber, avocado", "price": 14.99, "image": ""},
                    {"name": "Rainbow Roll", "description": "Assorted fish on California roll", "price": 15.99, "image": ""}
                ]
            },
            {
                "category": "Sashimi",
                "items": [
                    {"name": "Salmon Sashimi", "description": "6 pieces of fresh salmon", "price": 13.99, "image": ""},
                    {"name": "Tuna Sashimi", "description": "6 pieces of fresh tuna", "price": 14.99, "image": ""},
                    {"name": "Mixed Sashimi", "description": "12 pieces assorted", "price": 24.99, "image": ""}
                ]
            },
            {
                "category": "Main Dishes",
                "items": [
                    {"name": "Chicken Teriyaki", "description": "Grilled chicken with teriyaki sauce", "price": 16.99, "image": ""},
                    {"name": "Beef Teriyaki", "description": "Grilled beef with teriyaki sauce", "price": 19.99, "image": ""}
                ]
            }
        ]
    },
    {
        "name": "Burger Junction",
        "logo": "",
        "cuisine": "American",
        "rating": 4.5,
        "priceRange": "$",
        "address": "789 Broadway",
        "city": "New York",
        "deliveryTime": "15-25 min",
        "latitude": 40.7505,
        "longitude": -73.9934,
        "openingHours": "10:00 AM - 11:00 PM",
        "menu": [
            {
                "category": "Burgers",
                "items": [
                    {"name": "Classic Burger", "description": "Beef patty, lettuce, tomato, pickles", "price": 9.99, "image": ""},
                    {"name": "Cheeseburger", "description": "Classic burger with cheese", "price": 10.99, "image": ""},
                    {"name": "Bacon Burger", "description": "Burger with crispy bacon", "price": 11.99, "image": ""},
                    {"name": "Double Deluxe", "description": "Two patties, cheese, bacon", "price": 14.99, "image": ""}
                ]
            },
            {
                "category": "Sides",
                "items": [
                    {"name": "French Fries", "description": "Crispy golden fries", "price": 3.99, "image": ""},
                    {"name": "Onion Rings", "description": "Beer-battered onion rings", "price": 4.99, "image": ""},
                    {"name": "Sweet Potato Fries", "description": "Sweet and crispy", "price": 4.99, "image": ""},
                    {"name": "Coleslaw", "description": "Fresh cabbage salad", "price": 2.99, "image": ""}
                ]
            },
            {
                "category": "Drinks",
                "items": [
                    {"name": "Soft Drink", "description": "Coke, Sprite, Fanta", "price": 2.49, "image": ""},
                    {"name": "Milkshake", "description": "Chocolate, Vanilla, Strawberry", "price": 5.99, "image": ""},
                    {"name": "Fresh Juice", "description": "Orange or Apple", "price": 3.99, "image": ""}
                ]
            },
            {
                "category": "Desserts",
                "items": [
                    {"name": "Apple Pie", "description": "Warm apple pie with ice cream", "price": 5.99, "image": ""},
                    {"name": "Brownie Sundae", "description": "Chocolate brownie with ice cream", "price": 6.99, "image": ""}
                ]
            }
        ]
    },
    {
        "name": "Green Bowl",
        "logo": "",
        "cuisine": "Healthy",
        "rating": 4.6,
        "priceRange": "$$",
        "address": "321 5th Avenue",
        "city": "New York",
        "deliveryTime": "20-30 min",
        "latitude": 40.7489,
        "longitude": -73.9680,
        "openingHours": "8:00 AM - 9:00 PM",
        "menu": [
            {
                "category": "Salads",
                "items": [
                    {"name": "Caesar Salad", "description": "Romaine, parmesan, croutons", "price": 10.99, "image": ""},
                    {"name": "Greek Salad", "description": "Tomato, cucumber, feta, olives", "price": 11.99, "image": ""},
                    {"name": "Quinoa Bowl", "description": "Quinoa, vegetables, tahini", "price": 12.99, "image": ""}
                ]
            },
            {
                "category": "Bowls",
                "items": [
                    {"name": "Buddha Bowl", "description": "Mixed grains, roasted vegetables", "price": 13.99, "image": ""},
                    {"name": "Poke Bowl", "description": "Fresh fish, rice, vegetables", "price": 15.99, "image": ""},
                    {"name": "Grain Bowl", "description": "Brown rice, avocado, greens", "price": 12.99, "image": ""}
                ]
            },
            {
                "category": "Smoothies",
                "items": [
                    {"name": "Green Machine", "description": "Spinach, banana, mango", "price": 6.99, "image": ""},
                    {"name": "Berry Blast", "description": "Mixed berries, yogurt", "price": 7.99, "image": ""},
                    {"name": "Tropical Paradise", "description": "Pineapple, coconut, banana", "price": 7.99, "image": ""}
                ]
            },
            {
                "category": "Wraps",
                "items": [
                    {"name": "Chicken Wrap", "description": "Grilled chicken, vegetables", "price": 9.99, "image": ""},
                    {"name": "Falafel Wrap", "description": "Falafel, hummus, vegetables", "price": 8.99, "image": ""}
                ]
            }
        ]
    }
]

async def seed_restaurants():
    """Seed database with demo restaurants if empty"""
    count = await db.restaurants.count_documents({})
    if count == 0:
        await db.restaurants.insert_many(DEMO_RESTAURANTS)
        logging.info(f"Seeded {len(DEMO_RESTAURANTS)} demo restaurants")

@app.on_event("startup")
async def startup_event():
    await seed_restaurants()

# ========================
# API ENDPOINTS
# ========================

@api_router.get("/")
async def root():
    return {"message": "Food Super App API"}

# RESTAURANTS
@api_router.get("/restaurants", response_model=List[Restaurant])
async def get_restaurants(search: Optional[str] = None, cuisine: Optional[str] = None):
    """Get all restaurants with optional filters"""
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"cuisine": {"$regex": search, "$options": "i"}}
        ]
    if cuisine and cuisine != "all":
        query["cuisine"] = cuisine
    
    restaurants = await db.restaurants.find(query).to_list(100)
    return [Restaurant(id=str(r["_id"]), **{k: v for k, v in r.items() if k != "_id"}) for r in restaurants]

@api_router.get("/restaurants/{restaurant_id}", response_model=Restaurant)
async def get_restaurant(restaurant_id: str):
    """Get single restaurant by ID"""
    try:
        restaurant = await db.restaurants.find_one({"_id": ObjectId(restaurant_id)})
        if not restaurant:
            raise HTTPException(status_code=404, detail="Restaurant not found")
        return Restaurant(id=str(restaurant["_id"]), **{k: v for k, v in restaurant.items() if k != "_id"})
    except:
        raise HTTPException(status_code=400, detail="Invalid restaurant ID")

# ORDERS
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    """Create a new order"""
    order_dict = order.dict()
    order_obj = Order(**order_dict)
    result = await db.orders.insert_one(order_obj.dict(exclude={"id"}))
    order_obj.id = str(result.inserted_id)
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    """Get all orders"""
    orders = await db.orders.find().sort("createdAt", -1).to_list(100)
    return [Order(id=str(o["_id"]), **{k: v for k, v in o.items() if k != "_id"}) for o in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get single order by ID"""
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        return Order(id=str(order["_id"]), **{k: v for k, v in order.items() if k != "_id"})
    except:
        raise HTTPException(status_code=400, detail="Invalid order ID")

# RESERVATIONS
@api_router.post("/reservations", response_model=Reservation)
async def create_reservation(reservation: ReservationCreate):
    """Create a new table reservation"""
    reservation_dict = reservation.dict()
    # Generate mock QR code data
    reservation_dict["qrCode"] = f"RESERVATION-{datetime.utcnow().timestamp()}"
    reservation_obj = Reservation(**reservation_dict)
    result = await db.reservations.insert_one(reservation_obj.dict(exclude={"id"}))
    reservation_obj.id = str(result.inserted_id)
    return reservation_obj

@api_router.get("/reservations", response_model=List[Reservation])
async def get_reservations():
    """Get all reservations"""
    reservations = await db.reservations.find().sort("createdAt", -1).to_list(100)
    return [Reservation(id=str(r["_id"]), **{k: v for k, v in r.items() if k != "_id"}) for r in reservations]

@api_router.get("/reservations/{reservation_id}", response_model=Reservation)
async def get_reservation(reservation_id: str):
    """Get single reservation by ID"""
    try:
        reservation = await db.reservations.find_one({"_id": ObjectId(reservation_id)})
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        return Reservation(id=str(reservation["_id"]), **{k: v for k, v in reservation.items() if k != "_id"})
    except:
        raise HTTPException(status_code=400, detail="Invalid reservation ID")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
