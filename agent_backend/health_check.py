import requests
import sys

BASE_URL = "http://localhost:8000"

def check_endpoint(method, endpoint, payload=None):
    url = f"{BASE_URL}{endpoint}"
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=payload)
        
        if response.status_code in [200, 201]:
            print(f"✅ {method} {endpoint} - OK")
            return response.json()
        else:
            print(f"❌ {method} {endpoint} - Failed ({response.status_code})")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ {method} {endpoint} - Error: {e}")
        return None

def run_health_check():
    print("Starting Health Check...")
    
    # 1. Root
    check_endpoint("GET", "/")
    
    # 2. Register Mock User
    user_data = {
        "username": "healthrequest_check_user_v2",
        "password": "testpassword123",
        "role": "student"
    }
    # Try login first in case user exists
    print("   Attempting Login...")
    auth_res = check_endpoint("POST", "/login", {"username": user_data["username"], "password": user_data["password"]})
    
    if not auth_res:
         print("   Login failed (expected if new), Attempting Register...")
         auth_res = check_endpoint("POST", "/register", user_data)
    
    if not auth_res:
        print("❌ Critical Auth Failure - Cannot proceed")
        sys.exit(1)
        
    user_id = auth_res.get("user_id")
    print(f"   Logged in as User ID: {user_id}")
    
    # 3. Chat
    chat_payload = {
        "user_id": user_id,
        "message": "Health check test message",
        "role": "student"
    }
    check_endpoint("POST", "/chat", chat_payload)
    
    # 4. History
    check_endpoint("GET", f"/history/{user_id}")
    
    # 5. Admin Data
    check_endpoint("GET", "/admin/data")
    
    print("\nHealth Check Complete.")

if __name__ == "__main__":
    run_health_check()
