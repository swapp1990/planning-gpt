import os
import logging
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

api_key = os.getenv('OPENAI_API_KEY')

# Ensure the API key is loaded
if not api_key:
    raise ValueError("No OPENAI_API_KEY found in environment variables")

client = openai.OpenAI(api_key=api_key)

def generate_response(user_query, best_plan):
	response = client.chat.completions.create(
		model="gpt-4o-mini",
		messages=[
			{"role": "system", "content": "You are a helpful assistant. Use the given plan to create a detailed and high-quality response to the user's query."},
			{"role": "user", "content": f"User Query: {user_query}\n\nPlan: {best_plan['content']}\n\nGenerate a detailed response based on this plan."}
		],
		temperature=0.5,
		max_tokens=2000
    )
	return response.choices[0].message.content

def generate_plans(user_query, n=5):
    """Generate multiple plans using GPT-4o-Mini."""
    plans = []
    
    for _ in range(n):
        while True:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a strategic reasoner. Given a user query, create a detailed plan to address it and then respond to the user. You will do so by using <thinking> and <response> tags. The user will only see what is in <response>, the <thinking> is just a scratchpad for you to figure out the best approach to satisfy the user's request. First, plan inside <thinking> tags, and then write your <response>."},
                    {"role": "user", "content": user_query}
                ],
                temperature=0.7,
                max_tokens=500,
                stop=['</thinking>']
            )
            content = response.choices[0].message.content.replace('<thinking>', '')
            
            title_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a strategic reasoner. Given a plan, generate a one-line title for it."},
                    {"role": "user", "content": content}
                ],
                temperature=0.5,
                max_tokens=10
            )
            title = title_response.choices[0].message.content.strip()
            
            if all(plan['content'] != content for plan in plans):
                break

        difference_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a strategic reasoner. Given two plans, describe in one line why the new plan is different from the others."},
                {"role": "user", "content": f"Existing Plans: {', '.join([plan['title'] for plan in plans])}\n\nNew Plan: {title}"}
            ],
            temperature=0.5,
            max_tokens=50
        )
        difference = difference_response.choices[0].message.content.strip()
        
        plans.append({"id": len(plans)+1, "title": title, "content": content, "rank": 0})
        
        logger.info(f"Generated Plan {len(plans)}: {title} - {difference}")

    return plans

def evaluate_plans(plans, user_query):
    """Evaluate plans using a tournament ranking system."""
    def compare_plans(plan1, plan2):
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a judge evaluating two plans. Choose the better plan based on effectiveness, feasibility, and relevance to the user's query."},
                {"role": "user", "content": f"User Query: {user_query}\n\nPlan 1: {plan1['content']}\n\nPlan 2: {plan2['content']}\n\nWhich plan is better? Respond with either '1' or '2'."}
            ],
            temperature=0.2,
            max_tokens=10
        )
        return 1 if response.choices[0].message.content.strip() == "1" else 2

    # Tournament ranking
    winners = plans
    while len(winners) > 1:
        next_round = []
        for i in range(0, len(winners), 2):
            if i + 1 < len(winners):
                winner_index = i if compare_plans(winners[i], winners[i+1]) == 1 else i+1
                winners[winner_index]['rank'] += 1
                next_round.append(winners[winner_index])
            else:
                next_round.append(winners[i])
        winners = next_round

    # Rank the plans based on wins
    plans_sorted = sorted(plans, key=lambda x: x['rank'], reverse=True)
    return plans_sorted

def improved_ai_output(prompt, num_plans=4):
	logger.info(f"Generating plans for prompt: {prompt}")
	plans = generate_plans(prompt, n=num_plans)
     
	logger.info(f"Evaluating plans for prompt: {prompt}")
	ranked_plans = evaluate_plans(plans, prompt)
	best_plan = ranked_plans[0]
	final_response = generate_response(prompt, best_plan)
	return final_response

@app.route("/generate", methods=["POST"])
def generate():
	data = request.get_json()
	prompt = data.get('prompt')
	result = improved_ai_output(prompt)
	return jsonify({'prompt': prompt, 'result': result})

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True)