from datetime import datetime, timezone
from app import db

class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    category = db.Column(db.Enum('travel', 'meals', 'software', 'hardware', name='category_enum'), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum('pending', 'approved', 'rejected', name='status_enum'), nullable=False, default='pending')
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'amount': float(self.amount),
            'category': self.category,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'employee_name': self.employee.full_name if self.employee else None,
            'full_name': self.employee.full_name if self.employee else None,
            'department': self.employee.department if self.employee else None
        }
