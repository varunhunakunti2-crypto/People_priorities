from app import db

class DepartmentBudget(db.Model):
    __tablename__ = 'department_budgets'
    
    id = db.Column(db.Integer, primary_key=True)
    department = db.Column(db.String(100), unique=True, nullable=False, index=True)
    monthly_limit = db.Column(db.Numeric(12, 2), nullable=False)
    spent_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0.0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'department': self.department,
            'monthly_limit': float(self.monthly_limit),
            'spent_amount': float(self.spent_amount)
        }
