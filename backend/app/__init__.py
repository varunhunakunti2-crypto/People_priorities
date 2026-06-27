import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from config import config_by_name

# Initialize Flask extensions
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
cors = CORS()

def create_app(config_name=None):
    """
    Application factory function.
    """
    app = Flask(__name__)
    
    if not config_name:
        config_name = os.environ.get('FLASK_ENV', 'development')
        
    app.config.from_object(config_by_name.get(config_name, config_by_name['development']))
    
    # Initialize extensions with the app instance
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    
    # Enable CORS. The frontend should match the CORS origin.
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})
    
    # Register Blueprints
    from app.routes.auth import auth_bp
    from app.routes.expenses import expenses_bp
    from app.routes.manager import manager_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/v1')
    app.register_blueprint(expenses_bp, url_prefix='/api/v1')
    app.register_blueprint(manager_bp, url_prefix='/api/v1')
    
    return app
