import requests
import sys
from datetime import datetime
import json

class KinetixAPITester:
    def __init__(self):
        self.base_url = "https://baku-transit-ai.preview.emergentagent.com/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status=200, data=None, expected_data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                
                # Validate response data if provided
                if expected_data:
                    try:
                        response_json = response.json()
                        for key, expected_value in expected_data.items():
                            if key in response_json:
                                if key == "count" and len(response_json.get("data", [])) >= expected_value:
                                    print(f"   ✅ {key}: Found {len(response_json.get('data', []))} items (>= {expected_value})")
                                elif response_json[key] == expected_value:
                                    print(f"   ✅ {key}: {response_json[key]}")
                                else:
                                    print(f"   ⚠️ {key}: Expected {expected_value}, got {response_json[key]}")
                    except Exception as e:
                        print(f"   ⚠️ Could not validate response data: {e}")
                        
                return True, response.json() if response.content else {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ FAILED - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "")

    def test_locations_endpoint(self):
        """Test locations endpoint - should return 18 Baku locations"""
        success, response = self.run_test("Get All Locations", "GET", "locations")
        
        if success:
            locations = response if isinstance(response, list) else []
            print(f"   Found {len(locations)} locations")
            
            # Validate we have expected Baku locations
            expected_locations = ["Icherisheher", "Sahil", "28 May", "Ganjlik", "Flame Towers"]
            found_locations = [loc.get("name", "") for loc in locations]
            
            for expected in expected_locations[:3]:  # Check first 3
                if any(expected in name for name in found_locations):
                    print(f"   ✅ Found expected location: {expected}")
                else:
                    print(f"   ⚠️ Missing expected location: {expected}")
                    
        return success

    def test_locations_search(self):
        """Test location search with 'icher' query"""
        success, response = self.run_test("Search Locations (icher)", "GET", "locations?q=icher")
        
        if success:
            locations = response if isinstance(response, list) else []
            print(f"   Search results: {len(locations)} locations")
            
            # Should find Icherisheher
            if locations and any("icher" in loc.get("name", "").lower() for loc in locations):
                print(f"   ✅ Found Icherisheher in search results")
            else:
                print(f"   ⚠️ Icherisheher not found in search results")
                
        return success

    def test_route_finding(self):
        """Test route finding API"""
        # Use known location IDs from the backend
        route_data = {
            "origin_id": "metro-icherisheher",
            "destination_id": "metro-sahil", 
            "mode": "mixed"
        }
        
        success, response = self.run_test("Find Route", "POST", "routes/find", 200, route_data)
        
        if success:
            print(f"   Origin: {response.get('origin', 'N/A')}")
            print(f"   Destination: {response.get('destination', 'N/A')}")
            
            options = response.get('options', [])
            print(f"   Route options: {len(options)}")
            
            # Should have Standard Route and Kinetix Smart Route
            for idx, option in enumerate(options):
                label = option.get('label', 'Unknown')
                duration = option.get('total_duration', 0)
                crowding = option.get('crowding_percent', 0)
                is_recommended = option.get('is_recommended', False)
                
                print(f"   Option {idx+1}: {label} - {duration}min, {crowding}% crowding, Recommended: {is_recommended}")
                
                if "Smart Route" in label and is_recommended:
                    print(f"      ✅ Found recommended Smart Route")
                    
        return success

    def test_radar_live(self):
        """Test live radar endpoint"""
        success, response = self.run_test("Live Radar", "GET", "radar/live")
        
        if success:
            stations = response.get('stations', [])
            updated_at = response.get('updated_at', '')
            print(f"   Stations: {len(stations)}")
            print(f"   Updated: {updated_at}")
            
            # Check station data structure
            if stations:
                station = stations[0]
                required_fields = ['id', 'name', 'type', 'crowding', 'trend', 'lat', 'lng']
                for field in required_fields:
                    if field in station:
                        print(f"   ✅ Station has {field}: {station[field]}")
                    else:
                        print(f"   ⚠️ Station missing {field}")
                        
        return success

    def test_ticket_purchase(self):
        """Test ticket purchase flow"""
        purchase_data = {
            "type": "single",
            "transport": "combined"
        }
        
        success, response = self.run_test("Purchase Ticket", "POST", "tickets/purchase", 200, purchase_data)
        
        if success:
            print(f"   Ticket ID: {response.get('id', 'N/A')}")
            print(f"   Type: {response.get('type', 'N/A')}")
            print(f"   Transport: {response.get('transport', 'N/A')}")
            print(f"   Price: {response.get('price', 0)} {response.get('currency', 'AZN')}")
            print(f"   Valid from: {response.get('valid_from', 'N/A')}")
            print(f"   Valid until: {response.get('valid_until', 'N/A')}")
            
            # Verify required fields
            required_fields = ['id', 'type', 'transport', 'price', 'currency', 'status']
            for field in required_fields:
                if field in response:
                    print(f"   ✅ Ticket has {field}")
                else:
                    print(f"   ⚠️ Ticket missing {field}")
                    
        return success

    def test_get_tickets(self):
        """Test get tickets endpoint"""
        return self.run_test("Get Tickets", "GET", "tickets")

    def test_settings_get(self):
        """Test get settings endpoint"""
        success, response = self.run_test("Get Settings", "GET", "settings")
        
        if success:
            # Check settings structure
            expected_settings = ['language', 'notifications', 'dark_mode', 'preferred_mode']
            for setting in expected_settings:
                if setting in response:
                    print(f"   ✅ Has setting {setting}: {response[setting]}")
                else:
                    print(f"   ⚠️ Missing setting: {setting}")
                    
        return success

    def test_settings_update(self):
        """Test update settings endpoint"""
        settings_data = {
            "language": "en",
            "notifications": True,
            "dark_mode": False,
            "preferred_mode": "mixed",
            "comfort_priority": True,
            "accessibility": False
        }
        
        success, response = self.run_test("Update Settings", "PUT", "settings", 200, settings_data)
        
        if success:
            print(f"   Settings updated successfully")
            # Verify the response contains our updated values
            for key, value in settings_data.items():
                if response.get(key) == value:
                    print(f"   ✅ {key} updated to {value}")
                else:
                    print(f"   ⚠️ {key} update failed")
                    
        return success

def main():
    print("🚀 Starting Kinetix API Tests...")
    print("=" * 50)
    
    tester = KinetixAPITester()
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
        tester.test_locations_endpoint, 
        tester.test_locations_search,
        tester.test_route_finding,
        tester.test_radar_live,
        tester.test_ticket_purchase,
        tester.test_get_tickets,
        tester.test_settings_get,
        tester.test_settings_update,
    ]
    
    print(f"\nRunning {len(tests)} API tests...\n")
    
    for test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ Test {test_func.__name__} crashed: {str(e)}")
    
    # Results summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️ Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())