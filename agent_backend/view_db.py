import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def view_data():
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.university_db
    
    print("=== USERS COLLECTION ===")
    users = await db.users.find().to_list(length=100)
    if not users:
        print("No users found.")
    for user in users:
        print(f"ID: {user['_id']}, Username: {user['username']}, Role: {user['role']}")
        
    print("\n=== CHATS COLLECTION ===")
    chats = await db.chats.find().to_list(length=10) # showing last 10
    if not chats:
        print("No chats found.")
    for chat in chats:
        print(f"User ID: {chat.get('user_id', 'N/A')}")
        print(f"User: {chat.get('message', '')}")
        print(f"AI: {chat.get('response', '')[:50]}...") # truncate response
        print("-" * 20)

if __name__ == "__main__":
    asyncio.run(view_data())
