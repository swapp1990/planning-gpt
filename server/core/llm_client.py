import os
import re
import json
import logging
from typing import Dict, Any, Generator
from openai import OpenAI
from flask import jsonify
from core.utils import clean_json_string

# MODEL = "gpt-4o-2024-08-06"
MODEL = "gpt-4o-mini"
class LLMClient:
	def __init__(self):
		self.openai_api_key = os.getenv('OPENAI_API_KEY')
		self.client = OpenAI(api_key=self.openai_api_key)
		self.logger = logging.getLogger(__name__)

	def generate_json(
		self,
		prompt: str,
		system_prompt: str,
		model: str = MODEL,
		temperature: float = 0.7,
		max_tokens: int = 10000,
	) -> Dict[str, Any]:
		"""
		Generate a JSON response from the language model based on the given prompt and system instructions.
		"""
		try:
			response = self.client.chat.completions.create(
				model=model,
				messages=[
					{"role": "system", "content": system_prompt},
					{"role": "user", "content": prompt}
				],
				temperature=temperature,
				max_tokens=max_tokens
			)
			
			content = response.choices[0].message.content
			content = clean_json_string(content)
			# print(content)
			
			# self.logger.info(f"Generated JSON content: {content[:100]}...")
			
			# Parse and validate the JSON response
			# json_response = json.loads(content)
			
			return content

		except json.JSONDecodeError as e:
			self.logger.error(f"Failed to parse response as JSON: {e}")
			return jsonify({'error': "Failed to generate valid JSON response"}), 500

		except Exception as e:
			self.logger.error(f"Error in generate_json: {str(e)}")
			return jsonify({'error': "An error occurred while processing the request"}), 500

	def _validate_json_schema(self, data: Dict[str, Any], schema: Dict[str, Any]) -> None:
		"""
		Validate the generated JSON against the provided schema.
		This is a simple implementation and can be extended with a full JSON schema validator like jsonschema.
		"""
		def validate_object(obj, obj_schema):
			for key, value_schema in obj_schema.get("properties", {}).items():
				if key not in obj:
					if key in obj_schema.get("required", []):
						raise ValueError(f"Missing required key: {key}")
					continue
				if value_schema.get("type") == "object":
					validate_object(obj[key], value_schema)
				elif value_schema.get("type") == "array":
					for item in obj[key]:
						validate_object(item, value_schema["items"])

		validate_object(data, schema)

	# You can add other methods from the original app.py here, such as:
	def generate_text(self, prompt: str, system_prompt: str, temperature: float = 0.7, max_tokens: int = 1000):
		response = self.client.chat.completions.create(
			model="gpt-4o-2024-08-06",
			messages=[
				{"role": "system", "content": system_prompt},
				{"role": "user", "content": prompt}
			],
			temperature=temperature,
			max_tokens=max_tokens
		)
		return response.choices[0].message.content

	def generate_streamed_json(
		self,
		prompt: str,
		system_prompt: str,
		model: str = MODEL,
		temperature: float = 0.7,
		max_tokens: int = 1000,
	) -> Generator[Dict[str, Any], None, None]:
		try:
			response = self.client.chat.completions.create(
				model=model,
				messages=[
					{"role": "system", "content": system_prompt},
					{"role": "user", "content": prompt}
				],
				temperature=temperature,
				max_tokens=max_tokens,
				stream=True
			)
			print(response)
			yield from self._process_json_stream(response)
		except Exception as e:
			self.logger.error(f"Error in generate_streamed_json: {str(e)}")
			yield {"error": f"An error occurred: {str(e)}"}
	
	def generate_streamed_text(
		self,
		prompt: str,
		system_prompt: str,
		model: str = MODEL,
		temperature: float = 0.7,
		max_tokens: int = 1000,
	) -> Generator[Dict[str, Any], None, None]:
		try:
			response = self.client.chat.completions.create(
				model=model,
				messages=[
					{"role": "system", "content": system_prompt},
					{"role": "user", "content": prompt}
				],
				temperature=temperature,
				max_tokens=max_tokens,
				stream=True
			)
			yield from self._process_text_stream(response)
		except Exception as e:
			self.logger.error(f"Error in generate_streamed_text: {str(e)}")
			yield {"error": f"An error occurred: {str(e)}"}
	
	def _process_json_stream(self, response):
		json_buffer = ""
		for chunk in response:
			if chunk.choices[0].delta.content:
				msg = chunk.choices[0].delta.content
				json_buffer += msg

				if json_buffer.startswith("I'm sorry"):
					raise ValueError("I'm sorry phrase detected")
				
				while True:
					match = re.search(r'\{[^{}]*\}', json_buffer)
					if not match:
						break
					
					json_str = match.group()
					try:
						json_obj = json.loads(json_str)
						yield {"chunk": json.dumps(json_obj)}
						json_buffer = json_buffer[match.end():]
					except json.JSONDecodeError:
						break
		
		if json_buffer.strip():
			try:
				json_obj = json.loads(json_buffer)
				yield {"chunk": json.dumps(json_obj)}
			except json.JSONDecodeError:
				pass

		yield {"chunk": "[DONE]"}
	
	def _process_text_stream(self, response):
		current_sentence = ""
		final_response = ""
		for chunk in response:
			if chunk.choices[0].delta.content:
				msg = chunk.choices[0].delta.content or ""
				
				# Check for "I'm sorry" at the beginning of the response
				if not current_sentence and msg.lstrip().startswith("I'm sorry"):
					raise ValueError("I'm sorry phrase detected")
				
				current_sentence += msg
				current_sentence = current_sentence.replace("\n\n", "\\n\\n")
				
				sentences = re.split(r'(?<=[.!?])\s+', current_sentence)
				
				if len(sentences) > 1:
					complete_sentences = sentences[:-1]
					for sentence in complete_sentences:
						yield {"chunk": sentence.strip()}
						final_response += sentence + " "
					
					current_sentence = sentences[-1]
		
		# Yield any remaining content in current_sentence
		if current_sentence.strip():
			yield {"chunk": current_sentence.strip()}
			final_response += current_sentence

		yield {"chunk": "[DONE]"}