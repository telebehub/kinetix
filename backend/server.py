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
from datetime import datetime, timezone, timedelta
import random
import httpx

from ml_engine import (
    get_model, get_metro_path, get_bus_path, _smooth_street_path,
    BAKU_METRO_STATIONS, STATION_CAPACITIES, STATION_COORDS
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Built-in AI model - auto-initialized
model = get_model()

# ─── Models ───

class Location(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_az: str
    type: str
    lat: float
    lng: float
    lines: List[str] = []

class RouteRequest(BaseModel):
    origin_id: str
    destination_id: str
    mode: str = "mixed"

class RouteSegment(BaseModel):
    type: str
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

class Ticket(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    transport: str
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

class PredictionRequest(BaseModel):
    station: str
    date: str
    time: str

# ─── Baku Locations ───

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


def find_location(loc_id):
    for loc in BAKU_LOCATIONS:
        if loc["id"] == loc_id:
            return loc
    return None


# ─── API Routes ───

@api_router.get("/")
async def root():
    return {"message": "Kinetix API v2.0", "model_version": model.model_version}

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

    await db.route_searches.insert_one({
        "id": str(uuid.uuid4()),
        "origin_id": req.origin_id,
        "destination_id": req.destination_id,
        "mode": req.mode,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    options = []

    # === Option A: Standard (Direct, Fast but Crowded) ===
    standard_duration = random.randint(12, 18)
    standard_crowding = random.randint(78, 98)

    both_metro = origin["type"] == "metro" and destination["type"] == "metro"

    if req.mode == "metro" or (req.mode == "mixed" and both_metro):
        std_path = get_metro_path(req.origin_id, req.destination_id)
        std_line = "Red Line"
        std_type = "metro"
    elif req.mode == "bus":
        std_path = get_bus_path(req.origin_id, req.destination_id)
        std_line = f"Bus {random.choice(['14', '65', '88', '125'])}"
        std_type = "bus"
    else:
        if both_metro:
            std_path = get_metro_path(req.origin_id, req.destination_id)
            std_line = "Red Line"
            std_type = "metro"
        else:
            std_path = get_bus_path(req.origin_id, req.destination_id)
            std_line = f"Bus {random.choice(['14', '65'])}"
            std_type = "bus"

    options.append(RouteOption(
        label="Standard Route",
        is_recommended=False,
        total_duration=standard_duration,
        crowding_percent=standard_crowding,
        crowding_label="Standing only, high stress" if standard_crowding > 85 else "Moderate crowding",
        segments=[RouteSegment(
            type=std_type, line=std_line,
            from_name=origin["name"], to_name=destination["name"],
            duration=standard_duration, crowding=standard_crowding,
            coordinates=std_path
        )],
        polyline=std_path
    ))

    # === Option B: Kinetix Smart Route (Comfort Optimized) ===
    smart_duration = standard_duration + random.randint(3, 6)
    smart_crowding = random.randint(18, 38)

    # Smart route uses a transfer approach
    o_coord = STATION_COORDS.get(req.origin_id, {"lat": origin["lat"], "lng": origin["lng"]})
    d_coord = STATION_COORDS.get(req.destination_id, {"lat": destination["lat"], "lng": destination["lng"]})
    mid = {"lat": (o_coord["lat"] + d_coord["lat"]) / 2 + 0.003, "lng": (o_coord["lng"] + d_coord["lng"]) / 2}

    seg1_path = _smooth_street_path(o_coord, mid, 6)
    seg2_path = _smooth_street_path(mid, d_coord, 6)

    seg1_line = "Green Line" if any(req.origin_id.startswith("metro") for _ in [1]) else f"Bus 88"
    seg2_line = f"Bus {random.choice(['18', '88'])}" if seg1_line.startswith("G") else "Red Line"
    seg1_type = "metro" if seg1_line.startswith("G") or seg1_line.startswith("R") else "bus"
    seg2_type = "bus" if seg1_type == "metro" else "metro"

    combined_path = seg1_path + seg2_path[1:]

    options.append(RouteOption(
        label="Kinetix Smart Route",
        is_recommended=True,
        total_duration=smart_duration,
        crowding_percent=smart_crowding,
        crowding_label="Seats available, optimal comfort",
        segments=[
            RouteSegment(
                type=seg1_type, line=seg1_line,
                from_name=origin["name"], to_name="Transfer",
                duration=smart_duration // 2, crowding=smart_crowding,
                coordinates=seg1_path
            ),
            RouteSegment(
                type=seg2_type, line=seg2_line,
                from_name="Transfer", to_name=destination["name"],
                duration=smart_duration - smart_duration // 2,
                crowding=smart_crowding + 5,
                coordinates=seg2_path
            )
        ],
        polyline=combined_path
    ))

    return RouteResponse(origin=origin["name"], destination=destination["name"], options=options)

@api_router.get("/radar/live")
async def get_live_radar():
    stations = []
    for loc in BAKU_LOCATIONS:
        if loc["type"] in ["metro", "bus_stop"]:
            crowding = random.randint(10, 95)
            stations.append({
                "id": loc["id"], "name": loc["name"], "name_az": loc["name_az"],
                "type": loc["type"], "crowding": crowding,
                "trend": random.choice(["rising", "falling", "stable"]),
                "lat": loc["lat"], "lng": loc["lng"],
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
    valid_hours = {"single": 2, "daily": 24, "weekly": 168, "monthly": 720}.get(purchase.type, 2)
    ticket = Ticket(
        type=purchase.type, transport=purchase.transport, price=price,
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

# ─── ML Model Endpoints ───

@api_router.get("/model/status")
async def model_status():
    return {
        "model_loaded": True,
        "model_type": "kinetix_v1",
        "model_version": model.model_version,
        "available_stations": BAKU_METRO_STATIONS,
        "station_capacities": STATION_CAPACITIES,
        "description": "Built-in Kinetix AI v1.0 - XGBoost passenger prediction for Baku Metro",
    }

@api_router.post("/model/predict")
async def predict_passengers(req: PredictionRequest):
    if req.station not in BAKU_METRO_STATIONS:
        raise HTTPException(status_code=400, detail=f"Unknown station: {req.station}")

    try:
        datetime.strptime(req.date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date. Use YYYY-MM-DD")
    try:
        datetime.strptime(req.time, "%H:%M")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time. Use HH:MM")

    capacity = STATION_CAPACITIES.get(req.station, 5000)
    result = model.predict(req.date, req.time, req.station, capacity)

    await db.predictions.insert_one({
        "id": str(uuid.uuid4()),
        "station": req.station, "date": req.date, "time": req.time,
        "result": result, "timestamp": datetime.now(timezone.utc).isoformat()
    })
    return result

# ─── Weather ───

@api_router.get("/weather/baku")
async def get_baku_weather():
    try:
        async with httpx.AsyncClient(timeout=10) as http_client:
            resp = await http_client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": 40.4093, "longitude": 49.8671,
                    "current": "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature",
                    "timezone": "Asia/Baku", "forecast_days": 1,
                }
            )
            resp.raise_for_status()
            data = resp.json()

        current = data.get("current", {})
        wmo = current.get("weather_code", 0)
        descs = {
            0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
            45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
            55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain",
            65: "Heavy rain", 71: "Slight snow", 73: "Moderate snow",
            75: "Heavy snow", 80: "Slight showers", 81: "Moderate showers",
            82: "Heavy showers", 95: "Thunderstorm",
        }
        icons = {
            0: "sun", 1: "cloud-sun", 2: "cloud-sun", 3: "cloud",
            45: "cloud-fog", 48: "cloud-fog", 51: "cloud-drizzle",
            53: "cloud-drizzle", 61: "cloud-rain", 63: "cloud-rain",
            65: "cloud-rain", 80: "cloud-rain", 95: "cloud-lightning",
        }
        return {
            "temperature": current.get("temperature_2m"),
            "feels_like": current.get("apparent_temperature"),
            "humidity": current.get("relative_humidity_2m"),
            "wind_speed": current.get("wind_speed_10m"),
            "weather_code": wmo,
            "description": descs.get(wmo, "Unknown"),
            "icon": icons.get(wmo, "cloud"),
            "city": "Baku", "timezone": "Asia/Baku",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("Weather API error: %s", e)
        raise HTTPException(status_code=503, detail="Weather temporarily unavailable")

# ─── App Setup ───

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
