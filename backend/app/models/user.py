from datetime import datetime, timezone
from app import db, bcrypt

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.Enum('sales', 'engineering', 'hr', 'marketing', name='department_enum'), nullable=False)
    role = db.Column(db.Enum('employee', 'manager', name='role_enum'), nullable=False)
    session_token = db.Column(db.String(255), nullable=True)
    
    # Relationships
    expenses = db.relationship('Expense', backref='employee', lazy=True)
    
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)
        
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'full_name': self.full_name,
            'department': self.department,
            'role': self.role,
            'session_token': self.session_token
        }
