import json
import logging
from typing import Dict, List, Any
from tenacity import retry, stop_after_attempt, wait_exponential
from core.llm_client import LLMClient

from core.prompts import SYSTEM_PROMPT_SCENE_WRITER

class WritingService:
    def __init__(self, llm_client: LLMClient):
        self.llm_client = llm_client
        self.logger = logging.getLogger(__name__)

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
        self.logger.info(f"Generating new scene with minimum {num_elements} elements")

        if num_elements <= 0:
            raise ValueError("Number of elements must be positive")

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

Remember to structure your output as a JSON object according to the format specified in the system prompt, including title, setting, characters, and scene elements."""
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