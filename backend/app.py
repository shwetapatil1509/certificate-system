from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    get_jwt_identity, get_jwt
)
from bson import ObjectId
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
import cloudinary.uploader
import cloudinary_config
import bcrypt
import base64

# Import your MongoDB helper functions
from database import get_database, get_original_data_collection, get_users_collection, get_certificates_collection, db_connection

# ────────────────────────────────
# Setup
# ────────────────────────────────
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "secret123")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
jwt = JWTManager(app)

users_collection = get_users_collection()
certificates_collection = get_certificates_collection()
original_data_collection = get_original_data_collection()

# ────────────────────────────────
# AUTH
# ────────────────────────────────
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    name, email, password = data.get("name"), data.get("email"), data.get("password")
    role = data.get("role", "user")

    if not (name and email and password):
        return jsonify({"error": "All fields required"}), 400
    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    user = {"name": name, "email": email, "password": hashed_pw, "role": role}
    users_collection.insert_one(user)
    return jsonify({"message": "User registered successfully"}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email, password = data.get("email"), data.get("password")

    user = users_collection.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=str(user["_id"]),
        additional_claims={
            "email": user["email"],
            "role": user["role"],
            "name": user["name"],
        },
    )
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        }
    }), 200

# ────────────────────────────────
# USER CERTIFICATES
# ────────────────────────────────
@app.route("/api/certificates", methods=["POST"])
@jwt_required()
def upload_certificate():
    try:
        claims = get_jwt()
        user_id = get_jwt_identity()
        role = claims.get("role")

        title = request.form.get("title")
        file = request.files.get("file")

        if not file or not title:
            return jsonify({"error": "Missing file or title"}), 400

        # Upload file to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file,
            folder="academic_certificates",
            resource_type="auto"   # auto handles PDF, PNG, JPG etc.
        )
