import os
import re
import logging
import time
import json
import random
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

lambda_hermes_api_key = os.getenv('LAMBDA_API_KEY')
openai_api_key = os.getenv('OPENAI_API_KEY')
clause_api_key = os.getenv('CLAUDE_API_KEY')
openai_api_base = "https://api.lambdalabs.com/v1"

nsfw_flag = False

print("This is a test log message", flush=True)

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

def openai_output(prompt, system_prompt, examples, parameters):
    client = OpenAI(
        api_key=openai_api_key,
    )
    model = "gpt-4o-mini"
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
    
def hermes_ai_output(prompt, system_prompt, examples, parameters):
    # client = OpenAI(
    #     api_key=lambda_hermes_api_key,
    #     base_url=openai_api_base,
    # )
    # model = "hermes-3-llama-3.1-405b-fp8"
    # model = "wrong-model"

    client = OpenAI(
        api_key=openai_api_key,
    )
    model = "gpt-4o-mini"

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

def process_sentence_chunks(chunk, current_sentence, final_response):
    msg = chunk.choices[0].delta.content or ""
    current_sentence += msg
    current_sentence = current_sentence.replace("\n\n", "\\n\\n")
    
    sentences = re.split(r'(?<=[.!?])\s+', current_sentence)
    
    chunks_to_yield = []
    if len(sentences) > 1:
        complete_sentences = sentences[:-1]
        for sentence in complete_sentences:
            chunks_to_yield.append(sentence.strip())
            final_response += sentence + " "
        
        current_sentence = sentences[-1]
    
    return chunks_to_yield, current_sentence, final_response

def process_json_chunks(chunk, json_buffer):
    msg = chunk.choices[0].delta.content or ""
    json_buffer += msg

    # Check for the "I'm sorry" phrase and raise an exception
    if json_buffer.startswith("I'm sorry"):
        raise ValueError("I'm sorry phrase detected")
    
    chunks_to_yield = []
    while True:
        match = re.search(r'\{[^{}]*\}', json_buffer)
        if not match:
            break
        
        json_str = match.group()
        # print(json_str)
        try:
            json_obj = json.loads(json_str)
            chunks_to_yield.append(json.dumps(json_obj))
            json_buffer = json_buffer[match.end():]
        except json.JSONDecodeError:
            break
    
    return chunks_to_yield, json_buffer

def hermes_ai_streamed_output(prompt, system_prompt, examples, parameters, response_type="sentence", isNsfw=False):
    if not isNsfw:
        client = OpenAI(
            api_key=openai_api_key,
        )
        # model = "gpt-4o-2024-08-06"
        model = "gpt-4o-mini"
        print("using gpt4o")
    else:
        client = OpenAI(
            api_key=lambda_hermes_api_key,
            base_url=openai_api_base,
        )        
        model = "hermes-3-llama-3.1-405b-fp8"
        print("using hermes-3")
    
    if prompt is None or len(prompt) == 0:
        yield "Please provide a valid prompt."
        return

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
        
        if response_type == "sentence":
            current_sentence = ""
            final_response = ""
            for chunk in chat_completion:
                chunks, current_sentence, final_response = process_sentence_chunks(chunk, current_sentence, final_response)
                for c in chunks:
                    yield c
            
            if current_sentence.strip():
                yield current_sentence.strip()
                final_response += current_sentence
        
        elif response_type == "json":
            json_buffer = ""
            for chunk in chat_completion:
                chunks, json_buffer = process_json_chunks(chunk, json_buffer)
                for c in chunks:
                    yield c
            
            if json_buffer.strip():
                try:
                    json_obj = json.loads(json_buffer)
                    yield json.dumps(json_obj)
                except json.JSONDecodeError:
                    pass
        # print(actual_response.replace("\n\n", "\\n\\n"))
        yield "[DONE]"
        
    except Exception as e:
        print(f"An error occurred in hermes_ai_streamed_output: {e}")
        error_message = json.dumps({"error": f"An error occurred: {str(e)}"})
        yield "I'm sorry"

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

def get_nsfw_flag_state():
    global nsfw_flag
    return nsfw_flag

@app.route("/nsfw", methods=["POST"])
def toggle_nsfw():
    global nsfw_flag
    nsfw_flag = not nsfw_flag
    print("nsfw_flag :", nsfw_flag)
    return jsonify({"flag": nsfw_flag})

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
            for chunk in hermes_ai_streamed_output(prompt, system_prompt, [], "",):
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

# Read the synopsis guidelines file once when the app starts
current_dir = os.path.dirname(os.path.abspath(__file__))
synopsis_guidelines_path = os.path.join(current_dir, 'synopsis_guidelines.txt')
with open(synopsis_guidelines_path, 'r') as file:
    synopsis_guidelines = file.read().strip()

