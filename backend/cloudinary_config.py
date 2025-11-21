import cloudinary
import os
from pathlib import Path
from dotenv import load_dotenv
import cloudinary.uploader
import cloudinary.api
# optional: load from a .env file if python-dotenv is installed
try:
  env_path = Path(__file__).resolve().parent / '.env'
  load_dotenv(env_path)
except Exception:
  pass

cloudinary.config(
  cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
  api_key=os.getenv("CLOUDINARY_API_KEY"),
  api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

# quick check to fail fast if creds are missing
if not all([os.getenv("CLOUDINARY_CLOUD_NAME"), os.getenv("CLOUDINARY_API_KEY"), os.getenv("CLOUDINARY_API_SECRET")]):
  raise EnvironmentError("Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in environment or .env")
