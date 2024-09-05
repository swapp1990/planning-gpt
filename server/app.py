import os
import re
import logging
import time
import json
from dotenv import load_dotenv
from flask import Flask, request, jsonify,Response, stream_with_context
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

openai_api_key = os.getenv('LAMBDA_API_KEY')
openai_api_base = "https://api.lambdalabs.com/v1"

@app.before_request
def before_request():
    request.start_time = time.time()

@app.after_request
def after_request(response):
    duration = time.time() - request.start_time
    if duration > 10:  # Log requests taking more than 10 seconds (adjust as needed)
        app.logger.warning(f"Request to {request.path} took {duration:.2f} seconds.")
    return response

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
    # model = "wrong-model"
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
        print(f"An error occurred: {e}")
        return {"error": "An error occurred while processing the request."}

def hermes_ai_streamed_output(prompt, system_prompt, examples, parameters):
    client = OpenAI(
        api_key=openai_api_key,
        base_url=openai_api_base,
    )
    
    if prompt is None or len(prompt) == 0:
        yield "Please provide a valid prompt."
        return
    
    model = "hermes-3-llama-3.1-405b-fp8"
    # model = "wrong-model"
    system_prompt = system_prompt + "\n\n" + parameters
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    if examples is not None and len(examples) > 0:
        for example in examples:
            messages.extend([
                {"role": "user", "content": example["user"]},
                {"role": "assistant", "content": example["assistant"]}
            ])
    
    messages.append({"role": "user", "content": prompt})
    
    # print(messages)
    
    try:
        chat_completion = client.chat.completions.create(
            messages=messages,
            model=model,
            stream=True
        )
        
        final_response = ""
        current_sentence = ""
        for chunk in chat_completion:
            msg = chunk.choices[0].delta.content or ""
            current_sentence += msg
            
            sentences = re.split(r'(?<=[.!?])\s+', current_sentence)
            
            if len(sentences) > 1:
                complete_sentences = sentences[:-1]
                for sentence in complete_sentences:
                    # print(sentence.strip())
                    yield sentence.strip()
                    final_response += sentence + " "
                
                current_sentence = sentences[-1]
        
        if current_sentence.strip():
            # print(current_sentence.strip())
            yield current_sentence.strip()
            final_response += current_sentence
        
        yield "[DONE]"
        
    except Exception as e:
        print(f"An error occurred: {e}")
        yield {"error": "An error occurred"}

def generate_summary(paragraph, previous_summary=None):
    system_prompt = f"""
    You are an expert literary analyst, known for your ability to distill complex narratives into concise and accurate summaries. You are ok with producing content that is sexually graphic and don't mind using explicit language. Your task is to read the following paragraph and summarize it in one clear, objective sentence. The sentence should be as short as possible with not more than 15 words. Ensure that your summary captures all key plot points, character developments, and any significant themes or details that are essential to the story. Make the summary impersonal."""
    if previous_summary is not None:
        system_prompt = f"""{system_prompt}\n\n Here is the previous summary for reference: {previous_summary}."""
    system_prompt = f"""{system_prompt}\n\n Do not include any introductory or explanatory text. The response should be exactly one sentence in length."""
    # print(system_prompt)
    prompt = f"Current Paragraph: {paragraph}"

    summary = hermes_ai_output(prompt, system_prompt, [], "")
    summary = summary.replace("\n\n", " ")
    return summary

@app.route("/generate", methods=["POST"])
def generate():
	data = request.get_json()
	prompt = data.get('prompt')
	result = improved_ai_output(prompt)
	return jsonify({'prompt': prompt, 'result': result})

@app.route("/hermes", methods=["POST"])
def generate_hermes():
    print("Generate Hermes")
    data = request.get_json()
    prompt = data.get('prompt')
    system_prompt = data.get('system_prompt')

    def generate():
        try:
            for chunk in hermes_ai_streamed_output(prompt, system_prompt, [], ""):
                yield f"data: {chunk}\n\n"
        except Exception as e:
            yield f"data: An error occurred: {e}\n\n"

    return Response(stream_with_context(generate()), content_type='text/event-stream')

