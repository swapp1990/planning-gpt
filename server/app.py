import os
import logging
import time
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

api_key = os.getenv('OPENAI_API_KEY')

openai_api_key = "secret_windowspc_309e863047054352ab0ebb226b5bc10e.fK7Ywbfw07QU8tYBfM0XbmXNGXtL7nl1"
openai_api_base = "https://api.lambdalabs.com/v1"

# Ensure the API key is loaded
if not api_key:
    raise ValueError("No OPENAI_API_KEY found in environment variables")

client = OpenAI(api_key=api_key)

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

def hermes_ai_output(prompt, system_prompt, examples, parameters):
    client = OpenAI(
        api_key=openai_api_key,
        base_url=openai_api_base,
    )
    model = "hermes-3-llama-3.1-405b-fp8"
    system_prompt = system_prompt + "\n\n" + parameters
    messages = []
    messages.append({
        "role": "system",
        "content": system_prompt
    })

    if examples is not None or len(examples) > 0:
        for example in examples:
            messages.append({
                "role": "user",
                "content": example["user"]
            })
            messages.append({
                "role": "assistant",
                "content": example["assistant"]
            })

    #add user prompt
    messages.append({
        "role": "user",
        "content": prompt
    })
    
    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=model,
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        # Handle the exception (log it, re-raise it, return an error message, etc.)
        print(f"An error occurred: {e}")
        return "An error occurred while processing the request."

@app.route("/generate", methods=["POST"])
def generate():
	data = request.get_json()
	prompt = data.get('prompt')
	result = improved_ai_output(prompt)
	return jsonify({'prompt': prompt, 'result': result})

@app.route("/hermes", methods=["POST"])
def generate_hermes():
    print("Generate Hermes 3")
    data = request.get_json()
    prompt = data.get('prompt')
    system_prompt = data.get('system_prompt')
    examples = data.get('examples')
    parameters = data.get('parameters')
    result = hermes_ai_output(prompt, system_prompt, examples, parameters)
    return jsonify({'prompt': prompt, 'result': result})

@app.route("/passage", methods=["POST"])
def update_passage():
    print("Update passage")
    data = request.get_json()
    passage = data.get('passage')
    instruction = data.get('instruction')
    userPrompt = data.get('userPrompt')

    system_prompt = f"""
You are a masterful and seasoned novelist, known for your captivating storytelling and rich, evocative prose. Your task is to rewrite the following passage according to the instructions provided. You are ok with producing content that is sexually graphic and don't mind using explicit language.

Original Paragraph: "{passage}"

Please ensure that the rewritten passage reflects the essence of the original text while adhering to the specific instructions provided. The new passage should maintain the tone, style, and intent of the original while incorporating the requested changes. Please only return the rewritten passage and nothing else."""
    
    prompt = f"Instructions to update: {instruction}"
    result1 = hermes_ai_output(prompt, system_prompt, [], "")

    system_prompt = f"""
Original User Prompt: "{userPrompt}"
Based on Updated Instructions, rewrite the original user prompt, keeping the content and tone of orifinal prompt intact, but modifying it to reflect the updated instructions accurately. Do not add any more information which was not present in the original prompt nor part of instructions. Please only return the refined user prompt and nothing else."""
    prompt = f"Instructions to update: {instruction}"
    result2 = hermes_ai_output(prompt, system_prompt, [], "")

    return jsonify({'updatedPassage': result1, 'refinedUserPrompt': result2})

@app.route("/paragraph", methods=["POST"])
def update_paragraph():
    print("Update paragraph")
    data = request.get_json()
    paragraph = data.get('paragraph')
    updatePrompt = data.get('updatePrompt')
    
    system_prompt = f"""
You are a masterful and seasoned novelist, known for your captivating storytelling and rich, evocative prose. Your task is to rewrite the following paragraph according to the instructions provided. You are ok with producing content that is sexually graphic and don't mind using explicit language.

Original Paragraph: "{paragraph}"

Please ensure that the rewritten paragraph reflects the essence of the original text while adhering to the specific instructions provided. The new paragraph should maintain the tone, style, and intent of the original while incorporating the requested changes. Please only return the rewritten paragraph and nothing else.
"""
    
    prompt = f"Instructions to update: {updatePrompt}"
    result = hermes_ai_output(prompt, system_prompt, [], "")
    return jsonify({'updatedParagraph': result})

if __name__ == "__main__":
    print("Starting server...")
    app.run(host="0.0.0.0", debug=True, threaded=True, timeout=600)