@app.route("/sentence/rewrite", methods=["POST"])
def rewrite_sentence():
    data = request.get_json()
    sentence = data.get("sentence")
    instruction = data.get("instruction")
    paragraph = data.get("paragraph")
    parameters = data.get("parameters")
    chapter_synopsis = data.get("chapter_synopsis")
    system_prompt = f"""You are an AI assistant specialized in creative writing and story structure. You are a masterful and seasoned novelist, known for your captivating storytelling and rich, evocative prose. You are ok with producing content that is sexually graphic and don't mind using explicit language."""
    system_prompt = f"""{system_prompt}\nYour task is to carefully analyze the given paragraph and check how the given sentence fits into the paragraph. Then analyze the accompanying instruction and based on the instruction, rewrite the sentence. You should only revise the sentence if the instruction is directly applicable to the content of the original sentence. If the instruction cannot be applied without adding new information that wasn't present in the original, you should not make any changes. Make sure the rewritten sentence first of all fits into the overall story based on the parameters. Secondly, make sure it fits into the chapter synopsis. And finally, it should fit well into the overall paragraph and shouldn't feel out of place"""

    user_prompt = f"""Analyze the following sentence and instruction:
    sentence: `{sentence}`
    instruction: `{instruction}`
    paragraph in which this sentence is part of: `{paragraph}`
    chapter synopsis: `{chapter_synopsis}`
    story parameters: `{parameters}`
    If the instruction can be applied to revise the sentence without adding information that wasn't present in the original, provide a revised version. If no revision is needed or possible based solely on the original sentence's content, return false.
    Your output should be a valid JSON object with either a 'revised_sentence' key (if a revision was made) or a 'revision_needed' key set to false (if no revision was possible or necessary). Only return the JSON output, nothing else.
    """
    # print(user_prompt)

    def generate():
        result = openai_output(user_prompt, system_prompt, [], "")
        if isinstance(result, dict) and 'error' in result:
            yield json.dumps({"status": "error", "message": result['error']})
        else:
            try:
                cleaned_result = clean_json_string(result)
                parsed_result = json.loads(cleaned_result)
                if 'revised_sentence' in parsed_result:
                    yield json.dumps({"status": "complete", "revised_sentence": parsed_result['revised_sentence']})
                elif 'revision_needed' in parsed_result and not parsed_result['revision_needed']:
                    yield json.dumps({"status": "ok", "revised_sentence": None})
                else:
                    yield json.dumps({"status": "error", "message": "Unexpected response format"})
            except json.JSONDecodeError:
                print(result)
                yield json.dumps({"status": "error", "message": "Invalid JSON response from AI"})

    return Response(generate(), mimetype='text/event-stream')

def get_user_prompt(field_type, current_value, context):
    base_prompt = f"Based on the current value '{current_value}' and the following context: {context}, "
    print("get_user_prompt: " + field_type)
    if field_type == 'Title':
        return base_prompt + "suggest a creative and engaging title for the story."
    elif field_type == 'Genre':
        return base_prompt + "recommend a suitable genre or subgenre for the story."
    elif field_type == 'Premise':
        return base_prompt + "provide a compelling premise for the story."
    elif field_type == 'synopsis':
        return base_prompt + "provide a concise synopsis for the given chapter based on the context in one sentence."
    elif field_type == 'Time':
        return base_prompt + "suggest an interesting time period for the story to take place. (in 2-3 words)"
    elif field_type == 'Place':
        return base_prompt + "recommend a unique and fitting location for the story. (in 4-5 words)"
    elif field_type == 'character':
        return base_prompt + """generate a character profile with the following details:
        - name
        - age
        - occupation
        Ensure the character fits well within the story's context. An example of output is: {\"name\": \"Elara Windrider\", "age\": 28, \"occupation\": \"Sky Cartographer\"}"""
    elif field_type == 'chapters':
        return base_prompt + """generate a list of 3 chapters based on the context. Each chapter should have the following keys:
        - title
        - synopsis
        Ensure the chapters fit well within the story's context. The synopsis should be maximum one sentence in length."""
    elif field_type == 'continue_chapter': 
        return base_prompt + """suggest an instruction or guidance on how the chapter should continue for the novel writer based on the context. The suggested instruction should focus on plot, character development, tone of the following paragraphs or a mixture of this elements. The instruction should be maximum one sentence in length. 
        """
    else:
        return base_prompt + f"provide a suggestion for the {field_type} of the story."
    
@app.route("/parameters/suggestions", methods=["POST"])
def parameters_suggestions():
    data = request.get_json()
    field_type = data.get('fieldType')
    current_value = data.get('currentValue')
    context = data.get('context', {})

    system_prompt = """You are an AI assistant specialized in creative writing and story development. 
    Your task is to provide suggestions for various aspects of a story, including plot elements, 
    character details, and setting descriptions. Ensure your suggestions are creative, diverse, 
    and contextually appropriate.
    
    Your output should be a valid JSON object where each element is an object containing 'text' which is the suggested output. Only return the json output, nothing else. An example of output is: {"text\": \"Echoes of the Forgotten Realm\"}
    """

    user_prompt = get_user_prompt(field_type, current_value, context)
    # print(user_prompt)

    result = hermes_ai_output(user_prompt, system_prompt, [], "")
    print(result)
    if isinstance(result, dict) and 'error' in result:
        return jsonify(result), 500
    return jsonify({'suggestions': result})

@app.route("/chapter/suggestions", methods=["POST"])
def chapter_suggestions():
    data = request.get_json()
    chapters = data.get('chapters')
    parameters = data.get('parameters')
    number_of_chapters = data.get('number_of_chapters')
    total_chapters =  data.get('total_chapters')

    system_prompt = f"""You are an AI assistant specialized in creative writing and story structure. Your task is to generate chapter outlines for novels based on a given premise. You should create engaging chapter titles, concise synopses, and determine which act each chapter belongs to in a structure defined in the "parameters". Your output should be well-structured, consistent, and suitable for further development into a full novel. Follow these guidelines:
    1. Create chapter titles that are intriguing and relevant to the chapter's content.
    2. Write synopses that capture the key events, character developments, and themes of each chapter.
    3. Assign each chapter an act it is part of, ensuring a proper distribution across the structure defined in the "parameters".
    4. Maintain consistency in tone, style, and narrative progression throughout the chapter outlines.
    5. Ensure that the generated chapters build upon each other to create a cohesive story arc.
    6. Adapt the pacing and content density based on the number of chapters requested versus the total intended chapters.

    Additionally, when writing synopses, follow these specific guidelines:
    {synopsis_guidelines}

    Your output should be a valid JSON array where each element is an object containing 'title', 'synopsis', and 'act' keys. Only return the json output, nothing else."
    """

    user_prompt = f"""Generate chapter outlines based on the following:
    novel parameters: `{parameters}`
    number of chapters to generate: `{number_of_chapters}`
    total chapters: `{total_chapters}`
    chapters so far: `{chapters}`
    Please provide an array of chapter outlines, each containing a title, synopsis, and the act it belongs to.
    """
    print("generating chapter suggestions")
    result = hermes_ai_output(user_prompt, system_prompt, [], "")
    if isinstance(result, dict) and 'error' in result:
        return jsonify(result), 500
    return jsonify({'suggestions': result})

