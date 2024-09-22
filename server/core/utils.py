import re
def clean_json_string(json_string):
    # Remove potential markdown code block formatting
    json_string = re.sub(r'^```json\s*', '', json_string, flags=re.MULTILINE)
    json_string = re.sub(r'\s*```$', '', json_string, flags=re.MULTILINE)
    # Remove any leading/trailing whitespace
    return json_string.strip()