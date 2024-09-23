from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import logging
from dotenv import load_dotenv
from core.llm_client import LLMClient
from api.routes import api, init_routes
from services.writing_service import WritingService

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

llm_client = LLMClient()
writing_service = WritingService(llm_client)
init_routes(writing_service)
app.register_blueprint(api)

if __name__ == "__main__":
    print("Starting server...")
    app.run(host="0.0.0.0", debug=True, threaded=True)