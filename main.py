from google import genai
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional

load_dotenv()

test_key = os.getenv("GEMINI_API_KEY")
print(f"Erkannter Key: {test_key}")


class Card(BaseModel):
    front: str = Field(description="The original word")
    back: str = Field(description="The translated word")

class Deck(BaseModel):
    cards: List[Card]

client = genai.Client()

image = client.files.upload(file="image.png")

prompt = "Please extract following words from the Image. On the left column, you have the original words for front side cards. on the right side, you have the translated words for the back side"

interaction = client.interactions.create(
    model="gemini-3.6-flash",
    input=[
        {"type": "text", "text": prompt},
        {
            "type": "image",
            "uri": image.uri,
            "mime_type": image.mime_type
        }
    ],
    response_format={
        "type": "text",
        "mime_type": "application/json",
        "schema": Deck.model_json_schema()
    }
)
if (interaction.output_text):
    deck = Deck.model_validate_json(interaction.output_text)
    print(deck)
