class Config: 
    APP_NAME = "Job Tracker"
    SECRET_KEY = "change-mechange-mechange-mechange-mechange-mechange-mechange-me"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevConfig(Config):
    DEBUG = True
    ENV_NAME = "dev"
    SQLALCHEMY_DATABASE_URI = "sqlite:///job_tracker.db"
    JWT_SECRET_KEY = "ThisIsASecretKeyThisIsASecretKeyThisIsASecretKeyThisIsASecretKeyThisIsASecretKey"

class TestConfig(Config):
    TESTING = True
    ENV_NAME = "test"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "ThisIsASecretKeyThisIsASecretKeyThisIsASecretKeyThisIsASecretKeyThisIsASecretKey"

class ProdConfig(Config):
    DEBUG = False
    ENV_NAME = "prod"
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    JWT_SECRET_KEY = "ThisIsASecretKeyThisIsASecretKeyThisIsASecretKeyThisIsASecretKeyThisIsASecretKey"