from flask import Blueprint, request, jsonify, g
from app import db
from app.models.expense import Expense
from app.models.department_budget import DepartmentBudget
from app.models.user import User
from app.middleware.auth import require_auth, require_role

manager_bp = Blueprint('manager', __name__)

@manager_bp.route('/manager/approvals', methods=['GET'])
@require_auth
@require_role('manager')
def get_pending_approvals():
    current_user = g.current_user
    # Retrieve all pending expenses for employees in the manager's department
    expenses = Expense.query.join(User, Expense.employee_id == User.id).filter(
        User.department == current_user.department,
        Expense.status == 'pending'
    ).order_by(Expense.created_at.asc()).all()
    
    return jsonify({
        'success': True,
        'approvals': [expense.to_dict() for expense in expenses]
    }), 200

@manager_bp.route('/manager/approvals/<int:expense_id>', methods=['PUT'])
@require_auth
@require_role('manager')
def update_approval_status(expense_id):
    current_user = g.current_user
    data = request.get_json() or {}
    new_status = data.get('status')
    
    if new_status not in ['approved', 'rejected']:
        return jsonify({'success': False, 'message': 'Invalid status'}), 400
        
    expense = Expense.query.get(expense_id)
    if not expense:
        return jsonify({'success': False, 'message': 'Expense not found'}), 404
        
    # Verify the expense's employee department matches current manager's department
    if not expense.employee or expense.employee.department != current_user.department:
        return jsonify({'success': False, 'message': 'Unauthorized to modify this expense'}), 403
        
    # Block double-approval: status must be 'pending'
    # Cast to string or get enum value to support SQLite/PostgreSQL enum representation
    status_str = getattr(expense.status, 'name', str(expense.status))
    if status_str != 'pending':
        return jsonify({'success': False, 'message': 'Expense has already been processed'}), 400
        
    # Wrap database transaction for atomicity
    try:
        expense.status = new_status
        
        # If approved, update the budget spent amount
        if new_status == 'approved':
            budget = DepartmentBudget.query.filter_by(department=current_user.department).first()
            if not budget:
                budget = DepartmentBudget(department=current_user.department, monthly_limit=5000.0, spent_amount=0.0)
                db.session.add(budget)
                
            budget.spent_amount = float(budget.spent_amount) + float(expense.amount)
            
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Database operation failed: {str(e)}'}), 500
        
    return jsonify({
        'success': True,
        'message': f'Expense successfully {new_status}',
        'expense': expense.to_dict()
    }), 200

@manager_bp.route('/manager/budget', methods=['GET'])
@require_auth
@require_role('manager')
def get_manager_budget():
    current_user = g.current_user
    budget = DepartmentBudget.query.filter_by(department=current_user.department).first()
    
    if not budget:
        # Create a default department budget if one doesn't exist yet
        budget = DepartmentBudget(department=current_user.department, monthly_limit=5000.0, spent_amount=0.0)
        db.session.add(budget)
        db.session.commit()
        
    percent_used = (float(budget.spent_amount) / float(budget.monthly_limit)) * 100 if budget.monthly_limit > 0 else 0
    
    if percent_used >= 90:
        status_level = 'critical'
    elif percent_used >= 75:
        status_level = 'warning'
    else:
        status_level = 'safe'
        
    budget_data = {
        'id': budget.id,
        'department': budget.department,
        'monthly_limit': float(budget.monthly_limit),
        'spent_amount': float(budget.spent_amount),
        'percent_used': round(percent_used, 1),
        'status_level': status_level
    }
    
    return jsonify({
        'success': True,
        'budget': budget_data
    }), 200

@manager_bp.route('/manager/budget/breakdown', methods=['GET'])
@require_auth
@require_role('manager')
def get_manager_budget_breakdown():
    current_user = g.current_user
    # Sum amount of approved expenses in manager's department per category
    results = db.session.query(
        Expense.category,
        db.func.sum(Expense.amount)
    ).join(User, Expense.employee_id == User.id).filter(
        User.department == current_user.department,
        Expense.status == 'approved'
    ).group_by(Expense.category).all()
    
    # We also want to include all standard categories even if total is 0
    categories = ['travel', 'meals', 'software', 'hardware']
    breakdown_map = {cat: 0.0 for cat in categories}
    
    for category_val, total in results:
        cat_str = str(category_val).lower()
        if '.' in cat_str:
            cat_str = cat_str.split('.')[-1]
            
        if cat_str in breakdown_map:
            breakdown_map[cat_str] = float(total)
        else:
            breakdown_map[cat_str] = float(total)
            
    breakdown_list = [{'category': k, 'total': v} for k, v in breakdown_map.items()]
    
    return jsonify({
        'success': True,
        'breakdown': breakdown_list
    }), 200
