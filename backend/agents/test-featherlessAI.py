import os
from openai import OpenAI
from dotenv import load_dotenv

# Load .env file
load_dotenv()

client = OpenAI(
  base_url="https://api.featherless.ai/v1",
  api_key= os.getenv("FEATHERLESS_API_KEY"),
)

response = client.chat.completions.create(
  model='meta-llama/Meta-Llama-3.1-8B-Instruct',
  messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
)
print(response.model_dump()['choices'][0]['message']['content'])