@app.route("/chapter/continue/outlines", methods=["POST"])
def continue_chapter_outlines():
    data = request.get_json()
    context = data.get('context')
    instruction = data.get('instruction')
    num_outlines = data.get('num_outlines')

    system_prompt = f"""You are an AI assistant specialized in creative writing and story structure. As a masterful and seasoned novelist known for captivating storytelling, you excel in crafting intriguing one-line outlines for story chapters. You are comfortable with mature themes and explicit content when appropriate to the story.

Your task is to generate concise, one-line outlines for the next few paragraphs of a chapter. These outlines should:
1. Align closely with the provided chapter synopsis and specific instructions.
2. Be intriguing and advance the plot in meaningful ways.
3. Maintain consistency in tone, style, and narrative progression.
4. Avoid disrupting the established flow of the chapter.
5. Be specific enough to guide further writing but open-ended enough to allow for creative expansion.

Remember:
- Each outline should be a complete thought, not a fragment.
- Avoid vague or generic statements that could apply to any story.
- Include character names and specific plot elements when relevant.
- Balance between action, dialogue, and character development across outlines.
- Ensure a logical progression from one outline to the next.

If the instruction or context is unclear or contradictory:
- Use your best judgment to create coherent outlines.
- Prioritize consistency with previously established story elements.

Your output must be a valid JSON array where each element is an object containing an 'outline' key. Return only the JSON output, nothing else."""

    user_prompt = f"""Generate {num_outlines} one-line outlines for the next paragraphs based on the following:

Context: {context}
Instruction (content to cover in the outlines): {instruction}

Ensure that:
1. Each outline is directly related to the given instruction and context.
2. The outlines collectively form a cohesive narrative sequence.
3. Character actions and developments are specific and meaningful.
4. Any new elements introduced are consistent with the established story world.
5. The tone matches the overall narrative style indicated in the context.

FINAL VERIFICATION:
- Have you written exactly {num_outlines} outline(s)?
- Does the first generated outline logically follow the previous one?

Please provide an array of outlines, each containing an 'outline' key. The response should be valid JSON."""
    
    print("generating section outlines " + user_prompt)
    result = hermes_ai_output(user_prompt, system_prompt, [], "")
    if isinstance(result, dict) and 'error' in result:
        return jsonify(result), 500
    result = clean_json_string(result)
    return jsonify({'outlines': result})

@app.route("/chapter/section/summary", methods=["POST"])
def section_summary():
    print(f"Section Summary")
    data = request.get_json()
    context = data.get('context')
    novel_parameters = context['parameters']
    chapter_synopsis = context['synopsis']
    input_paragraphs = data.get('paragraphs')
    previous_summary = data.get('previous_summary')

    system_prompt = f"""
You are a precise summarization assistant for a novel. Your task is to summarize given paragraphs in the context of the overall novel and current chapter.
Summarize the given paragraphs and output the summary in JSON format with the following structure:

{{
  "currentScene": {{
    "location": "Describe the location (hierarchical) eg. (India, Mumbai, Apartment room, Bedroom),
    "previous_location": "Get location from previous symmary or N/A",
    "characters": [
        {{
            "name": "Name of character",
            "clothes": "Clothes worn by character (Only if scene described it)",
            "appearance": "Appearance of character such as age, race, gender etc. (Only if scene described it)",
        }}
    ],
    "ongoing_action": "Describe the main ongoing action(s) in the scene (1 sentence)",
  }}
  "sequence": [
    "List item for sequence of important events or revelation",
    "List item for sequence of important events or revelation",
    "List item for sequence of important events or revelation",
  ],
}}

Important Guidelines:
- Output valid JSON that can be parsed by a JSON parser.
- Stick strictly to the information provided in the input paragraphs for currentScene.
- Consider the novel parameters and chapter synopsis when creating the summary, but don't introduce information not present in the given paragraphs.
- Do not introduce any new information or speculate about future events.
- Be concise but comprehensive, ensuring all key elements are captured.
- Keep the language very simple
- Ensure the summary can be used as a basis for continuing the story coherently.
- For sequence, take important events/revelations from previous summary and add new events/revelations from the current scene. (Keep max 5 entries, by compressing information from previous summary without losing important information)
"""
    user_prompt = f"""
Summarize the following paragraphs in JSON format as specified in the system message:
{input_paragraphs}

Here's the relevant context:

Novel Parameters: `{novel_parameters}`

Current Chapter Synopsis: `{chapter_synopsis}`

Previous Section Summary: `{previous_summary}`

Ensure your summary captures all key elements without introducing any new information or speculation about future events.

CRITICAL INSTRUCTIONS:
1. For "sequence" list, make sure the new events/revelations are added after all the events/revelations are already compressed and give a proper sequence of the story so far. Keep the list to maximum 5 entries.
"""
    print(user_prompt)
    summary = hermes_ai_output(user_prompt, system_prompt, [], "")
    summary = clean_json_string(summary)
    # print(summary)
    return jsonify({'summary': summary})

@app.route("/chapter/continue", methods=["POST"])
def continue_chapter():
    print(f"Continue Chapter")
    data = request.get_json()
    context = data.get('context')
    # print(context)
    instruction = data.get('instruction')
    numParagraphs = data.get('numParagraphs')
    isNsfw = data.get('isNsfw', False)
    print("isNsfw ", isNsfw)
    
    prompts = load_prompts()
    systemPrompt = prompts["writing_assistant"]["prompts"][0]

