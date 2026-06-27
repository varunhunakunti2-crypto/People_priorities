from functools import wraps
from flask import request, jsonify, g
from app.models.user import User

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
            else:
                token = auth_header
                
        if not token:
            return jsonify({'success': False, 'message': 'Token is missing'}), 401
            
        # Look up user by session token
        user = User.query.filter_by(session_token=token).first()
        if not user:
            return jsonify({'success': False, 'message': 'Invalid session token'}), 401
            
        # Attach user to Flask's g context
        g.current_user = user
        
        return f(*args, **kwargs)
        
    return decorated

def require_role(role):
    """
    Decorator to restrict access based on user role (e.g., 'manager', 'employee').
    Must be used AFTER @require_auth.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Ensure g.current_user exists (assigned by @require_auth)
            current_user = getattr(g, 'current_user', None)
            if not current_user:
                return jsonify({'success': False, 'message': 'Authentication required'}), 401
                
            if current_user.role != role:
                return jsonify({'success': False, 'message': 'Unauthorized action'}), 403
                
            return f(*args, **kwargs)
        return decorated
    return decorator
