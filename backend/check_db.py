from pymongo import MongoClient
from bson import ObjectId

mongo_uri = 'mongodb://localhost:27017'
client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
try:
    client.admin.command('ismaster')
except Exception as e:
    print('MongoDB connection error:', e)
    raise SystemExit(1)

db = client.certificate_system
certs = db.certificates

count = certs.count_documents({})
print(f'Total certificates in DB: {count}')

# Print last 10 documents sorted by _id (insertion order)
for doc in certs.find().sort('_id', -1).limit(10):
    doc_display = {k: (str(v) if isinstance(v, ObjectId) else v) for k, v in doc.items() if k != 'file_data'}
    # Show if file_data exists and its size
    if 'file_data' in doc:
        doc_display['file_data_len'] = len(doc['file_data'])
    print(doc_display)
