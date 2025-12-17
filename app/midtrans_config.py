import os
from midtransclient import Snap, CoreApi

# Midtrans Configuration dari Environment Variables
MIDTRANS_SERVER_KEY = os.getenv("MIDTRANS_SERVER_KEY", "")
MIDTRANS_CLIENT_KEY = os.getenv("MIDTRANS_CLIENT_KEY", "")
MIDTRANS_IS_PRODUCTION = os.getenv("MIDTRANS_IS_PRODUCTION", "false").lower() == "true"
MIDTRANS_API_URL = os.getenv("MIDTRANS_API_URL", "https://app.sandbox.midtrans.com")

# Initialize Midtrans Snap API
def get_midtrans_snap():
    """Get Midtrans Snap API instance"""
    if not MIDTRANS_SERVER_KEY:
        raise ValueError("MIDTRANS_SERVER_KEY is not set in environment variables")
    
    return Snap(
        is_production=MIDTRANS_IS_PRODUCTION,
        server_key=MIDTRANS_SERVER_KEY,
        client_key=MIDTRANS_CLIENT_KEY
    )

# Initialize Midtrans Core API
def get_midtrans_core():
    """Get Midtrans Core API instance"""
    if not MIDTRANS_SERVER_KEY:
        raise ValueError("MIDTRANS_SERVER_KEY is not set in environment variables")
    
    return CoreApi(
        is_production=MIDTRANS_IS_PRODUCTION,
        server_key=MIDTRANS_SERVER_KEY,
        client_key=MIDTRANS_CLIENT_KEY
    )

