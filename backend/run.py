import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Retrieve port from environment, default to 5000
    port = int(os.environ.get('PORT', 5000))
    # Run server on all interfaces (0.0.0.0) so it's accessible externally if needed
    app.run(host='0.0.0.0', port=port, debug=True)
