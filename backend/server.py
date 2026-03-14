from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Models ───

class Location(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_az: str
    type: str  # metro, bus_stop, landmark
    lat: float
    lng: float
    lines: List[str] = []

class RouteRequest(BaseModel):
    origin_id: str
    destination_id: str
    mode: str = "mixed"  # bus, metro, mixed

class RouteSegment(BaseModel):
    type: str  # metro, bus, walk
    line: str
    from_name: str
    to_name: str
    duration: int
    crowding: int
    coordinates: List[List[float]]

class RouteOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str
    is_recommended: bool = False
    total_duration: int
    crowding_percent: int
    crowding_label: str
    segments: List[RouteSegment]
    polyline: List[List[float]]

class RouteResponse(BaseModel):
    origin: str
    destination: str
    options: List[RouteOption]

class RadarStation(BaseModel):
    id: str
    name: str
    type: str
    crowding: int
    trend: str  # rising, falling, stable
    lat: float
    lng: float
    line: Optional[str] = None

class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # single, daily, weekly, monthly
    transport: str  # metro, bus, combined
    price: float
    currency: str = "AZN"
    valid_from: str
    valid_until: str
    status: str = "active"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TicketPurchase(BaseModel):
    type: str
    transport: str

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    language: str = "az"
    notifications: bool = True
    dark_mode: bool = False
    preferred_mode: str = "mixed"
    comfort_priority: bool = True
    accessibility: bool = False

# ─── Baku Mock Data ───

BAKU_LOCATIONS = [
    {"id": "metro-icherisheher", "name": "Icherisheher Metro", "name_az": "Iceriseher", "type": "metro", "lat": 40.3661, "lng": 49.8372, "lines": ["Red Line"]},
    {"id": "metro-sahil", "name": "Sahil Metro", "name_az": "Sahil", "type": "metro", "lat": 40.3725, "lng": 49.8525, "lines": ["Red Line"]},
    {"id": "metro-28may", "name": "28 May Metro", "name_az": "28 May", "type": "metro", "lat": 40.3795, "lng": 49.8494, "lines": ["Red Line", "Green Line"]},
    {"id": "metro-ganjlik", "name": "Ganjlik Metro", "name_az": "Genclik", "type": "metro", "lat": 40.4035, "lng": 49.8517, "lines": ["Red Line"]},
    {"id": "metro-nariman", "name": "Nariman Narimanov Metro", "name_az": "Neriman Nerimanov", "type": "metro", "lat": 40.4085, "lng": 49.8678, "lines": ["Red Line"]},
    {"id": "metro-elmler", "name": "Elmler Akademiyasi Metro", "name_az": "Elmler Akademiyasi", "type": "metro", "lat": 40.3874, "lng": 49.8137, "lines": ["Green Line"]},
    {"id": "metro-nizami", "name": "Nizami Metro", "name_az": "Nizami", "type": "metro", "lat": 40.3803, "lng": 49.8313, "lines": ["Green Line"]},
    {"id": "metro-koroglu", "name": "Koroglu Metro", "name_az": "Koroglu", "type": "metro", "lat": 40.4195, "lng": 49.9105, "lines": ["Red Line"]},
    {"id": "metro-ulduz", "name": "Ulduz Metro", "name_az": "Ulduz", "type": "metro", "lat": 40.4119, "lng": 49.8826, "lines": ["Red Line"]},
    {"id": "metro-neftchilar", "name": "Neftchilar Metro", "name_az": "Neftciler", "type": "metro", "lat": 40.4222, "lng": 49.9325, "lines": ["Red Line"]},
    {"id": "bus-14", "name": "Bus 14 - Icherisheher", "name_az": "Avtobus 14", "type": "bus_stop", "lat": 40.3670, "lng": 49.8355, "lines": ["14"]},
    {"id": "bus-88", "name": "Bus 88 - Nizami", "name_az": "Avtobus 88", "type": "bus_stop", "lat": 40.3790, "lng": 49.8290, "lines": ["88"]},
    {"id": "bus-125", "name": "Bus 125 - Koroglu", "name_az": "Avtobus 125", "type": "bus_stop", "lat": 40.4180, "lng": 49.9090, "lines": ["125"]},
    {"id": "bus-65", "name": "Bus 65 - 28 May", "name_az": "Avtobus 65", "type": "bus_stop", "lat": 40.3800, "lng": 49.8510, "lines": ["65"]},
    {"id": "bus-18", "name": "Bus 18 - Ganjlik", "name_az": "Avtobus 18", "type": "bus_stop", "lat": 40.4025, "lng": 49.8530, "lines": ["18"]},
    {"id": "landmark-flame", "name": "Flame Towers", "name_az": "Alov Quleleri", "type": "landmark", "lat": 40.3596, "lng": 49.8213, "lines": []},
    {"id": "landmark-boulevard", "name": "Baku Boulevard", "name_az": "Baki Bulvari", "type": "landmark", "lat": 40.3588, "lng": 49.8463, "lines": []},
    {"id": "landmark-heydar", "name": "Heydar Aliyev Center", "name_az": "Heyder Eliyev Merkezi", "type": "landmark", "lat": 40.3959, "lng": 49.8677, "lines": []},
]

TICKET_PRICES = {
    "single": {"metro": 0.30, "bus": 0.30, "combined": 0.50},
    "daily": {"metro": 2.00, "bus": 2.00, "combined": 3.50},
    "weekly": {"metro": 10.00, "bus": 10.00, "combined": 18.00},
    "monthly": {"metro": 35.00, "bus": 35.00, "combined": 60.00},
}


def generate_polyline(origin, destination, num_points=8):
    """Generate intermediate points for a realistic-looking route."""
    points = []
    lat_diff = destination["lat"] - origin["lat"]
    lng_diff = destination["lng"] - origin["lng"]
    for i in range(num_points + 1):
        t = i / num_points
        lat = origin["lat"] + lat_diff * t + random.uniform(-0.003, 0.003) * (1 - abs(2*t - 1))
        lng = origin["lng"] + lng_diff * t + random.uniform(-0.003, 0.003) * (1 - abs(2*t - 1))
        points.append([round(lat, 6), round(lng, 6)])
    points[0] = [origin["lat"], origin["lng"]]
    points[-1] = [destination["lat"], destination["lng"]]
    return points


def find_location(loc_id):
    for loc in BAKU_LOCATIONS:
        if loc["id"] == loc_id:
            return loc
    return None


# ─── Routes ───

@api_router.get("/")
async def root():
    return {"message": "Kinetix API v1.0"}

@api_router.get("/locations", response_model=List[Location])
async def get_locations(q: Optional[str] = None, type: Optional[str] = None):
    results = BAKU_LOCATIONS
    if type:
        results = [loc for loc in results if loc["type"] == type]
    if q:
        q_lower = q.lower()
        results = [loc for loc in results if q_lower in loc["name"].lower() or q_lower in loc["name_az"].lower()]
    return results

@api_router.post("/routes/find", response_model=RouteResponse)
async def find_routes(req: RouteRequest):
    origin = find_location(req.origin_id)
    destination = find_location(req.destination_id)
    if not origin or not destination:
        raise HTTPException(status_code=404, detail="Location not found")

    # Save search to DB
    search_doc = {
        "id": str(uuid.uuid4()),
        "origin_id": req.origin_id,
        "destination_id": req.destination_id,
        "mode": req.mode,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.route_searches.insert_one(search_doc)

    options = []

    # Option A: Standard Route (Fast but Crowded)
    standard_duration = random.randint(12, 18)
    standard_crowding = random.randint(80, 98)
    standard_polyline = generate_polyline(origin, destination, 6)

    if req.mode == "bus":
        line_name = f"Bus {random.choice(['14', '65', '88', '125'])}"
        seg_type = "bus"
    elif req.mode == "metro":
        line_name = f"Red Line"
        seg_type = "metro"
    else:
        line_name = f"Red Line"
        seg_type = "metro"

    options.append(RouteOption(
        label="Standard Route",
        is_recommended=False,
        total_duration=standard_duration,
        crowding_percent=standard_crowding,
        crowding_label="Standing only, high stress" if standard_crowding > 85 else "Moderate crowding",
        segments=[RouteSegment(
            type=seg_type,
            line=line_name,
            from_name=origin["name"],
            to_name=destination["name"],
            duration=standard_duration,
            crowding=standard_crowding,
            coordinates=standard_polyline
        )],
        polyline=standard_polyline
    ))

    # Option B: Kinetix Smart Route (Recommended)
    smart_duration = standard_duration + random.randint(3, 6)
    smart_crowding = random.randint(20, 40)
    smart_polyline = generate_polyline(origin, destination, 10)

    midpoint_lat = (origin["lat"] + destination["lat"]) / 2 + random.uniform(-0.005, 0.005)
    midpoint_lng = (origin["lng"] + destination["lng"]) / 2 + random.uniform(-0.005, 0.005)

    seg1_coords = generate_polyline(origin, {"lat": midpoint_lat, "lng": midpoint_lng}, 4)
    seg2_coords = generate_polyline({"lat": midpoint_lat, "lng": midpoint_lng}, destination, 4)

    options.append(RouteOption(
        label="Kinetix Smart Route",
        is_recommended=True,
        total_duration=smart_duration,
        crowding_percent=smart_crowding,
        crowding_label="Seats available, optimal comfort",
        segments=[
            RouteSegment(
                type="metro",
                line="Green Line",
                from_name=origin["name"],
                to_name="Transfer Point",
                duration=smart_duration // 2,
                crowding=smart_crowding,
                coordinates=seg1_coords
            ),
            RouteSegment(
                type="bus",
                line=f"Bus {random.choice(['18', '88'])}",
                from_name="Transfer Point",
                to_name=destination["name"],
                duration=smart_duration - smart_duration // 2,
                crowding=smart_crowding + 5,
                coordinates=seg2_coords
            )
        ],
        polyline=smart_polyline
    ))

    return RouteResponse(
        origin=origin["name"],
        destination=destination["name"],
        options=options
    )

@api_router.get("/radar/live")
async def get_live_radar():
    stations = []
    for loc in BAKU_LOCATIONS:
        if loc["type"] in ["metro", "bus_stop"]:
            crowding = random.randint(10, 95)
            trend = random.choice(["rising", "falling", "stable"])
            stations.append({
                "id": loc["id"],
                "name": loc["name"],
                "name_az": loc["name_az"],
                "type": loc["type"],
                "crowding": crowding,
                "trend": trend,
                "lat": loc["lat"],
                "lng": loc["lng"],
                "line": loc["lines"][0] if loc["lines"] else None,
                "passengers_now": random.randint(20, 300),
                "capacity": random.randint(200, 500),
            })
    return {"stations": stations, "updated_at": datetime.now(timezone.utc).isoformat()}

@api_router.get("/tickets")
async def get_tickets():
    tickets = await db.tickets.find({}, {"_id": 0}).to_list(100)
    return {"tickets": tickets}

@api_router.post("/tickets/purchase")
async def purchase_ticket(purchase: TicketPurchase):
    price = TICKET_PRICES.get(purchase.type, {}).get(purchase.transport)
    if price is None:
        raise HTTPException(status_code=400, detail="Invalid ticket type or transport")

    now = datetime.now(timezone.utc)
    if purchase.type == "single":
        valid_hours = 2
    elif purchase.type == "daily":
        valid_hours = 24
    elif purchase.type == "weekly":
        valid_hours = 168
    else:
        valid_hours = 720

    from datetime import timedelta
    ticket = Ticket(
        type=purchase.type,
        transport=purchase.transport,
        price=price,
        valid_from=now.isoformat(),
        valid_until=(now + timedelta(hours=valid_hours)).isoformat(),
    )
    doc = ticket.model_dump()
    await db.tickets.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"user": "default"}, {"_id": 0})
    if not settings:
        default = Settings().model_dump()
        default["user"] = "default"
        await db.settings.insert_one(default)
        default.pop("_id", None)
        return default
    return settings

@api_router.put("/settings")
async def update_settings(settings: Settings):
    doc = settings.model_dump()
    doc["user"] = "default"
    await db.settings.update_one({"user": "default"}, {"$set": doc}, upsert=True)
    return doc

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