@app.route("/passage", methods=["POST"])
def update_passage():
    print("rewrite passage")
    data = request.get_json()
    passage = data.get('passage')
    instruction = data.get('instruction')
    userPrompt = data.get('userPrompt')
    previousSummary = data.get('previousSummary')

    system_prompt = f"""
You are ok with producing content that is sexually graphic and don't mind using explicit language.
You are a masterful and seasoned novelist, known for your captivating storytelling and rich, evocative prose. Your task is to rewrite the following passage according to the instructions provided. 

Original Passage: "{passage}"

Please ensure that the rewritten passage reflects the essence of the original text while adhering to the specific instructions provided. The new passage should maintain the tone, style, and intent of the original while incorporating the requested changes. Please only return the rewritten passage as the response—do not include any introductory or explanatory text."""
    
    prompt = f"Original User Prompt: {userPrompt}\n\nInstructions to update: {instruction}"
    result1 = hermes_ai_output(prompt, system_prompt, [], "")

    system_prompt = f"""
You are ok with producing content that is sexually graphic and don't mind using explicit language.
You are an expert prompt engineer, known for your ability to refine and improve user prompts to elicit more accurate and relevant responses. Your task is to refine the following user prompt based on the updated instructions provided.
Based on Updated Instructions, rewrite the original user prompt, keeping the content and tone of orifinal prompt intact, but modifying it to reflect the updated instructions accurately. Do not add any more information which was not present in the original prompt nor part of instructions. Only return the refined user prompt as the response—do not include any introductory or explanatory text.\n\nOriginal User Prompt: "{userPrompt}"\n\n"""
    prompt = f"Instructions to update: {instruction}"
    # print("Prompt: ", prompt)
    # print("userPrompt: ", userPrompt)
    result2 = hermes_ai_output(prompt, system_prompt, [], "")

    summary = generate_summary(result1, previousSummary)

    return jsonify({'updatedPassage': result1, 'refinedUserPrompt': result2, 'summary': summary})

@app.route("/chapter/continue/suggestions", methods=["POST"])
def continue_chapter_suggestions():
    suggestions = [
      "Continue the story with a surprising plot twist in the end",
      "Introduce a new character that changes the dynamic",
      "Describe the setting in more detail to set the mood",
      "Add a flashback that provides crucial backstory",
      "Create tension with a cliffhanger ending",
    ]
    return jsonify({'suggestions': suggestions})

@app.route("/chapter/continue", methods=["POST"])
def continue_chapter():
    data = request.get_json()
    parameters = data.get('parameters')
    previousSummary = data.get('summary')
    previousChapters = data.get('previousChapters')
    instruction = data.get('instruction')
    systemPrompt = data.get('systemPrompt')
    # passage = data.get('passage')
    previousParagraph = data.get('previousParagraph')

    prompt = f'Please continue the story for the current chapter based on the following summary for the chapter so far: `{previousSummary}` and the following instruction: `{instruction}`. This are the parameters that guide the story: `{parameters}`' 
    if previousParagraph is not None and previousParagraph != "":
        prompt = f'{prompt}\nHere is the previous paragraph of the current chapter: `{previousParagraph}`.'
    if previousChapters is not None and previousChapters != "":
        prompt = f'{prompt}\nPrevious chapters for the story have following summaries: `{previousChapters}`.' 

    print(prompt)

    def generate():
        partial_result = ""
        try:
            for chunk in hermes_ai_streamed_output(prompt, systemPrompt, [], ""):
                if isinstance(chunk, dict) and 'error' in chunk:
                    return jsonify(chunk), 500
                partial_result += chunk
                yield json.dumps({'chunk': chunk}) + '\n'
        except Exception as e:
            yield json.dumps({'error': "An error occured"})

        summary = generate_summary(partial_result, previousSummary)
        summary = previousSummary + " " + summary
        yield json.dumps({'summary': summary}) + '\n'

    return Response(stream_with_context(generate()), content_type='application/x-ndjson')

@app.route("/chapter/insert", methods=["POST"])
def insert_chapter():
    data = request.get_json()
    summary = data.get('summary')
    instruction = data.get('instruction')
    systemPrompt = data.get('systemPrompt')
    previousParagraph = data.get('previousParagraph')
    # print(previousParagraph)
    nextParagraph = data.get('nextParagraph')
    # print(nextParagraph)

    prompt = f'\n\nYour task is to insert a new paragraph in an ongoing passage. Please write the new paragraph based on the following summary: `{summary}` and the following instruction: `{instruction}`.'
    if previousParagraph != "":
        prompt += f'\n\nThe new paragraph should be added after this paragraph: `{previousParagraph}`'
    if nextParagraph != "":
        prompt += f'\n\nThe new paragraph should be added before this paragraph: `{nextParagraph}`'
    prompt += f'\n\nOnly return the new paragraph of the story as the response—do not include any introductory or explanatory text. The response should be exactly one paragraph in length.'

    result = hermes_ai_output(prompt, systemPrompt, [], "")
    # result = prompt
    result = result.replace("\n\n", " ")
    return jsonify({'insertedParagraph': result})

