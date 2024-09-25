import json
import logging
from typing import Dict, List, Any
from tenacity import retry, stop_after_attempt, wait_exponential
from core.llm_client import LLMClient

from core.prompts import SYSTEM_PROMPT_SCENE_WRITER, SYSTEM_PROMPT_SCENE_PARAGRAPH_WRITER, SYSTEM_PROMPT_SCENE_SUMMARY_WRITER

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

class WritingService:
	def __init__(self, llm_client: LLMClient):
		self.llm_client = llm_client
		self.logger = logging.getLogger(__name__)

	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def generate_parameter_suggestions(
		self,
		context: Dict[str, Any],
		field_type: str,
		current_value: str,
	) -> List[Dict[str, Any]]:
		"""
		Generate suggestions for new chapters based on the current story context.

		Args:
			chapters (List[Dict[str, Any]]): List of existing chapters
			parameters (Dict[str, Any]): Story parameters
			number_of_chapters (int): Number of new chapters to generate
			total_chapters (int): Total number of chapters in the story

		Returns:
			List[Dict[str, Any]]: List of suggested chapters
		"""
		system_prompt = """You are an AI assistant specialized in creative writing and story development. 
    Your task is to provide suggestions for various aspects of a story, including plot elements, 
    character details, and setting descriptions. Ensure your suggestions are creative, diverse, 
    and contextually appropriate.
    
    Your output should be a valid JSON object where each element is an object containing 'text' which is the suggested output. Only return the json output, nothing else. An example of output is: {"text\": \"Echoes of the Forgotten Realm\"}
    """
		
		user_prompt = get_user_prompt(field_type, current_value, context)
		
		try:
			response = self.llm_client.generate_json(
				prompt=user_prompt,
				system_prompt=system_prompt,
			)

			parameters = json.loads(response)

			self.logger.info(f"Successfully generated {len(parameters)} parameter suggestions")
			return parameters

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_chapter_suggestions: {e}")
			raise

	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def generate_chapter_suggestions(
		self,
		chapters: List[Dict[str, Any]],
		parameters: Dict[str, Any],
		number_of_chapters: int,
		total_chapters: int
	) -> List[Dict[str, Any]]:
		"""
		Generate suggestions for new chapters based on the current story context.

		Args:
			chapters (List[Dict[str, Any]]): List of existing chapters
			parameters (Dict[str, Any]): Story parameters
			number_of_chapters (int): Number of new chapters to generate
			total_chapters (int): Total number of chapters in the story

		Returns:
			List[Dict[str, Any]]: List of suggested chapters
		"""
		self.logger.info(f"Generating {number_of_chapters} chapter suggestions")

		if number_of_chapters <= 0:
			raise ValueError("Number of chapters to generate must be positive")

		if total_chapters < len(chapters) + number_of_chapters:
			raise ValueError("Total chapters cannot be less than existing chapters plus new chapters")

		system_prompt = """You are an AI assistant specialized in creative writing and story structure. Your task is to generate chapter outlines for novels based on a given premise. You should create engaging chapter titles, concise synopses, and determine which act each chapter belongs to in a structure defined in the "parameters". Your output should be well-structured, consistent, and suitable for further development into a full novel. Follow these guidelines:
		1. Create chapter titles that are intriguing and relevant to the chapter's content.
		2. Write synopses that capture the key events, character developments, and themes of each chapter.
		3. Assign each chapter an act it is part of, ensuring a proper distribution across the structure defined in the "parameters".
		4. Maintain consistency in tone, style, and narrative progression throughout the chapter outlines.
		5. Ensure that the generated chapters build upon each other to create a cohesive story arc.
		6. Adapt the pacing and content density based on the number of chapters requested versus the total intended chapters.

		Additionally, when writing synopses, follow these specific guidelines:
		- Keep synopses concise, ideally one to two sentences.
		- Focus on the main plot points, character developments, or thematic elements.
		- Use active voice and present tense for immediacy.
		- Avoid detailed descriptions or dialogue; stick to key events and their implications.
		- Ensure each synopsis logically follows from the previous one and leads into the next.

		Your output should be a valid JSON array where each element is an object containing 'title', 'synopsis', and 'act' keys."""

		user_prompt = f"""Generate {number_of_chapters} new chapter outlines based on the following:

		Story Parameters:
		{json.dumps(parameters, indent=2)}

		Existing Chapters:
		{json.dumps(chapters, indent=2)}

		Total Chapters in Story: {total_chapters}

		Please provide an array of {number_of_chapters} new chapter outlines, each containing a title, synopsis, and the act it belongs to. Ensure that these new chapters logically follow the existing ones and lead towards a satisfying conclusion of the story, considering the total number of chapters for the field "suggestions".
		"""

		try:
			self.logger.debug(f"Sending prompt to LLM: {user_prompt[:100]}...")
			response = self.llm_client.generate_json(
				prompt=user_prompt,
				system_prompt=system_prompt,
			)

			suggested_chapters = json.loads(response)

			if len(suggested_chapters) != number_of_chapters:
				self.logger.warning(f"LLM returned {len(suggested_chapters)} chapters instead of the requested {number_of_chapters}")

			self.logger.info(f"Successfully generated {len(suggested_chapters)} chapter suggestions")
			return suggested_chapters

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_chapter_suggestions: {e}")
			raise

	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def generate_chapter_outlines(
		self,
		context: Dict[str, Any],
		instruction: str,
		num_outlines: int
	) -> List[Dict[str, str]]:
		"""
		Generate outlines for continuing a chapter.

		Args:
			context (Dict[str, Any]): Context information for the chapter
			instruction (str): Specific instruction for generating outlines
			num_outlines (int): Number of outlines to generate

		Returns:
			List[Dict[str, str]]: List of generated outlines
		"""
		self.logger.info(f"Generating {num_outlines} chapter outlines")

		if num_outlines <= 0:
			raise ValueError("Number of outlines to generate must be positive")

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

		Context: {json.dumps(context, indent=2)}
		Instruction (content to cover in the outlines): {instruction}

		Please provide an array of {num_outlines} outlines, each containing an 'outline' key."""

		try:
			# self.logger.debug(f"Sending prompt to LLM: {user_prompt[:100]}...")
			response = self.llm_client.generate_json(
				prompt=user_prompt,
				system_prompt=system_prompt,
			)

			outlines = json.loads(response)

			if not isinstance(outlines, list) or len(outlines) != num_outlines:
				raise ValueError(f"Expected {num_outlines} outlines, but received {len(outlines) if isinstance(outlines, list) else 'non-list data'}")

			for outline in outlines:
				if not isinstance(outline, dict) or 'outline' not in outline:
					raise ValueError("Invalid outline format in LLM response")

			self.logger.info(f"Successfully generated {len(outlines)} chapter outlines")
			return outlines

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_chapter_outlines: {e}")
			raise

	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def generate_section_summary(
		self,
		context: Dict[str, Any],
		stream: bool = False
	) -> Dict[str, Any]:
		"""
		Generate a summary based on the given context.

		Args:
			context (Dict[str, Any]): Context information for the scene

		Returns:
			Dict[str, Any]: Generated summary as a JSON object
		"""

		system_prompt = SYSTEM_PROMPT_SCENE_SUMMARY_WRITER

		user_prompt = f"""