#   upload_dir = "uploads"
#     os.makedirs(upload_dir, exist_ok=True)
#     file_path = os.path.join(upload_dir, file.filename)
#     file.save(file_path)

        # Insert into MongoDB
        certificate = {
            "user_id": user_id,
            "title": title,
            "file_name": file.filename,        # original name
            "certificate_url": upload_result["secure_url"], # CLOUDINARY URL
            "public_id": upload_result["public_id"],        # for delete/update
            "status": "pending",
            "uploaded_at": datetime.utcnow(),
        }

        certificates_collection.insert_one(certificate)

        return jsonify({
            "message": "Certificate uploaded successfully",
            "certificate_url": upload_result["secure_url"]
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/certificates", methods=["GET"])
@jwt_required()
def get_user_certificates():
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    if role == "admin":
        certs = list(certificates_collection.find())
    else:
        certs = list(certificates_collection.find({"user_id": user_id}))

    for c in certs:
        c["_id"] = str(c["_id"])
        c["uploaded_at"] = c.get("uploaded_at", datetime.utcnow()).isoformat()
    return jsonify(certs), 200

# ────────────────────────────────
# ADMIN ROUTES
# ────────────────────────────────
@app.route("/api/admin/certificates", methods=["GET"])
@jwt_required()
def get_all_certificates_admin():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    certs = list(certificates_collection.find())
    for cert in certs:
        cert["_id"] = str(cert["_id"])
        cert["uploaded_at"] = cert.get("uploaded_at", datetime.utcnow()).isoformat()

        try:
            user_obj_id = ObjectId(cert["user_id"])
            user = users_collection.find_one({"_id": user_obj_id})
        except Exception:
            user = users_collection.find_one({"_id": cert["user_id"]})

        cert["user_name"] = user["name"] if user else "Unknown"
        cert["user_email"] = user["email"] if user else "Unknown"

    return jsonify(certs), 200


@app.route("/api/admin/certificates/<cert_id>/verify", methods=["PUT"])
@jwt_required()
def update_certificate_status(cert_id):
    print("🔵 API HIT: certificates route") 
    try:
        data = request.get_json()
        status = data.get("status")

        if status not in ["verified", "rejected"]:
            return jsonify({"error": "Invalid status"}), 400

        # Fetch certificate from certificates collection
        cert = certificates_collection.find_one({"_id": ObjectId(cert_id)})
        if not cert:
            return jsonify({"error": "Certificate not found"}), 404

        # Debug: show certificate data
        cert_debug = {
            "cert_id": str(cert.get("_id")),
            "public_id": cert.get("public_id"),
            "file_name": cert.get("file_name"),
            "title": cert.get("title"),
            "status": cert.get("status"),
        }

        # Direct reject
        if status == "rejected":
            certificates_collection.update_one(
                {"_id": ObjectId(cert_id)},
                {"$set": {"status": "rejected"}}
            )
            return jsonify({
                "message": "Certificate rejected",
                "certificate": cert_debug,
                "original_data_match": None
            }), 200

        # VERIFY → Check Original_data using PUBLIC ID
        original = original_data_collection.find_one({
            "public_id": cert.get("public_id")
        })

        # Debug: show original data or None
        original_debug = None
        if original:
            original_debug = {
                "original_id": str(original.get("_id")),
                "public_id": original.get("public_id"),
                "file_name": original.get("file_name"),
                "title": original.get("title")
            }

        if original:
            certificates_collection.update_one(
                {"_id": ObjectId(cert_id)},
                {"$set": {"status": "verified"}}
            )
            return jsonify({
                "message": "Certificate verified SSSuccessfully",
                "certificate": cert_debug,
                "original_data_match": original_debug
            }), 200
        else:
            certificates_collection.update_one(
                {"_id": ObjectId(cert_id)},
                {"$set": {"status": "rejected"}}
            )
            return jsonify({
                "message": "FAKE certificate! Rejected",
                "certificate": cert_debug,
                "original_data_match": None
            }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/users", methods=["GET"])
@jwt_required()
def list_users():
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    users = list(users_collection.find({}, {"password": 0}))
    for u in users:
        u["_id"] = str(u["_id"])
    return jsonify(users), 200

@app.route("/api/certificate/<cert_id>/view", methods=["GET"])
@jwt_required()
def view_certificate(cert_id):
    """
    Returns or redirects to the Cloudinary certificate URL.
    Only admin or owner of certificate can access.
    """
    user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")

    # Fetch certificate from MongoDB
    cert = certificates_collection.find_one({"_id": ObjectId(cert_id)})
    if not cert:
        return jsonify({"error": "Certificate not found"}), 404

    # Authorization: Admin or owner
    if role != "admin" and cert["user_id"] != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    # Option 1: Redirect to Cloudinary URL
    return redirect(cert.get("certificate_url"))

    # Option 2 (alternative): Return JSON URL
    # return jsonify({"certificate_url": cert.get("certificate_url")})

@app.route('/api/check_certificate/<cert_id>', methods=['GET'])
@jwt_required()
def check_certificate(cert_id):
    try:
        if not ObjectId.is_valid(cert_id):
            return jsonify({"error": "Invalid certificate ID"}), 400

        certificate = certificates_collection.find_one({"_id": ObjectId(cert_id)})
        if not certificate:
            return jsonify({"valid": False, "message": "Certificate not found"}), 404

        public_id = certificate.get("public_id")
        if not public_id:
            return jsonify({"valid": False, "message": "Image missing"}), 404

        # Check in Cloudinary
        try:
            cloudinary.api.resource(public_id)
            return jsonify({
                "valid": True,
                "message": "Certificate is original",
                "cloudinary_url": certificate["cloudinary_url"],
                "title": certificate["title"],
                "user_id": certificate["user_id"],
                "status": certificate["status"]
            }), 200

        except cloudinary.exceptions.NotFound:
            return jsonify({
                "valid": False,
                "message": "FAKE / Image not found in Cloudinary"
            }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True)
