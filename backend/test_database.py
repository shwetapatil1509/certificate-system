from database import get_database, db_connection
from pymongo import MongoClient

def test_database_connection():
    print(" Testing Database Connection...")
    
    # Test connection
    if db_connection.check_connection():
        print(" Database connection successful!")
        
        # Test collections
        users = get_database().users_collection
        certificates = get_database().certificates_collection
        
        print(f" Users collection: {users.name}")
        print(f" Certificates collection: {certificates.name}")
        
        # Count documents
        user_count = users.count_documents({})
        cert_count = certificates.count_documents({})
        
        print(f" Users in database: {user_count}")
        print(f" Certificates in database: {cert_count}")
        
        # List all users
        print("\n👥 All Users:")
        for user in users.find({}, {'password': 0}):
            print(f"  - {user['name']} ({user['email']}) - {user['role']}")
            
    else:
        print(" Database connection failed!")

if __name__ == "__main__":
    test_database_connection()