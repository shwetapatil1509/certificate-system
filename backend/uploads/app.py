from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity, get_jwt
from bson import ObjectId
import bcrypt
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import base64

# Import database connection
from database import get_database, get_users_collection, get_certificates_collection, db_connection

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# Get database collections
users_collection = get_users_collection()
certificates_collection = get_certificates_collection()

@app.route('/')
def home():
    """Home endpoint"""
    db_status = "connected" if db_connection.check_connection() else "disconnected"
    return jsonify({
        "message": "Certificate Verification System API",
        "database": db_status,
        "version": "1.0.0"
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    db_connected = db_connection.check_connection()
    return jsonify({
        "status": "healthy" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "timestamp": datetime.utcnow().isoformat(),
        "endpoints": {
            "register": "/api/register",
            "login": "/api/login",
            "upload": "/api/certificates",
            "user_certificates": "/api/user/certificates"
        }
    })

# Auth routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        if not db_connection.check_connection():
            return jsonify({'error': 'Database connection unavailable'}), 500
            
        data = request.get_json()
        
        # Validate required fields
        if not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'error': 'Missing required fields: name, email, password'}), 400
        
        # Check if user already exists
        if users_collection.find_one({'email': data['email']}):
            return jsonify({'error': 'User already exists with this email'}), 400
        
        # Hash password
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        user = {
            'name': data['name'],
            'email': data['email'],
            'password': hashed_password,
            'role': 'user',
            'created_at': datetime.utcnow()
        }
        
        result = users_collection.insert_one(user)
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        if not db_connection.check_connection():
            return jsonify({'error': 'Database connection unavailable'}), 500
            
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        user = users_collection.find_one({'email': data['email']})
        
        if user and bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
            # Use string identity (user id) and add email/role as additional claims
            access_token = create_access_token(
                identity=str(user['_id']),
                additional_claims={
                    'email': user['email'],
                    'role': user['role']
                }
            )
            return jsonify({
                'access_token': access_token,
                'user': {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email'],
                    'role': user['role']
                }
            }), 200
        else:
            return jsonify({'error': 'Invalid email or password'}), 401
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500



