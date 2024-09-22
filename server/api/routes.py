from flask import Blueprint, request, jsonify, Response, stream_with_context
from typing import Dict, Any
from services.writing_service import WritingService
import json

api = Blueprint('api', __name__, url_prefix='/api/v1')

def init_routes(
	writing_service: WritingService
) -> None:
	@api.route("/chapters/suggestions", methods=["POST"])
	def generate_chapter_suggestions():
		"""
		Generate suggestions for new chapters based on the current story context.
		"""
		data: Dict[str, Any] = request.get_json()
		
		chapters = data.get('chapters', [])
		parameters = data.get('parameters', {})
		number_of_chapters = data.get('number_of_chapters', 3)
		total_chapters = data.get('total_chapters', 10)

		try:
			suggestions = writing_service.generate_chapter_suggestions(
				chapters=chapters,
				parameters=parameters,
				number_of_chapters=number_of_chapters,
				total_chapters=total_chapters
			)
			
			# Clean the JSON string to ensure it's properly formatted
			# cleaned_suggestions = clean_json_string(suggestions)
			
			return jsonify({'suggestions': suggestions})
		
		except ValueError as ve:
			# Handle validation errors
			return jsonify({'error': str(ve)}), 400
		
		except Exception as e:
			# Handle unexpected errors
			return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500

	@api.route("/chapters/outlines", methods=["POST"])
	def generate_chapter_outlines():
		"""
		Generate outlines for continuing a chapter.
		"""
		data: Dict[str, Any] = request.get_json()
		
		context = data.get('context', {})
		instruction = data.get('instruction', '')
		num_outlines = data.get('count', 3)

		try:
			outlines = writing_service.generate_chapter_outlines(
				context=context,
				instruction=instruction,
				num_outlines=num_outlines
			)
			
			return jsonify({'outlines': outlines})
		
		except ValueError as ve:
			# Handle validation errors
			return jsonify({'error': str(ve)}), 400
		
		except Exception as e:
			# Handle unexpected errors
			return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500

	@api.route("/chapters/scene/new", methods=["POST"])
	def generate_new_scene():
		data = request.get_json()
		context = data.get('context', {})
		instruction = data.get('instruction', '')
		num_elements = data.get('count', 10)
		stream = data.get('stream', False)

		print("generate_new_scene " + str(num_elements) + " streaming: " + str(stream))

		if stream:
			def generate():
				try:
					for chunk in writing_service.generate_new_scene(
						context=context,
						instruction=instruction,
						num_elements=num_elements,
						stream=True
					):
						yield json.dumps(chunk) + '\n'
				except Exception as e:
					yield json.dumps({'error': str(e)}) + '\n'

			return Response(stream_with_context(generate()), content_type='application/x-ndjson')
		else:
			try:
				scene = writing_service.generate_new_scene(
					context=context,
					instruction=instruction,
					num_elements=num_elements,
					stream=False
				)
				return jsonify(scene)
			except Exception as e:
				return jsonify({'error': str(e)}), 500
		
	@api.route("/chapters/scene/rewrite", methods=["POST"])
	def rewrite_scene():
		"""
		Rewrite an existing scene in a chapter.
		"""
		pass

	@api.route("/chapters/scene/continue", methods=["POST"])
	def continue_scene():
		"""
		Continue an existing scene in a chapter.
		"""
		pass

	@api.route("/chapters/scene/paragraph/new", methods=["POST"])
	def generate_scene_paragraphs():
		"""
		Generate paragraphs for a scene.
		"""
		pass
	
	@api.route("/chapters/scene/paragraph/rewrite", methods=["POST"])
	def rewrite_scene_paragraphs():
		"""
		Rewrite paragraphs for a scene.
		"""
		pass

	@api.route("/chapters/scene/paragraph/continue", methods=["POST"])
	def continue_scene_paragraphs():
		"""
		Continue writing paragraphs for a scene.
		"""
		pass