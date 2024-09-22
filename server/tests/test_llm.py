import pytest
import json
from unittest.mock import Mock, patch
from core.llm_client import LLMClient
from openai import OpenAI

@pytest.fixture
def llm_client():
    with patch('llm_client.OpenAI'):
        yield LLMClient()

@pytest.fixture
def mock_openai_response():
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content='{"key": "value"}'))]
    return mock_response

def test_generate_json_success(llm_client, mock_openai_response):
    with patch.object(llm_client.client.chat.completions, 'create', return_value=mock_openai_response):
        result = llm_client.generate_json(
            prompt="Test prompt",
            system_prompt="Test system prompt",
            json_schema={"type": "object", "properties": {"key": {"type": "string"}}}
        )
    
    assert result == {"key": "value"}

def test_generate_json_invalid_json(llm_client):
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content='Invalid JSON'))]
    
    with patch.object(llm_client.client.chat.completions, 'create', return_value=mock_response):
        result = llm_client.generate_json(
            prompt="Test prompt",
            system_prompt="Test system prompt",
            json_schema={"type": "object"}
        )
    
    assert isinstance(result, tuple)
    assert result[0].json['error'] == "Failed to generate valid JSON response"
    assert result[1] == 500

def test_generate_json_schema_validation_failure(llm_client, mock_openai_response):
    with patch.object(llm_client.client.chat.completions, 'create', return_value=mock_openai_response):
        with pytest.raises(ValueError, match="Missing required key: required_key"):
            llm_client.generate_json(
                prompt="Test prompt",
                system_prompt="Test system prompt",
                json_schema={
                    "type": "object",
                    "properties": {"required_key": {"type": "string"}},
                    "required": ["required_key"]
                }
            )

def test_generate_text_success(llm_client):
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content='Generated text'))]
    
    with patch.object(llm_client.client.chat.completions, 'create', return_value=mock_response):
        result = llm_client.generate_text(
            prompt="Test prompt",
            system_prompt="Test system prompt"
        )
    
    assert result == 'Generated text'

def test_generate_json_api_error(llm_client):
    with patch.object(llm_client.client.chat.completions, 'create', side_effect=Exception("API Error")):
        result = llm_client.generate_json(
            prompt="Test prompt",
            system_prompt="Test system prompt",
            json_schema={"type": "object"}
        )
    
    assert isinstance(result, tuple)
    assert result[0].json['error'] == "An error occurred while processing the request"
    assert result[1] == 500

def test_generate_text_api_error(llm_client):
    with patch.object(llm_client.client.chat.completions, 'create', side_effect=Exception("API Error")):
        with pytest.raises(Exception, match="API Error"):
            llm_client.generate_text(
                prompt="Test prompt",
                system_prompt="Test system prompt"
            )