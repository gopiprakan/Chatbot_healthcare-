from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app) # Added CORS so the frontend JavaScript can call the backend

# Construct full path to health_data.json to avoid FileNotFoundError
base_dir = os.path.dirname(os.path.abspath(__file__))
json_path = os.path.join(base_dir, "health_data.json")

# Load health dataset
with open(json_path, "r", encoding="utf-8") as f:
    health_data = json.load(f)


def get_response(user_input):
    user_input = user_input.lower()

    for key in health_data:
        if key in user_input:
            advice = health_data[key]["advice"]
            food = ", ".join(health_data[key]["food"])

            return f"""
⚠️ This is general advice only.

🩺 Advice: {advice}

🍽️ Suggested Food: {food}
"""

    return "Sorry, I couldn't understand. Please describe your symptoms clearly."


@app.route("/chat", methods=["POST", "OPTIONS"])
def chat():
    # Handle OPTIONS explicitly, though flask-cors usually covers this
    if request.method == "OPTIONS":
        return jsonify({}), 200
        
    data = request.get_json()
    user_message = data.get("message", "")

    bot_reply = get_response(user_message)

    return jsonify({"response": bot_reply})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