# Certificate routes
@app.route('/api/certificates', methods=['POST'])
@jwt_required()
def upload_certificate():
    try:
        identity = get_jwt_identity()
        claims = get_jwt()
        current_user = {'id': identity, 'email': claims.get('email'), 'role': claims.get('role')}
        print(f"Upload request from user: {current_user.get('email')}")
        
        if 'file' not in request.files:
            print("No file in request")
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        title = request.form.get('title', 'Untitled Certificate')
        description = request.form.get('description', '')
        
        print(f"File received: {file.filename}")
        print(f"Title: {title}")
        
        if file.filename == '':
            print("Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension
        allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'}
        file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_extension not in allowed_extensions:
            print(f"Invalid file extension: {file_extension}")
            return jsonify({'error': f'File type not allowed. Allowed types: {", ".join(allowed_extensions)}'}), 422
        
        # Validate file size (max 10MB)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset seek position
        
        print(f"File size: {file_size} bytes")
        
        if file_size > 10 * 1024 * 1024:  # 10MB limit
            print("File too large")
            return jsonify({'error': 'File size too large. Maximum 10MB allowed.'}), 422
        
        if file_size == 0:
            print("Empty file")
            return jsonify({'error': 'File is empty'}), 422
        
        # Read file and convert to base64
        file_data = file.read()
        file_base64 = base64.b64encode(file_data).decode('utf-8')
        
        certificate = {
            'user_id': current_user['id'],
            'title': title,
            'description': description,
            'file_name': file.filename,
            'file_data': file_base64,
            'file_type': file.content_type,
            'file_size': file_size,
            'status': 'pending',
            'uploaded_at': datetime.utcnow(),
            'verified_at': None,
            'verified_by': None
        }
        
        result = certificates_collection.insert_one(certificate)
        print(f"Certificate saved with ID: {result.inserted_id}")
        
        return jsonify({
            'message': 'Certificate uploaded successfully',
            'certificate_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
    
# @app.route('/api/user/certificates', methods=['GET'])
# @jwt_required()
# def get_user_certificates():
#     try:
#         user_identity = get_jwt_identity()
#         print("🔍 Current user identity:", user_identity)

#         if not user_identity:
#             return jsonify({'error': 'User not found'}), 401

#         # Determine whether JWT contains ObjectId or email
#         query = {}
#         try:
#             query['user_id'] = ObjectId(user_identity)
#         except Exception:
#             query['user_email'] = user_identity

#         certificates = list(certificates_collection.find(query))

#         # Return empty list if none
#         if not certificates:
#             return jsonify([]), 200

#         # Convert ObjectIds to strings for JSON
#         for cert in certificates:
#             cert['_id'] = str(cert['_id'])
#             if 'user_id' in cert and isinstance(cert['user_id'], ObjectId):
#                 cert['user_id'] = str(cert['user_id'])

#         return jsonify(certificates), 200

#     except Exception as e:
#         print("❌ Error fetching certificates:", str(e))
#         return jsonify({'error': 'Failed to load certificates'}), 500
    
@app.route('/api/user/certificates', methods=['GET', 'POST'])
@jwt_required()
def handle_certificates():
    user_identity = get_jwt_identity()

    try:
        # 🟩 Handle file upload (POST)
        if request.method == 'POST':
            print("🔍 Uploading certificate for:", user_identity)

            # Determine user identifier
            query_field = "user_email"
            user_id = user_identity
            try:
                user_id = ObjectId(user_identity)
                query_field = "user_id"
            except Exception:
                pass

            if 'file' not in request.files:
                return jsonify({'error': 'No file provided'}), 400

            file = request.files['file']
            title = request.form.get('title', '')
            description = request.form.get('description', '')

            if not file.filename:
                return jsonify({'error': 'Empty filename'}), 400

            upload_folder = 'uploads'
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, file.filename)
            file.save(file_path)

            certificate_data = {
                query_field: user_id,
                "title": title,
                "description": description,
                "filename": file.filename,
                "filepath": file_path,
            }
            result = certificates_collection.insert_one(certificate_data)
            print("✅ Uploaded certificate with ID:", result.inserted_id)

            return jsonify({
                'message': 'File uploaded successfully',
                'id': str(result.inserted_id)
            }), 201

        # 🟦 Handle fetching certificates (GET)
        elif request.method == 'GET':
            print("🔍 Fetching certificates for:", user_identity)
            query = {}
            try:
                query['user_id'] = ObjectId(user_identity)
            except Exception:
                query['user_email'] = user_identity

            certificates = list(certificates_collection.find(query))
            for cert in certificates:
                cert['_id'] = str(cert['_id'])
                if 'user_id' in cert and isinstance(cert['user_id'], ObjectId):
                    cert['user_id'] = str(cert['user_id'])

            return jsonify(certificates), 200

    except Exception as e:
        print("❌ Error in certificates API:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/certificates/<certificate_id>', methods=['GET'])
@jwt_required()
def get_certificate(certificate_id):
    try:
        if not db_connection.check_connection():
            return jsonify({'error': 'Database connection unavailable'}), 500
            
        identity = get_jwt_identity()
        claims = get_jwt()
        current_user = {'id': identity, 'email': claims.get('email'), 'role': claims.get('role')}

        certificate = certificates_collection.find_one({'_id': ObjectId(certificate_id)})

        if not certificate:
            return jsonify({'error': 'Certificate not found'}), 404

        # Determine stored owner id/email and normalize to string
        cert_owner = certificate.get('user_id') or certificate.get('user_email')
        if isinstance(cert_owner, ObjectId):
            cert_owner = str(cert_owner)

        # Check if user owns the certificate or is admin
        if cert_owner != current_user['id'] and current_user['role'] != 'admin':
            return jsonify({'error': 'Unauthorized access'}), 403

        certificate['_id'] = str(certificate['_id'])
        return jsonify(certificate), 200
        
    except Exception as e:
        print(f"Get certificate error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Admin routes
@app.route('/api/admin/certificates', methods=['GET'])
@jwt_required()
def get_all_certificates():
    try:
        if not db_connection.check_connection():
            return jsonify({'error': 'Database connection unavailable'}), 500
            
        identity = get_jwt_identity()
        claims = get_jwt()
        current_user = {'id': identity, 'email': claims.get('email'), 'role': claims.get('role')}

        if current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        certificates = list(certificates_collection.find().sort('uploaded_at', -1))
        
        # Populate user details and clean response
        for cert in certificates:
            cert['_id'] = str(cert['_id'])
            user = users_collection.find_one({'_id': ObjectId(cert['user_id'])})
            cert['user_name'] = user['name'] if user else 'Unknown'
            cert['user_email'] = user['email'] if user else 'Unknown'
            # Don't send file data in list
            if 'file_data' in cert:
                del cert['file_data']
        
        return jsonify(certificates), 200
        
    except Exception as e:
        print(f"Admin get certificates error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/certificates/<certificate_id>/verify', methods=['PUT'])
@jwt_required()
def verify_certificate(certificate_id):
    try:
        if not db_connection.check_connection():
            return jsonify({'error': 'Database connection unavailable'}), 500
            
        current_user = get_jwt_identity()
        
        if current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        status = data.get('status', 'verified')
        
        if status not in ['verified', 'rejected']:
            return jsonify({'error': 'Invalid status. Use "verified" or "rejected"'}), 400
        
        result = certificates_collection.update_one(
            {'_id': ObjectId(certificate_id)},
            {
                '$set': {
                    'status': status,
                    'verified_at': datetime.utcnow(),
                    'verified_by': current_user['id']
                }
            }
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Certificate not found or already has this status'}), 404
        
        return jsonify({'message': f'Certificate {status} successfully'}), 200
        
    except Exception as e:
        print(f"Verify certificate error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        if not db_connection.check_connection():
            return jsonify({'error': 'Database connection unavailable'}), 500
            
        current_user = get_jwt_identity()
        
        if current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        users = list(users_collection.find({}, {'password': 0}).sort('created_at', -1))
        
        # Convert ObjectId to string
        for user in users:
            user['_id'] = str(user['_id'])
        
        return jsonify(users), 200
        
    except Exception as e:
        print(f"Get users error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting Certificate Verification System...")
    print("📊 Database Status:", "Connected" if db_connection.check_connection() else "Disconnected")
    app.run(debug=True, port=5000)
    
    