Summarize the following paragraphs in JSON format as specified in the system message: `{context.get('paragraphs', "")}`

Here's the relevant context:

Novel Parameters: `{context.get('parameters', "")}`

Current Chapter Synopsis: `{context.get('synopsis', "")}`

Previous Section Summary: `{context.get('previous_summary', "")}`

Ensure your summary captures all key elements without introducing any new information or speculation about future events.

CRITICAL INSTRUCTIONS:
1. For "sequence" list, make sure the new events/revelations are added after all the events/revelations are already compressed and give a proper sequence of the story so far. Keep the list to maximum 5 entries.
"""
		# print(user_prompt)
		try:
			if stream:
				return self.llm_client.generate_streamed_json(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
			else:
				response = self.llm_client.generate_json(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
				return json.loads(response)

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_new_scene: {e}")
			raise

	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def generate_new_scene(
		self,
		context: Dict[str, Any],
		instruction: str,
		num_elements: int,
		stream: bool = False
	) -> Dict[str, Any]:
		"""
		Generate a new scene based on the given context and instruction.

		Args:
			context (Dict[str, Any]): Context information for the scene
			instruction (str): Specific instruction for generating the scene
			num_elements (int): Minimum number of elements to generate in the scene

		Returns:
			Dict[str, Any]: Generated scene as a JSON object
		"""
		# self.logger.info(f"Generating new scene with minimum {num_elements} elements")

		if num_elements <= 0:
			raise ValueError("Number of elements must be positive")

		user_prompt = f"""Create a new scene in JSON format based on the instruction `{instruction}` and additional context (in priority order):