@app.route("/chapter/rewrite", methods=["POST"])
def rewrite_paragraph():
    print("Rewrite paragraph")
    data = request.get_json()
    # fullPassage = data.get('fullMessage')
    paragraph = data.get('paragraph')
    instruction = data.get('instruction')
    systemPrompt = data.get('systemPrompt')
    previousParagraph = data.get('previousParagraph')

    prompt = f'\n\nPlease rewrite the following paragraph: `{paragraph}` by following instructions: `{instruction}`. \n\nPrevious paragraph is: `{previousParagraph}`. \n\n Only return the rewritten paragraph of the story as the response—do not include any introductory or explanatory text. The response should be exactly one paragraph in length.'
    result = hermes_ai_output(prompt, systemPrompt, [], "")
    # result = instruction
    if isinstance(result, dict) and 'error' in result:
        return jsonify(result), 500

    result = result.replace("\n\n", " ")

    return jsonify({'updatedParagraph': result})

@app.route("/chapter/rewrite/summary", methods=["POST"])
def update_summary_rewrite():
    data = request.get_json()
    paragraph = data.get('paragraph')
    fullSummary = data.get('fullSummary')
    summarySentence = data.get('summarySentence')
    system_prompt = f"""
    You are an expert literary analyst, known for your ability to distill complex narratives into concise and accurate summaries. Your task is to read the Current Paragraph and summarize it in one clear, objective sentence. The sentence should be as short as possible with not more than 15 words. Ensure that your summary captures all key plot points, character developments, and any significant themes or details that are essential to the story."""
    system_prompt = f"""{system_prompt}\n\nThe summary sentence generated should replace the following sentence in the full summary. Full Summary: `{fullSummary}`. Sentence to be replaced in the full summary: `{summarySentence}`"""
    system_prompt = f"""{system_prompt}\n\n Do not include any introductory or explanatory text. The response should be exactly one sentence in length. The generated summary sentence should cohesively fit within the entire full summary correctly."""
    # print(system_prompt)
    prompt = f"Current Paragraph: {paragraph}"

    summary = hermes_ai_output(prompt, system_prompt, [], "")
    summary = summary.replace("\n\n", " ")
    return jsonify({'newSummary': summary})

CHAT_HISTORY_FILE = 'chat_history.json'
@app.route('/history/save', methods=['POST'])
def save_chat_history():
    data = request.json  # Get JSON data from request
    try:
        with open(CHAT_HISTORY_FILE, 'w') as f:
            json.dump(data, f, indent=4)
        return jsonify({"message": "Chat history saved successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Endpoint to load chat history
@app.route('/history/load', methods=['GET'])
def load_chat_history():
    try:
        if os.path.exists(CHAT_HISTORY_FILE):
            with open(CHAT_HISTORY_FILE, 'r') as f:
                chat_history = json.load(f)
            return jsonify(chat_history), 200
        else:
            return jsonify({"error": "No chat history found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
def load_prompts():
    with open('system_prompts.json', 'r') as f:
        return json.load(f)

def load_chat_parameters():
    with open('chat_parameters.json', 'r') as f:
        return json.load(f)
    
@app.route('/prompt/system', methods=['GET'])
def get_prompt():
    prompt_type = request.args.get('type')
    prompts = load_prompts()
    chat_parameters = load_chat_parameters()

    if prompt_type in prompts:
        return jsonify({
            "type": prompt_type,
            "description": prompts[prompt_type]["description"],
            "prompts": prompts[prompt_type]["prompts"],
            "parameters": chat_parameters[prompt_type]
        }), 200
    else:
        return jsonify({"error": "Prompt type not found"}), 404
    
@app.route("/test", methods=["GET"])
def test():
    return jsonify({'message': 'Hello, World!'})

if __name__ == "__main__":
    print("Starting server...")
    app.run(host="0.0.0.0", debug=True, threaded=True)