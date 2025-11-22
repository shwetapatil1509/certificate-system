from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
from dotenv import load_dotenv
import bcrypt
from datetime import datetime

load_dotenv()

class DatabaseConnection:
    def __init__(self):
        self.client = None
        self.db = None
        self.users_collection = None
        self.certificates_collection = None
        self.connect()

    def connect(self):
        """Establish connection to MongoDB"""
        try:
            # Connection string - using local MongoDB
            mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/certificate_system')
            
            # Create client with timeout
            self.client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            
            # Test connection
            self.client.admin.command('ismaster')
            print("✅ MongoDB connected successfully!")
            
            # Select database
            self.db = self.client.certificate_system
            
            # Initialize collections
            self.users_collection = self.db.users
            self.certificates_collection = self.db.certificates
            self.original_data_collection = self.db.Original_data
            
            # Create indexes for better performance
            self.create_indexes()
            
            # Initialize admin user
            self.initialize_admin()
            
            return True
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"❌ MongoDB connection failed: {e}")
            return False
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return False

    def create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Create unique index on email
            self.users_collection.create_index("email", unique=True)
            
            # Create index on user_id for faster queries
            self.certificates_collection.create_index("user_id")
            
            # Create index on status for faster filtering
            self.certificates_collection.create_index("status")
            
            print("✅ Database indexes created successfully!")
        except Exception as e:
            print(f"⚠️  Index creation warning: {e}")

    def initialize_admin(self):
        """Create default admin user if not exists"""
        try:
            admin_email = "admin@example.com"
            admin_exists = self.users_collection.find_one({"email": admin_email})
            
            if not admin_exists:
                # Hash password for admin123
                hashed_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt())
                
                admin_user = {
                    "name": "System Administrator",
                    "email": admin_email,
                    "password": hashed_password,
                    "role": "admin",
                    "created_at": datetime.utcnow()
                }
                
                self.users_collection.insert_one(admin_user)
                print("✅ Default admin user created: admin@example.com / admin123")
            else:
                print("✅ Admin user already exists")
                
        except Exception as e:
            print(f"❌ Admin initialization failed: {e}")

    def check_connection(self):
        """Check if database connection is alive"""
        try:
            if self.client:
                self.client.admin.command('ismaster')
                return True
            return False
        except:
            return False

    def close_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            print("✅ Database connection closed")

# Global database instance
db_connection = DatabaseConnection()

def get_database():
    """Get database instance"""
    return db_connection

def get_users_collection():
    """Get users collection"""
    return db_connection.users_collection

def get_certificates_collection():
    """Get certificates collection"""
    return db_connection.certificates_collection

def get_original_data_collection():
    """Get original data collection"""
    return db_connection.original_data_collection