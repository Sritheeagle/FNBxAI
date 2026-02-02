import asyncio
import os
import json
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def export_data():
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.university_db
    
    # helper for datetime and ObjectId
    def default_serializer(obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        if str(obj):
            return str(obj)
        return str(obj)

    print("Exporting data...")
    
    # Users
    users = await db.users.find().to_list(length=1000)
    with open("data_export/users.json", "w") as f:
        json.dump(users, f, default=default_serializer, indent=2)
    print(f"Exported {len(users)} users to data_export/users.json")

    # Chats
    chats = await db.chats.find().to_list(length=1000)
    with open("data_export/chats.json", "w") as f:
        json.dump(chats, f, default=default_serializer, indent=2)
    print(f"Exported {len(chats)} chats to data_export/chats.json")

if __name__ == "__main__":
    asyncio.run(export_data())