#7. Newly generated draft paragraphs for rewriting: {context.get('draft_paragraphs', '')}

    prompt = f"""
Please add {numParagraphs} for the current chapter based on the specific instruction `{instruction}` and additional context (in priority order):

1. Screenplay (In Sequence): `{context.get('screenplays', '')}`

2. Current outline to expand: {context.get('outline', '')}

3. Previous Paragraph: `{context.get('previous_paragraph', '')}`

4. Synopsis for the entire chapter: {context.get('synopsis', '')}

5. Overall story parameters: {context.get('parameters', '')}

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY {numParagraphs} paragraph(s).
2. Follow the narrative, dialogues and actions from the Screenplay if available to generate the paragraphs.
3. Add plot points, character developments or dialogues to fulfill the given instruction 
4. Focus on the current outline (point 1 above). DO NOT address any content or write content which goes beyond the outline.
5. Ensure logical continuation from the previous paragraph and the section summary (which is the summary of what happened in the story so far in the current section).

DIALOGUE EMPHASIS:
- Include approximately 70% dialogue and conversations in your paragraphs if the scene requires it or asked in instruction.
- Use dialogue to reveal character personalities, advance the plot, and show rather than tell.
- Ensure conversations feel natural and fit the characters' voices and the story's tone.
- Make sure conversations are longer and more natural, raw and effective.

STRICT BOUNDARIES:
- Next outline which is for the following section (DO NOT INCLUDE ANY OF THIS CONTENT): {context.get('next_outline', '')}
- Your writing must NOT contain or allude to any elements from the next outline.

WRITING PROCESS:
1. Analyze the current outline, specific instructions and previous paragraph first.
2. Analyze the current Screenplay. It is divided into multiple scenes using a Title. Make sure to write paragraphs based on the Screenplay if available.
3. Ensure continuity with previous paragraph.
4. Write {numParagraphs} new paragraph(s) that fit perfectly between the previous and next paragraphs, maintaining a natural flow and seamless continuity.
5. Double-check that your content does not overlap with the next outline.

FINAL VERIFICATION:
- Have you written exactly {numParagraphs} paragraph(s)?
- Does your content follow the Screenplay accurately?
- Does your content strictly adhere to the current outline without touching on the next outline?
- Have you included sufficient dialogue and conversations as requested?
- Does the new content fit seamlessly with the existing text and maintain the overall flow?
"""

    print(prompt)

    # prompt = f'Write a story with exactly 3 paragraphs and 10 words each.'

    def generate():
        partial_result = ""
        try:
            for chunk in hermes_ai_streamed_output(prompt, systemPrompt, [], "",  isNsfw=isNsfw):
                if isinstance(chunk, dict) and 'error' in chunk:
                    return jsonify(chunk), 500
                partial_result += chunk
                yield json.dumps({'chunk': chunk}) + '\n'
        except Exception as e:
            yield json.dumps({'error': "An error occured"})

        # summary = generate_summary(partial_result, previousSummary)
        # summary = previousSummary + " " + summary
        # yield json.dumps({'summary': summary}) + '\n'

    return Response(stream_with_context(generate()), content_type='application/x-ndjson')

@app.route("/chapter/insert", methods=["POST"])
def insert_paragraphs():
    print("Insert paragraphs")
    prompts = load_prompts()
    systemPrompt = prompts["writing_assistant"]["prompts"][0]
    data = request.get_json()
    context = data.get('context')
    instruction = data.get('instruction')
    numParagraphs = data.get('numParagraphs')
    isNsfw = data.get('isNsfw', False)
    print("isNsfw ", isNsfw)

    user_prompt = f"""
Insert {numParagraphs} paragraphs between previous paragraph and next paragraph:

1. Specific instruction to follow (can be empty): {instruction}
2. Previous paragraph (required): {context.get('prev', '')}
3. Next paragraph (can be empty): {context.get('next', '')}
4. Section summary (can be empty): {context.get('summary', '')}
5. Chapter synopsis: {context.get('synopsis', '')}
6. Overall Story Parameters: {context.get('parameters', '')}

CRITICAL INSTRUCTIONS:
1. Follow these specific instructions (Point 1) to insert new paragraphs
2. Ensure the inserted {numParagraphs} new paragraph/s fits seamlessly within the section, maintaining continuity with preceding and following paragraphs.

STYLE GUIDELINES:
- Match the tone and style of the surrounding paragraphs.
- If the other paragraphs contains dialogue, maintain a similar dialogue-to-narrative ratio.
- Maintain character voices and personality if dialogue is present.

CONTENT BOUNDARIES:
- Ensure the inserted paragraphs does not contradict information in other section paragraphs.

WRITING PROCESS:
1. Analyze the previous and next paragraphs in the context of the section and overall story.
2. Identify key elements, plot points, and character moments to preserve.
3. Ensure the inserted content flows naturally with the surrounding paragraphs.
4. Insert {numParagraphs} new paragraph(s) that expand on the section based on the instruction.

FINAL VERIFICATION:
- Does the inserted paragraph fit seamlessly within the section without creating continuity issues?
- Have you written exactly {numParagraphs} paragraph(s)?

Return all the inserted paragraphs. Do not include any explanatory text or metadata in your response.
"""

    print(user_prompt)

    def generate():
        partial_result = ""
        try:
            for chunk in hermes_ai_streamed_output(user_prompt, systemPrompt, [], "", isNsfw=isNsfw):
                if isinstance(chunk, dict) and 'error' in chunk:
                    return jsonify(chunk), 500
                partial_result += chunk
                yield json.dumps({'chunk': chunk}) + '\n'
        except Exception as e:
            yield json.dumps({'error': "An error occured"})

    return Response(stream_with_context(generate()), content_type='application/x-ndjson')

