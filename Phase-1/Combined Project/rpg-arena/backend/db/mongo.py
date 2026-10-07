import os

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

_client = MongoClient(os.getenv("MONGO_URI"))
_db = _client[os.getenv("MONGO_DB")]


def get_db():
    return _db