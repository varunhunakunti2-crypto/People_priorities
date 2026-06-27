import secrets
from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.department_budget import DepartmentBudget

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    department = data.get('department')
    role = data.get('role', 'employee')
    
    if not email or not password or not full_name or not department:
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already registered'}), 400
        
    user = User(
        email=email,
        full_name=full_name,
        department=department,
        role=role
    )
    user.set_password(password)
    
    # Generate session token on registration
    token = secrets.token_hex(32)
    user.session_token = token
    
    db.session.add(user)
    db.session.commit()
    
    # Check if budget exists for the department. If not, auto-create a default one.
    budget = DepartmentBudget.query.filter_by(department=department).first()
    if not budget:
        budget = DepartmentBudget(department=department, monthly_limit=5000.0, spent_amount=0.0)
        db.session.add(budget)
        db.session.commit()
        
    return jsonify({
        'success': True,
        'token': token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        # Generic message - do not reveal whether the email exists
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
        
    # Generate session token using secrets.token_hex()
    token = secrets.token_hex(32)
    user.session_token = token
    db.session.commit()
    
    return jsonify({
        'success': True,
        'token': token,
        'user': user.to_dict()
    }), 200