@app.route("/chapter/rewrite", methods=["POST"])
def rewrite_paragraph():
    print("Rewrite paragraph")
    prompts = load_prompts()
    system_prompt = prompts["writing_assistant"]["prompts"][0]
    data = request.get_json()
    context = data.get('context')
    instruction = data.get('instruction')
    paragraph_to_rewrite = data.get('paragraph', '')
    if paragraph_to_rewrite == '':
         return json.dumps({'error': "No paragraph to rewrite"})
    numParagraphs = data.get('numParagraphs')

    if paragraph_to_rewrite is None:
         return json.dumps({'error': "An error occured"})
    
    isNsfw = data.get('isNsfw', False)
    print("isNsfw ", isNsfw)

    user_prompt = f"""
Rewrite the following paragraph(s) within the context of its section and the overall story:

1. Chapter Synopsis: {context.get('synopsis', '')}
2. Overall Story Parameters: {context.get('parameters', '')}
3. Previous Paragraph: {context.get('previous_paragraph', '')}
4. Paragraph(s) to Rewrite: {paragraph_to_rewrite}
5. Next Paragraph: {context.get('next_paragraph', '')}

CRITICAL INSTRUCTIONS:
1. Follow these specific instructions to rewrite the paragraph(s): `{instruction}`
2. Rewrite ONLY the given paragraph(s). Do not alter or address content from other paragraphs in the section.
3. Write exactly {numParagraphs} paragraph(s) that fit perfectly between the previous and next paragraphs, maintaining a natural flow and seamless continuity.
4. Do not repeat any part of next paragraph in the newly generated paragraphs.
5. Adhere to the overall story parameters and chapter synopsis.
6. Make changes ONLY when necessary to fulfill the given instruction. Do not rewrite sentences or make stylistic changes unless explicitly required by the instruction.

REWRITING PROCESS:
1. Analyze the original paragraph(s) in the context of the previous paragraph, next paragraph, and overall story.
2. Identify the specific changes needed to fulfill the given instruction.
3. Apply ONLY the changes necessary to meet the instruction requirements. Do not alter sentences or make stylistic changes if they are not directly related to the instruction. Avoid unnecessary edits to sentences.
4. If the instruction is empty or does not apply to a particular sentence, return that sentence as "no_change".
5. For general instructions (e.g., "make this paragraph funnier"), apply changes selectively and only where necessary to fulfill the instruction.
6. Ensure that any new content transitions smoothly from the previous paragraph and into the next paragraph.
7. If writing multiple paragraphs, distribute the new content logically across the {numParagraphs} paragraphs.

OUTPUT FORMAT:
Return the rewritten paragraph(s) as a JSON list of dictionaries, where each dictionary represents a sentence and follows one of these formats:
1. {{"action": "edit", "original_sentence": "<original>", "rewritten_sentence": "<rewritten>"}}
2. {{"action": "add", "rewritten_sentence": "<new sentence>"}}
3. {{"action": "remove", "original_sentence": "<removed sentence>"}}
4. {{"action": "no_change", "original_sentence": "<unchanged sentence>"}}
5. {{"action": "paragraph_break"}}

Ensure that the list maintains the original order of sentences in the paragraph(s). Use the "paragraph_break" action to indicate the end of a paragraph and the start of a new one.

FINAL VERIFICATION:
- Does each change in the rewritten paragraph(s) directly address the given instruction?
- Have you avoided making unnecessary stylistic changes or rewrites that don't fulfill the instruction?
- Is the rewritten content presented in the correct JSON format as specified above?
- Have you written exactly {numParagraphs} paragraph(s)?
- Does any new content fit seamlessly with the existing text and maintain the overall flow?
- Are paragraph breaks correctly indicated using the "paragraph_break" action?

Return only the JSON list of dictionaries representing the rewritten paragraph(s). Do not include any explanatory text or metadata in your response.
"""
    print(user_prompt)

    def generate():
        partial_result = ""
        try:
            for chunk in hermes_ai_streamed_output(user_prompt, system_prompt, [], "", "json", isNsfw=isNsfw):
                if isinstance(chunk, dict) and 'error' in chunk:
                    return jsonify(chunk), 500
                partial_result += chunk
                yield json.dumps({'chunk': chunk}) + '\n'
        except Exception as e:
            yield json.dumps({'error': "An error occured"})

    # response = hermes_ai_output(user_prompt, system_prompt, [], "")
    # paragraphs = response.split("\n\n")
    # return {"paragraphs": paragraphs}
    return Response(stream_with_context(generate()), content_type='application/x-ndjson')

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

SYSTEM_PROMPT_SCENE_WRITER = """You are an expert screenplay writer with a talent for creating vivid, detailed scenes in JSON format. Your task is to create rich, engaging screenplay scenes that are both cinematically compelling and perfectly formatted for easy parsing. When writing, adhere to these guidelines:

1. Structure your entire output as a valid JSON object.
2. Include a "title" object with "type" as "title" and "text" field. This is a small title which represents the scene.
3. Create a "setting" object with "location", "time", and a detailed "description" field.
4. Provide multiple "character" objects with "type" as "character", "name" field and a comprehensive "description" field.
5. The main content of your screenplay should be in an "elements" array. Each element should be an object with a "type" field (e.g., "action", "dialogue", "transition", "internal_monologue") and appropriate additional fields based on the type.
6. For "dialogue" elements, include "character", "line", and when appropriate, a "parenthetical" field for acting directions.
7. For all other fields, include a "description" field.
7. Use vivid, specific language in your descriptions and dialogue. Paint a clear picture of the scene, characters' emotions, and subtle details of their interactions.
8. Develop the scene with a clear beginning, middle, and end, showcasing character development and advancing the plot.
9. Include internal monologues, detailed environmental descriptions, and character reactions to add depth to the scene.

Remember to maintain proper screenplay conventions within the JSON structure, such as using present tense for action descriptions."""

