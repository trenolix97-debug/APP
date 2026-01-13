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

class Table(BaseModel):
    tableNumber: str
    capacity: int

class ReservationCreate(BaseModel):
    restaurantId: str
    restaurantName: str
    date: str
    time: str
    duration: int
    people: int
    selectedTables: List[Table] = []
    totalCapacity: int = 0
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
    selectedTables: List[Table] = []
    totalCapacity: int = 0
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
        "logo": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
        "cuisine": "Italian",
        "rating": 4.7,
        "priceRange": "$$",
        "address": "123 Main Street",
        "city": "New York",
        "deliveryTime": "25-35 min",
        "latitude": 40.7580,
        "longitude": -73.9855,
        "openingHours": "11:00 AM - 11:00 PM",
        "heroImage": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
        "menu": [
            {
                "category": "Appetizers",
                "items": [
                    {"name": "Bruschetta", "description": "Grilled bread with tomatoes and basil", "price": 8.99, "image": "https://images.pexels.com/photos/4670574/pexels-photo-4670574.jpeg?w=400"},
                    {"name": "Caprese Salad", "description": "Fresh mozzarella, tomatoes, and basil", "price": 10.99, "image": "https://images.pexels.com/photos/4670215/pexels-photo-4670215.jpeg?w=400"}
                ]
            },
            {
                "category": "Pasta",
                "items": [
                    {"name": "Spaghetti Carbonara", "description": "Creamy pasta with bacon and parmesan", "price": 16.99, "image": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400"},
                    {"name": "Fettuccine Alfredo", "description": "Rich cream sauce with parmesan", "price": 15.99, "image": "https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=400"},
                    {"name": "Penne Arrabbiata", "description": "Spicy tomato sauce with garlic", "price": 14.99, "image": "https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=400"}
                ]
            },
            {
                "category": "Pizza",
                "items": [
                    {"name": "Margherita Pizza", "description": "Classic tomato, mozzarella, and basil", "price": 13.99, "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400"},
                    {"name": "Pepperoni Pizza", "description": "Pepperoni and mozzarella", "price": 15.99, "image": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400"},
                    {"name": "Quattro Formaggi", "description": "Four cheese blend", "price": 17.99, "image": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"}
                ]
            },
            {
                "category": "Desserts",
                "items": [
                    {"name": "Tiramisu", "description": "Coffee-flavored Italian dessert", "price": 7.99, "image": "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400"},
                    {"name": "Panna Cotta", "description": "Creamy vanilla dessert", "price": 6.99, "image": "https://images.unsplash.com/photo-1593504049359-74330189a345?w=400"}
                ]
            }
        ]
    },
    {
        "name": "Sushi Master",
        "logo": "https://images.unsplash.com/photo-1538333581680-29dd4752ddf2?w=400",
        "cuisine": "Japanese",
        "rating": 4.8,
        "priceRange": "$$$",
        "address": "456 Park Avenue",
        "city": "New York",
        "deliveryTime": "30-40 min",
        "latitude": 40.7614,
        "longitude": -73.9776,
        "openingHours": "12:00 PM - 10:30 PM",
        "heroImage": "https://images.unsplash.com/photo-1538333581680-29dd4752ddf2?w=800",
        "menu": [
            {
                "category": "Appetizers",
                "items": [
                    {"name": "Edamame", "description": "Steamed soybeans with sea salt", "price": 5.99, "image": "https://images.pexels.com/photos/884600/pexels-photo-884600.jpeg?w=400"},
                    {"name": "Gyoza", "description": "Pan-fried dumplings", "price": 7.99, "image": "https://images.pexels.com/photos/2664216/pexels-photo-2664216.jpeg?w=400"},
                    {"name": "Miso Soup", "description": "Traditional Japanese soup", "price": 3.99, "image": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400"}
                ]
            },
            {
                "category": "Sushi Rolls",
                "items": [
                    {"name": "California Roll", "description": "Crab, avocado, cucumber", "price": 9.99, "image": "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400"},
                    {"name": "Spicy Tuna Roll", "description": "Tuna with spicy mayo", "price": 11.99, "image": "https://images.unsplash.com/photo-1615361200141-f45040f367be?w=400"},
                    {"name": "Dragon Roll", "description": "Eel, cucumber, avocado", "price": 14.99, "image": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400"},
                    {"name": "Rainbow Roll", "description": "Assorted fish on California roll", "price": 15.99, "image": "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400"}
                ]
            },
            {
                "category": "Sashimi",
                "items": [
                    {"name": "Salmon Sashimi", "description": "6 pieces of fresh salmon", "price": 13.99, "image": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400"},
                    {"name": "Tuna Sashimi", "description": "6 pieces of fresh tuna", "price": 14.99, "image": "https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=400"},
                    {"name": "Mixed Sashimi", "description": "12 pieces assorted", "price": 24.99, "image": "https://images.unsplash.com/photo-1638866281450-3933540af86a?w=400"}
                ]
            },
            {
                "category": "Main Dishes",
                "items": [
                    {"name": "Chicken Teriyaki", "description": "Grilled chicken with teriyaki sauce", "price": 16.99, "image": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=400"},
                    {"name": "Beef Teriyaki", "description": "Grilled beef with teriyaki sauce", "price": 19.99, "image": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400"}
                ]
            }
        ]
    },
    {
        "name": "Burger Junction",
        "logo": "https://images.unsplash.com/photo-1729394405518-eaf2a0203aa7?w=400",
        "cuisine": "American",
        "rating": 4.5,
        "priceRange": "$",
        "address": "789 Broadway",
        "city": "New York",
        "deliveryTime": "15-25 min",
        "latitude": 40.7505,
        "longitude": -73.9934,
        "openingHours": "10:00 AM - 11:00 PM",
        "heroImage": "https://images.unsplash.com/photo-1729394405518-eaf2a0203aa7?w=800",
        "menu": [
            {
                "category": "Burgers",
                "items": [
                    {"name": "Classic Burger", "description": "Beef patty, lettuce, tomato, pickles", "price": 9.99, "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400"},
                    {"name": "Cheeseburger", "description": "Classic burger with cheese", "price": 10.99, "image": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400"},
                    {"name": "Bacon Burger", "description": "Burger with crispy bacon", "price": 11.99, "image": "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400"},
                    {"name": "Double Deluxe", "description": "Two patties, cheese, bacon", "price": 14.99, "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400"}
                ]
            },
            {
                "category": "Sides",
                "items": [
                    {"name": "French Fries", "description": "Crispy golden fries", "price": 3.99, "image": "https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?w=400"},
                    {"name": "Onion Rings", "description": "Beer-battered onion rings", "price": 4.99, "image": "https://images.pexels.com/photos/6671778/pexels-photo-6671778.jpeg?w=400"},
                    {"name": "Sweet Potato Fries", "description": "Sweet and crispy", "price": 4.99, "image": "https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?w=400"},
                    {"name": "Coleslaw", "description": "Fresh cabbage salad", "price": 2.99, "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400"}
                ]
            },
            {
                "category": "Drinks",
                "items": [
                    {"name": "Soft Drink", "description": "Coke, Sprite, Fanta", "price": 2.49, "image": "https://images.unsplash.com/photo-1627308594190-a057cd4bfac8?w=400"},
                    {"name": "Milkshake", "description": "Chocolate, Vanilla, Strawberry", "price": 5.99, "image": "https://images.unsplash.com/photo-1590301157284-ab2f8707bdc1?w=400"},
                    {"name": "Fresh Juice", "description": "Orange or Apple", "price": 3.99, "image": "https://images.unsplash.com/photo-1590301157411-8686d4a34f10?w=400"}
                ]
            },
            {
                "category": "Desserts",
                "items": [
                    {"name": "Apple Pie", "description": "Warm apple pie with ice cream", "price": 5.99, "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400"},
                    {"name": "Brownie Sundae", "description": "Chocolate brownie with ice cream", "price": 6.99, "image": "https://images.pexels.com/photos/2173774/pexels-photo-2173774.jpeg?w=400"}
                ]
            }
        ]
    },
    {
        "name": "Green Bowl",
        "logo": "https://images.unsplash.com/photo-1667388969250-1c7220bf3f37?w=400",
        "cuisine": "Healthy",
        "rating": 4.6,
        "priceRange": "$$",
        "address": "321 5th Avenue",
        "city": "New York",
        "deliveryTime": "20-30 min",
        "latitude": 40.7489,
        "longitude": -73.9680,
        "openingHours": "8:00 AM - 9:00 PM",
        "heroImage": "https://images.unsplash.com/photo-1667388969250-1c7220bf3f37?w=800",
        "menu": [
            {
                "category": "Salads",
                "items": [
                    {"name": "Caesar Salad", "description": "Romaine, parmesan, croutons", "price": 10.99, "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400"},
                    {"name": "Greek Salad", "description": "Tomato, cucumber, feta, olives", "price": 11.99, "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400"},
                    {"name": "Quinoa Bowl", "description": "Quinoa, vegetables, tahini", "price": 12.99, "image": "https://images.unsplash.com/photo-1708184528305-33ce7daced65?w=400"}
                ]
            },
            {
                "category": "Bowls",
                "items": [
                    {"name": "Buddha Bowl", "description": "Mixed grains, roasted vegetables", "price": 13.99, "image": "https://images.unsplash.com/photo-1510629954389-c1e0da47d414?w=400"},
                    {"name": "Poke Bowl", "description": "Fresh fish, rice, vegetables", "price": 15.99, "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400"},
                    {"name": "Grain Bowl", "description": "Brown rice, avocado, greens", "price": 12.99, "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400"}
                ]
            },
            {
                "category": "Smoothies",
                "items": [
                    {"name": "Green Machine", "description": "Spinach, banana, mango", "price": 6.99, "image": "https://images.unsplash.com/photo-1627308594190-a057cd4bfac8?w=400"},
                    {"name": "Berry Blast", "description": "Mixed berries, yogurt", "price": 7.99, "image": "https://images.unsplash.com/photo-1590301157284-ab2f8707bdc1?w=400"},
                    {"name": "Tropical Paradise", "description": "Pineapple, coconut, banana", "price": 7.99, "image": "https://images.unsplash.com/photo-1590301157411-8686d4a34f10?w=400"}
                ]
            },
            {
                "category": "Wraps",
                "items": [
                    {"name": "Chicken Wrap", "description": "Grilled chicken, vegetables", "price": 9.99, "image": "https://images.unsplash.com/photo-1708184528305-33ce7daced65?w=400"},
                    {"name": "Falafel Wrap", "description": "Falafel, hummus, vegetables", "price": 8.99, "image": "https://images.unsplash.com/photo-1510629954389-c1e0da47d414?w=400"}
                ]
            }
        ]
    }
]

async def seed_restaurants():
    """Seed database with demo restaurants - force reseed to update images"""
    # Clear existing restaurants to reseed with images
    await db.restaurants.delete_many({})
    await db.restaurants.insert_many(DEMO_RESTAURANTS)
    logging.info(f"Reseeded {len(DEMO_RESTAURANTS)} demo restaurants with images")

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

@api_router.get("/restaurants/{restaurant_id}/floor-plan")
async def get_floor_plan(restaurant_id: str):
    """Get restaurant floor plan with table layout"""
    # Mock floor plan data - in real app this would be stored in database
    floor_plans = {
        "default": [
            {"tableNumber": "T1", "capacity": 2, "x": 20, "y": 20, "available": True},
            {"tableNumber": "T2", "capacity": 2, "x": 20, "y": 60, "available": True},
            {"tableNumber": "T3", "capacity": 4, "x": 60, "y": 20, "available": True},
            {"tableNumber": "T4", "capacity": 4, "x": 60, "y": 60, "available": True},
            {"tableNumber": "T5", "capacity": 6, "x": 20, "y": 100, "available": True},
            {"tableNumber": "T6", "capacity": 6, "x": 60, "y": 100, "available": True},
            {"tableNumber": "T7", "capacity": 8, "x": 20, "y": 140, "available": True},
            {"tableNumber": "T8", "capacity": 2, "x": 60, "y": 140, "available": True},
        ]
    }
    return {"restaurantId": restaurant_id, "tables": floor_plans["default"]}

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
