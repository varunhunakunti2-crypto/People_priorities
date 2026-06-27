from app import create_app, db
from app.models.user import User
from app.models.department_budget import DepartmentBudget
from app.models.expense import Expense

app = create_app()

def seed_db():
    with app.app_context():
        print("Clearing existing data...")
        # Delete expenses first due to foreign key constraints
        db.session.query(Expense).delete()
        db.session.query(User).delete()
        db.session.query(DepartmentBudget).delete()
        db.session.commit()
        
        # 1. Create budgets
        departments = ['sales', 'engineering', 'hr', 'marketing']
        print("Seeding budgets...")
        for dept in departments:
            budget = DepartmentBudget(
                department=dept,
                monthly_limit=5000.0,
                spent_amount=0.0
            )
            db.session.add(budget)
        db.session.commit()
        
        # 2. Seed Users
        users_data = [
            # Managers
            {'email': 'sales_manager@example.com', 'full_name': 'Bob Jones', 'department': 'sales', 'role': 'manager'},
            {'email': 'eng_manager@example.com', 'full_name': 'Diana Prince', 'department': 'engineering', 'role': 'manager'},
            {'email': 'hr_manager@example.com', 'full_name': 'Fiona Gallagher', 'department': 'hr', 'role': 'manager'},
            {'email': 'mktg_manager@example.com', 'full_name': 'Helen Mirren', 'department': 'marketing', 'role': 'manager'},
            
            # Employees
            {'email': 'sales_employee@example.com', 'full_name': 'Alice Smith', 'department': 'sales', 'role': 'employee'},
            {'email': 'eng_employee@example.com', 'full_name': 'Charlie Brown', 'department': 'engineering', 'role': 'employee'},
            {'email': 'hr_employee@example.com', 'full_name': 'Evan Wright', 'department': 'hr', 'role': 'employee'},
            {'email': 'mktg_employee@example.com', 'full_name': 'George Costanza', 'department': 'marketing', 'role': 'employee'},
        ]
        
        print("Seeding users...")
        for data in users_data:
            user = User(
                email=data['email'],
                full_name=data['full_name'],
                department=data['department'],
                role=data['role']
            )
            user.set_password('password123')
            db.session.add(user)
            
        db.session.commit()
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_db()