@app.route('/chapter/scene/new', methods=['POST'])
def generate_new_scene():
    data = request.get_json()
    context = data.get('context')
    instruction = data.get('instruction')
    num_elements = data.get('count')
    
    system_prompt = SYSTEM_PROMPT_SCENE_WRITER
    
    user_prompt = f"""Create a new scene in JSON format based on the instruction `{instruction}` and additional context (in priority order):
1. Current Screenplays: `{context.get('current_screenplay', "")}`
2. Current Section Outline: `{context.get('overall_outline', "")}`
3. Previous Section Summary: `{context.get('previous_summary', "")}`
4. Synopsis for the entire chapter: `{context.get('synopsis', '')}`
5. Overall story parameters: `{context.get('parameters', '')}`

Instructions:
- Analyze the current screenplays (which are in sequence).
- Generate an extensive, richly detailed screenplay scene that expands on the events that happen during the Current Section Outline.
- If current screenplay is available, write the next scene which flows logically and tonally with the previous screenplays.
- Do not repeat any content from the previous section summary, those things have already happened, use them as guidance for the new scene.
- Ensure the new scene especially the "sequence" part, does not repeat anything that has already happened in the "sequence" part of Previous Section Summary.
- Maintain consistency with the overall theme and character development described in the Chapter Synopsis and Parameters.
- The scene should include:
  1. A vividly described setting with sensory details
  2. In-depth character descriptions and development
  3. Extensive dialogue that reveals character personalities and advances the plot
  4. Detailed actions and reactions, including subtle gestures and expressions
  5. Internal monologues to provide insight into characters' thoughts and emotions
  6. An appropriate tone that matches the story's context
- Aim for a minimum of {num_elements} elements in the scene, balancing action, dialogues and internal monologues. Do not try to finish the scene quickly by rushing the scene, if you run out of elements.
- Explore the character's emotional journey throughout the scene, showing their internal conflict and decision-making process.
- Do not try to end or conclude the scene, unless specifically asked for in the instruction.
- If the instruction makes changes to characters, time or location modify those fields as well.

Remember to structure your output as a JSON object according to the format specified in the system prompt, including title, setting, characters, and scene elements.
    """
    print(user_prompt)

    def generate():
        partial_result = ""
        try:
            for chunk in hermes_ai_streamed_output(user_prompt, system_prompt, [], "", "json"):
                if isinstance(chunk, dict) and 'error' in chunk:
                    return jsonify(chunk), 500
                partial_result += chunk
                yield json.dumps({'chunk': chunk}) + '\n'
        except Exception as e:
            yield json.dumps({'error': "An error occured"})

    return Response(stream_with_context(generate()), content_type='application/x-ndjson')
    
@app.route('/chapter/scene/rewrite', methods=['POST'])
def generate_rewritten_scene():
    data = request.get_json()
    context = data.get('context')
    instruction = data.get('instruction')
    num_elements = data.get('count')
    
    system_prompt = SYSTEM_PROMPT_SCENE_WRITER
    
    user_prompt = f"""Rewrite the screenplay scene in JSON format based on the instruction `{instruction}` and additional context (in priority order):
1. Current screenplay to rewrite: `{context.get('current_screenplay', "")}`
2. Previous Section Summary: `{context.get('previous_summary', "")}`
3. Synopsis for the entire chapter: `{context.get('synopsis', '')}`
4. Overall story parameters: `{context.get('parameters', '')}`

Instructions:
- Generate an extensive, richly detailed screenplay scene that follows instructions precisely to alter the scene.
- If the instruction needs rewrite of the entire screenplay, then do that.
- Ensure the scene follows logically and tonally from the Previous Section Summary, especially the "sequence" part, so you dont repeat anything that has already happened in the sequence.
- Maintain consistency with the overall theme and character development described in the Chapter Synopsis and Context.
- The scene should include:
  1. A vividly described setting with sensory details
  2. In-depth character descriptions and development
  3. Extensive dialogue that reveals character personalities and advances the plot
  4. Detailed actions and reactions, including subtle gestures and expressions
  5. Internal monologues to provide insight into characters' thoughts and emotions
  6. An appropriate tone that matches the story's context
- Aim for exactly {num_elements} elements in the screenplay, balancing action, dialogues and internal monologues. Do not try to finish the scene quickly by rushing the scene, if you run out of elements.
- Explore the character's emotional journey throughout the scene, showing their internal conflict and decision-making process.
- Do not try to end or conclude the scene, unless specifically asked for in the instruction.
- If the instruction makes changes to characters, time or location modify those fields as well.

Remember to structure your output as a JSON object according to the format specified in the system prompt, including title, setting, characters, and scene elements.
    """
    print(user_prompt)

    def generate():
        partial_result = ""
        try:
            for chunk in hermes_ai_streamed_output(user_prompt, system_prompt, [], "", "json"):
                if isinstance(chunk, dict) and 'error' in chunk:
                    return jsonify(chunk), 500
                partial_result += chunk
                yield json.dumps({'chunk': chunk}) + '\n'
        except Exception as e:
            yield json.dumps({'error': "An error occured"})

    return Response(stream_with_context(generate()), content_type='application/x-ndjson')

