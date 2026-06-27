from flask import Blueprint, request, jsonify, g
from app import db
from app.models.expense import Expense
from app.models.department_budget import DepartmentBudget
from app.middleware.auth import require_auth, require_role

expenses_bp = Blueprint('expenses', __name__)

@expenses_bp.route('/expenses/submit', methods=['POST'])
@require_auth
def submit_expense():
    current_user = g.current_user
    data = request.get_json() or {}
    
    amount_raw = data.get('amount')
    category = data.get('category')
    description = data.get('description', '')
    
    if amount_raw is None or not category:
        return jsonify({'success': False, 'message': 'Missing amount or category'}), 400
        
    try:
        amount = float(amount_raw)
    except ValueError:
        return jsonify({'success': False, 'message': 'Amount must be a number'}), 400
        
    if amount <= 0:
        return jsonify({'success': False, 'message': 'Amount must be a positive number greater than zero'}), 400
        
    allowed_categories = ['travel', 'meals', 'software', 'hardware']
    if category.lower() not in allowed_categories:
        return jsonify({'success': False, 'message': f'Category must be one of {allowed_categories}'}), 400
        
    budget = DepartmentBudget.query.filter_by(department=current_user.department).first()
    if not budget:
        budget = DepartmentBudget(department=current_user.department, monthly_limit=5000.0, spent_amount=0.0)
        db.session.add(budget)
        db.session.commit()
        
    expense = Expense(
        amount=amount,
        category=category.lower(),
        description=description,
        status='pending',
        employee_id=current_user.id
    )
    
    db.session.add(expense)
    db.session.commit()
    
    projected_spent = float(budget.spent_amount) + amount
    utilization_ratio = projected_spent / float(budget.monthly_limit) if budget.monthly_limit > 0 else 0
    budget_warning = utilization_ratio >= 0.9
    
    response_data = {
        'success': True,
        'message': 'Expense submitted successfully',
        'expense': expense.to_dict()
    }
    
    if budget_warning:
        response_data['budget_warning'] = True
        
    return jsonify(response_data), 201

@expenses_bp.route('/expenses/history', methods=['GET'])
@require_auth
@require_role('employee')
def get_history():
    current_user = g.current_user
    status_filter = request.args.get('status')
    
    query = Expense.query.filter_by(employee_id=current_user.id)
    if status_filter:
        query = query.filter_by(status=status_filter.lower())
        
    expenses = query.order_by(Expense.created_at.desc()).all()
    
    return jsonify({
        'success': True,
        'expenses': [expense.to_dict() for expense in expenses]
    }), 200