1. Previous Screenplay: `{context.get('previous_screenplay', "")}`
2. Overall Section Outline: `{context.get('overall_outline', "")}`
3. Previous Section Summary: `{context.get('previous_summary', "")}`
4. Synopsis for the entire chapter: `{context.get('synopsis', '')}`
5. Overall story parameters: `{context.get('parameters', '')}`

CRITICAL Instructions:
- Analyze the Previous Screenplay (Point 1 above). Make a note of where the previous screenplay ends. The new scene should start after the events of previous screenplay only. Add a field "previous_end_note" with a single line noting the previous end if available.
- Generate an extensive, richly detailed screenplay scene that follow the instructions exactly.
- If specific instructions are unavailable, then take guidance from the current section outline.
- Do not repeat any content from the Previous Section Summary (Point 3 above), those things have already happened, use them as guidance for the new scene.
- Ensure the new scene especially the "sequence" part, does not repeat anything that has already happened in the "sequence" part of Previous Section Summary (Point 3 above).
- Maintain consistency with the overall theme and character development described in the Chapter Synopsis and Parameters.
- The scene should include:
  1. A vividly described setting with sensory details
  2. In-depth character descriptions and development
  3. Extensive dialogue that reveals character personalities and advances the plot
  4. Detailed actions and reactions, including subtle gestures and expressions
  5. Internal monologues to provide insight into characters' thoughts and emotions
  6. An appropriate tone that matches the story's context
- Aim for exactly {num_elements} elements in the scene, balancing action, dialogues and internal monologues. Do not try to finish the scene quickly by rushing the scene, if you run out of elements to generate.
- Explore the character's emotional journey throughout the scene, showing their internal conflict and decision-making process.
- Do not try to end or conclude the scene, unless specifically asked for in the instruction.
- If the instruction asks to make changes to characters, time or location modify those fields as well.