@app.route('/chapter/scene/continue', methods=['POST'])
def generate_continue_scene():
    data = request.get_json()
    context = data.get('context')
    instruction = data.get('instruction')
    num_elements = data.get('count')
    
    system_prompt = SYSTEM_PROMPT_SCENE_WRITER
    
    user_prompt = f"""Continue the screenplay scene in JSON format (only scene elements) based on the instruction `{instruction}` and additional context (in priority order), by adding more elements only:
1. Current screenplay to continue: `{context.get('current_screenplay', "")}`
2. Previous Section Summary: `{context.get('previous_summary', "")}`
3. Synopsis for the entire chapter: `{context.get('synopsis', '')}`
4. Overall story parameters: `{context.get('parameters', '')}`

Instructions:
- Continue the extensive, richly detailed screenplay scene that follows instructions precisely.
- Ensure the continued scene follows logically and tonally from the Current Screenplay.
- Ensure the continued scene especially the "sequence" part, does not repeat anything that has already happened in the "sequence" part of Previous Section Summary.
- Maintain consistency with the overall theme and character development described in the Chapter Synopsis and Context.
- The scene should include:
  1. A vividly described setting with sensory details
  2. In-depth character descriptions and development
  3. Extensive dialogue that reveals character personalities and advances the plot
  4. Detailed actions and reactions, including subtle gestures and expressions
  5. Internal monologues to provide insight into characters' thoughts and emotions
  6. An appropriate tone that matches the story's context
- Aim for exactly {num_elements} elements in the screenplay, balancing action, dialogues and internal monologues. Do not try to finish the scene quickly by rushing the scene, if you run out of elements.
- If the instruction tells you to conclude the scene, then follow the instruction but conclude the screenplay.
- Explore the character's emotional journey throughout the scene, showing their internal conflict and decision-making process.
- Do not try to end or conclude the scene, unless specifically asked for in the instruction.

Remember to structure your output as a JSON object according to the format specified in the system prompt and only generate scene elements.
    """
    print(user_prompt)

    def generate():
        partial_result = ""
        try:
            for chunk in hermes_ai_streamed_output(user_prompt, system_prompt, [], "", "json"):
                if isinstance(chunk, dict) and 'error' in chunk:
                    return jsonify(chunk), 500
                partial_result += chunk
                yield json.dumps({'chunk': chunk}) + '\n'
        except Exception as e:
            yield json.dumps({'error': "An error occured"})

    return Response(stream_with_context(generate()), content_type='application/x-ndjson')

SYSTEM_PROMPT_SCENE_PARAGRAPH_WRITER = """You are an expert novel writer with a talent for transforming screenplay scenes into vivid, engaging prose. Your task is to create rich, detailed paragraphs that accurately represent the content of a given screenplay scene without adding any new plot elements or character interactions. When writing, adhere to these guidelines:

1. Transform the screenplay format into flowing prose, maintaining the scene's structure and pacing.
2. Use descriptive language to paint a clear picture of the setting, characters, and actions.
3. Incorporate dialogue seamlessly into the narrative, using appropriate dialogue tags and action beats.
4. Convey characters' emotions, thoughts, and internal monologues through narrative prose rather than explicit screenplay directions.
5. Maintain the present tense typically used in screenplays, unless the story context requires otherwise.
6. Ensure that your prose accurately reflects all elements of the screenplay, including actions, dialogues, and transitions.
7. Do not add any new plot elements, character interactions, or significant details not present in the original screenplay.
8. Organize your writing into paragraphs that flow logically and maintain the rhythm of the scene.
9. Use a variety of sentence structures to create engaging prose that captures the essence of the screenplay's style.

Remember to stay true to the tone, atmosphere, and character voices established in the screenplay while translating the content into a novel format."""

@app.route('/chapter/scene/paragraph/new', methods=['POST'])
def generate_new_scene_paragraphs():
    data = request.get_json()
    context = data.get('context')
    instruction = data.get('instruction')
    num_elements = 10
    
    system_prompt = SYSTEM_PROMPT_SCENE_PARAGRAPH_WRITER
    
    user_prompt = f"""Transform the following screenplay scene into novel-style paragraphs. Your task is to accurately represent all elements of the screenplay in prose form without altering or adding any major plot points or significant details. Use the following context:
1. Current Screenplay: `{context.get('current_screenplay', "")}`
2. Additional Instructions: `{instruction}`
3. Synopsis for the entire chapter: `{context.get('synopsis', '')}`
4. Overall story parameters: `{context.get('parameters', '')}`

Instructions:
1. Begin your prose with a paragraph that sets the scene, incorporating the details from the "setting" object in the JSON.
2. Generate maximum {num_elements} paragraphs. Do not try to rush your paragraphs to complete the screenplay exactly, it's ok if the screenplay is not finished entirely.
3. Introduce characters naturally within the narrative, weaving in their descriptions from the "character" objects as they appear in the scene.
4. Try to incorporate each element from the screenplay into a prose:
   - For "action" elements, describe the events in vivid detail.
   - For "dialogue" elements, incorporate the speech into the narrative and get the tone and personality of the character.
   - For "internal_monologue" elements, convey the character's thoughts within the narrative flow and make it fit within the paragraphs naturally.
5. Maintain the scene's pacing and emotional tone throughout your writing.
6. Ensure that your prose covers all aspects of the screenplay without introducing new events or new character interactions.
7. Organize your writing into paragraphs that correspond to natural breaks or shifts in the scene.
8. Do not write short paragraphs.
    """
    print(user_prompt)

    def generate():
        partial_result = ""
        try:
            for chunk in hermes_ai_streamed_output(user_prompt, system_prompt, [], ""):
                if isinstance(chunk, dict) and 'error' in chunk:
                    return jsonify(chunk), 500
                partial_result += chunk
                yield json.dumps({'chunk': chunk}) + '\n'
        except Exception as e:
            yield json.dumps({'error': "An error occured"})

    return Response(stream_with_context(generate()), content_type='application/x-ndjson')

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

def clean_json_string(json_string):
    # Remove potential markdown code block formatting
    json_string = re.sub(r'^```json\s*', '', json_string, flags=re.MULTILINE)
    json_string = re.sub(r'\s*```$', '', json_string, flags=re.MULTILINE)
    # Remove any leading/trailing whitespace
    return json_string.strip()

