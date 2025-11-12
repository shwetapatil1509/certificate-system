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
import bcrypt
import base64

# Import your MongoDB helper functions
from database import get_database, get_users_collection, get_certificates_collection, db_connection

# ────────────────────────────────
# Setup
# ────────────────────────────────
load_dotenv()
app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "secret123")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
jwt = JWTManager(app)

users_collection = get_users_collection()
certificates_collection = get_certificates_collection()

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
    claims = get_jwt()
    user_id = get_jwt_identity()
    role = claims.get("role")

    title = request.form.get("title")
    file = request.files.get("file")

    if not file or not title:
        return jsonify({"error": "Missing file or title"}), 400

    # save file on disk
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    file.save(file_path)

    certificate = {
        "user_id": user_id,
        "title": title,
        "file_name": file.filename,
        "file_path": file_path,
        "status": "pending",
        "uploaded_at": datetime.utcnow(),
    }
    certificates_collection.insert_one(certificate)
    return jsonify({"message": "Certificate uploaded successfully"}), 201


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
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    new_status = data.get("status")

    if new_status not in ["verified", "rejected"]:
        return jsonify({"error": "Invalid status"}), 400

    res = certificates_collection.update_one(
         {"_id": ObjectId(cert_id)},
        {"$set": {"status": new_status}},
    )

    if res.modified_count == 0:
        return jsonify({"error": "Certificate not found"}), 404

    return jsonify({"message": f"Certificate {new_status} successfully"}), 200


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


# ────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True)