Remember to structure your output as a JSON object according to the format specified in the system prompt, including title, setting, characters, and scene elements."""
		print(user_prompt)
		try:
			if stream:
				return self.llm_client.generate_streamed_json(
					prompt=user_prompt,
					system_prompt=SYSTEM_PROMPT_SCENE_WRITER,
				)
			else:
				response = self.llm_client.generate_json(
					prompt=user_prompt,
					system_prompt=SYSTEM_PROMPT_SCENE_WRITER,
				)
				return json.loads(response)

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_new_scene: {e}")
			raise
	
	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def continue_scene(
		self,
		context: Dict[str, Any],
		instruction: str,
		num_elements: int,
		stream: bool = False
	) -> Dict[str, Any]:
		"""
		Generate a new scene based on the given context and instruction.

		Args:
			context (Dict[str, Any]): Context information for the scene
			instruction (str): Specific instruction for generating the scene
			num_elements (int): Minimum number of elements to generate in the scene

		Returns:
			Dict[str, Any]: Generated scene as a JSON object
		"""
		self.logger.info(f"Generating new scene with minimum {num_elements} elements")

		if num_elements <= 0:
			raise ValueError("Number of elements must be positive")

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
		# print(user_prompt)
		try:
			if stream:
				return self.llm_client.generate_streamed_json(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
			else:
				response = self.llm_client.generate_json(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
				return json.loads(response)

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_new_scene: {e}")
			raise

	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def insert_scene(
		self,
		context: Dict[str, Any],
		instruction: str,
		num_elements: int,
		stream: bool = False
	) -> Dict[str, Any]:
		"""
		Generate a new scene based on the given context and instruction.

		Args:
			context (Dict[str, Any]): Context information for the scene
			instruction (str): Specific instruction for generating the scene
			num_elements (int): Minimum number of elements to generate in the scene

		Returns:
			Dict[str, Any]: Generated scene as a JSON object
		"""
		self.logger.info(f"Generating new scene with minimum {num_elements} elements")

		if num_elements <= 0:
			raise ValueError("Number of elements must be positive")

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
		# print(user_prompt)
		try:
			if stream:
				return self.llm_client.generate_streamed_json(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
			else:
				response = self.llm_client.generate_json(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
				return json.loads(response)

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_new_scene: {e}")
			raise

	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def rewrite_scene(
		self,
		context: Dict[str, Any],
		instruction: str,
		num_elements: int,
		stream: bool = False
	) -> Dict[str, Any]:
		"""
		Generate a rewritten scene based on the given context and instruction.

		Args:
			context (Dict[str, Any]): Context information for the scene
			instruction (str): Specific instruction for generating the scene
			num_elements (int): Number of elements to generate in the scene

		Returns:
			Dict[str, Any]: Generated scene as a JSON object
		"""
		self.logger.info(f"Generating a rewritten scene with minimum {num_elements} elements")

		if num_elements <= 0:
			raise ValueError("Number of elements must be positive")

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
		# print(user_prompt)
		try:
			if stream:
				return self.llm_client.generate_streamed_json(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
			else:
				response = self.llm_client.generate_json(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
				return json.loads(response)

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_new_scene: {e}")
			raise

	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def new_scene_paragraphs(
		self,
		context: Dict[str, Any],
		instruction: str,
		num_paragraphs: int,
		stream: bool = False
	) -> Dict[str, Any]:
		"""
		Generate a new scene based on the given context and instruction.

		Args:
			context (Dict[str, Any]): Context information for the scene
			instruction (str): Specific instruction for generating the scene paragraphs
			num_paragraphs (int): Number of paragraphs to generate for the scene

		Returns:
			Dict[str, Any]: Generated paragraphs as a JSON object
		"""
		if num_paragraphs <= 0:
			raise ValueError("Number of paragraphs must be positive")

		system_prompt = SYSTEM_PROMPT_SCENE_PARAGRAPH_WRITER

		user_prompt = f"""Transform the following screenplay scene into novel-style paragraphs. Your task is to accurately represent all elements of the screenplay in prose form without altering or adding any major plot points or significant details. Use the following context:
1. Current Screenplay: `{context.get('current_screenplay', "")}`
2. Additional Instructions: `{instruction}`
3. Synopsis for the entire chapter: `{context.get('synopsis', '')}`
4. Overall story parameters: `{context.get('parameters', '')}`