@app.route("/mafia/event", methods=["POST"])
def generate_event():
    data = request.get_json()
    context = data.get('context', {})
    system_prompt = """
You are an AI assistant designed to generate events and choices for the game "Mafia Empire". Your task is to create engaging, narrative-driven events with meaningful choices that align with the game's mechanics and balance. 

Follow these guidelines:
-- Event Structure
- Trigger: The player action that initiates the event.
- Context: Current game phase, player's status, and relevant background.
- Narrative: A brief, engaging description of the situation (2-3 sentences).
- Choices: 3 options for the player to choose from.

-- Choice Structure
For each choice, provide:

- Title: A short, action-oriented name (1-3 words).
- Description: A brief explanation of the action (1 sentence).
- Difficulty: Rate from 1 (Easy) to 5 (Very Hard).
- Potential Outcomes: Success and failure states with specific consequences.

-- Consequence Categories
Outcomes should affect one or more of these player attributes:

- Territory Control (%)

Guidelines

- Ensure choices are distinct and offer meaningful trade-offs.
- Balance risk and reward based on the choice difficulty.
- Align the event and choices with the current game phase and player status.
- Use appropriate tone and language for a crime-themed strategy game.
- Incorporate character interactions where relevant.
- Avoid repetition by varying scenarios and consequences.
"""
    user_prompt = """
Generate an event with 3 choices based on this information: {context}, following the structure and guidelines provided in the system prompt. Output the result in the specified JSON format. 
{
  "event": {
    "trigger": "string",
    "narrative": "string",
    "choices": [
      {
        "title": "string",
        "description": "string",
        "difficulty": "number", //from 1-5 only
        "successProbability": "number" //in % only
        "outcomes": {
          "success": {
            "description": "string",
            "consequences": {
              "territory": "number",
            }
          },
          "failure": {
            "description": "string",
            "consequences": {
              "territory": "number",
            }
          }
        }
      }
    ]
  }
}
"""
    # 
    result = """
{
    "event": {
        "choices": [
            {
                "description": "Launch a full-scale assault on the rival hideout.",
                "difficulty": 4,
                "outcomes": {
                    "failure": {
                        "consequences": {
                            "characterRelationships": [
                                {
                                    "change": -5,
                                    "character": "Rocco"
                                }
                            ],
                            "heat": 10,
                            "influence": -5,
                            "manpower": -5,
                            "money": -500,
                            "territory": -10
                        },
                        "description": "Your assault fails miserably, leading to heavy losses."
                    },
                    "success": {
                        "consequences": {
                            "characterRelationships": [
                                {
                                    "change": -3,
                                    "character": "Rocco"
                                }
                            ],
                            "heat": 5,
                            "influence": 10,
                            "manpower": -2,
                            "money": 1000,
                            "territory": 20
                        },
                        "description": "Your crew overwhelms the defenses and seizes control of the hideout."
                    }
                },
                "title": "Forceful Takeover"
            },
            {
                "description": "Attempt to negotiate with the rival for control of their hideout.",
                "difficulty": 3,
                "outcomes": {
                    "failure": {
                        "consequences": {
                            "characterRelationships": [
                                {
                                    "change": -2,
                                    "character": "Lena"
                                }
                            ],
                            "heat": 8,
                            "influence": -10,
                            "manpower": -1,
                            "money": -200,
                            "territory": 0
                        },
                        "description": "The rival refuses and turns hostile, leading to a tense standoff."
                    },
                    "success": {
                        "consequences": {
                            "characterRelationships": [
                                {
                                    "change": 2,
                                    "character": "Lena"
                                }
                            ],
                            "heat": 3,
                            "influence": 15,
                            "manpower": 0,
                            "money": -800,
                            "territory": 15
                        },
                        "description": "You successfully convince the rival to hand over the hideout for a fair price."
                    }
                },
                "title": "Diplomatic Negotiation"
            },
            {
                "description": "Create a diversion to allow your crew to infiltrate the hideout unnoticed.",
                "difficulty": 2,
                "outcomes": {
                    "failure": {
                        "consequences": {
                            "characterRelationships": [
                                {
                                    "change": -1,
                                    "character": "Dante"
                                }
                            ],
                            "heat": 4,
                            "influence": -5,
                            "manpower": 0,
                            "money": -300,
                            "territory": -5
                        },
                        "description": "The distraction fails, causing confusion and alerting the rival gang."
                    },
                    "success": {
                        "consequences": {
                            "characterRelationships": [
                                {
                                    "change": 3,
                                    "character": "Dante"
                                }
                            ],
                            "heat": 2,
                            "influence": 12,
                            "manpower": 1,
                            "money": 500,
                            "territory": 10
                        },
                        "description": "The distraction works flawlessly, and your crew slips in and takes control without a fight."
                    }
                },
                "title": "Cunning Distraction"
            }
        ],
        "narrative": "As you plot your next move, your eye falls on a nearby rival's hideout. Its defenses seem modest, but the potential gain of influence and resources tempts you to make your move. You can either stage a direct takeover, negotiate for the hideout, or launch a distraction to slip in quietly.",
        "trigger": "The player decides to expand their territory by taking over a rival's hideout."
    }
}
"""
    result = hermes_ai_output(user_prompt, system_prompt, [], "")
    
    try:
        # Attempt to parse the result as JSON
        cleaned_result = clean_json_string(result)
        event_json = json.loads(cleaned_result)
        return jsonify(event_json)
    except json.JSONDecodeError as e:
        # If parsing fails, return an error
        return jsonify({'error': f"Failed to parse AI output as JSON: {str(e)}"}), 500

if __name__ == "__main__":
    print("Starting server...")
    app.run(host="0.0.0.0", debug=True, threaded=True)