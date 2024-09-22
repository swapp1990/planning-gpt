from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from core.llm_client import LLMClient
from api.routes import api, init_routes
from services.writing_service import WritingService

app = Flask(__name__)
CORS(app)

llm_client = LLMClient()
writing_service = WritingService(llm_client)
init_routes(writing_service)
app.register_blueprint(api)

if __name__ == "__main__":
    print("Starting server...")
    app.run(host="0.0.0.0", debug=True, threaded=True)