Instructions:
1. Begin your prose with a paragraph that sets the scene, incorporating the details from the "setting" object in the JSON.
2. Generate maximum {num_paragraphs} paragraphs. Do not try to rush your paragraphs to complete the screenplay exactly, it's ok if the screenplay is not finished entirely.
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
		# print(user_prompt)
		try:
			if stream:
				return self.llm_client.generate_streamed_text(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
			else:
				response = self.llm_client.generate_text(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
				return json.loads(response)

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_new_scene: {e}")
			raise

	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def rewrite_scene_paragraphs(
		self,
		context: Dict[str, Any],
		instruction: str,
		num_paragraphs: int,
		stream: bool = False
	) -> Dict[str, Any]:
		"""
		Generate a rewritten paragraphs for scene based on the given context and instruction.

		Args:
			context (Dict[str, Any]): Context information for the scene
			instruction (str): Specific instruction for generating the scene paragraphs
			num_paragraphs (int): Number of paragraphs to generate for the scene

		Returns:
			Dict[str, Any]: Generated paragraphs as a JSON object
		"""
		if num_paragraphs <= 0:
			raise ValueError("Number of paragraphs must be positive")

		system_prompt = SYSTEM_PROMPT_SCENE_PARAGRAPH_WRITER

		user_prompt = f"""
	Rewrite the following paragraph(s) within the context of its section and the overall story:

	1. Chapter Synopsis: {context.get('synopsis', '')}
	2. Overall Story Parameters: {context.get('parameters', '')}
	3. Previous Paragraph: {context.get('previous_paragraph', '')}
	4. Paragraph(s) to Rewrite: {context.get('paragraph', '')}
	5. Next Paragraph: {context.get('next_paragraph', '')}

	CRITICAL INSTRUCTIONS:
	1. Follow these specific instructions to rewrite the paragraph(s): `{instruction}`
	2. Rewrite ONLY the given paragraph(s). Do not alter or address content from other paragraphs in the section.
	3. Write exactly {num_paragraphs} paragraph(s) that fit perfectly between the previous and next paragraphs, maintaining a natural flow and seamless continuity.
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
	7. If writing multiple paragraphs, distribute the new content logically across the {num_paragraphs} paragraphs.

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
	- Have you written exactly {num_paragraphs} paragraph(s)?
	- Does any new content fit seamlessly with the existing text and maintain the overall flow?
	- Are paragraph breaks correctly indicated using the "paragraph_break" action?

	Return only the JSON list of dictionaries representing the rewritten paragraph(s). Do not include any explanatory text or metadata in your response.
	"""
		print(user_prompt)

		try:
			if stream:
				return self.llm_client.generate_streamed_json(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
			else:
				response = self.llm_client.generate_json(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
				return json.loads(response)

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_new_scene: {e}")
			raise

	@retry(stop=stop_after_attempt(1), wait=wait_exponential(multiplier=1, min=4, max=10))
	def insert_scene_paragraphs(
		self,
		context: Dict[str, Any],
		instruction: str,
		num_paragraphs: int,
		stream: bool = False
	) -> Dict[str, Any]:
		"""
		Generate inserted paragraphs for scene based on the given context and instruction.

		Args:
			context (Dict[str, Any]): Context information for the scene
			instruction (str): Specific instruction for generating the scene paragraphs
			num_paragraphs (int): Number of paragraphs to generate for the scene

		Returns:
			Dict[str, Any]: Generated paragraphs as a JSON object
		"""
		if num_paragraphs <= 0:
			raise ValueError("Number of paragraphs must be positive")

		system_prompt = SYSTEM_PROMPT_SCENE_PARAGRAPH_WRITER

		user_prompt = f"""
Insert {num_paragraphs} paragraphs between previous paragraph and next paragraph:

1. Specific instruction to follow (can be empty): {instruction}
2. Previous paragraph (required): {context.get('prev', '')}
3. Next paragraph (can be empty): {context.get('next', '')}
4. Section summary (can be empty): {context.get('summary', '')}
5. Chapter synopsis: {context.get('synopsis', '')}
6. Overall Story Parameters: {context.get('parameters', '')}

CRITICAL INSTRUCTIONS:
1. Follow these specific instructions (Point 1) to insert new paragraphs
2. Ensure the inserted {num_paragraphs} new paragraph/s fits seamlessly within the section, maintaining continuity with preceding and following paragraphs.

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
4. Insert {num_paragraphs} new paragraph(s) that expand on the section based on the instruction.

FINAL VERIFICATION:
- Does the inserted paragraph fit seamlessly within the section without creating continuity issues?
- Have you written exactly {num_paragraphs} paragraph(s)?

Return all the inserted paragraphs. Do not include any explanatory text or metadata in your response.
"""
		try:
			if stream:
				return self.llm_client.generate_streamed_text(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
			else:
				response = self.llm_client.generate_text(
					prompt=user_prompt,
					system_prompt=system_prompt,
				)
				return json.loads(response)

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse LLM response as JSON: {e}")
			raise ValueError("Invalid response format from LLM") from e

		except Exception as e:
			self.logger.error(f"Unexpected error in generate_new_scene: {e}")
			raise