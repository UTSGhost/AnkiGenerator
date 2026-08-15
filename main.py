from google import genai
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional
import genanki
import random

# put your Gemini API key into .env in root
load_dotenv()
test_key = os.getenv("GEMINI_API_KEY")
# for debugging only
# print(f"Erkannter Key: {test_key}") 


class Card(BaseModel):
    translation: str = Field(description="The translated word")
    details: Optional[str] = Field(description="optional details for translation (front)")
    masu: str = Field(description="The original word")
    information: Optional[str] = Field(description="optional explanations and additions (back)")

class Deck(BaseModel):
    cards: List[Card]

client = genai.Client()

image = client.files.upload(file="image.png")

prompt = "Please extract following words from the Image. On the left column, you have the translated words for front side cards. on the right side, you have the original words for the back side.  Also, make sure to fix any obvious spelling mistakes. If the word is difficult/ambiguous, feel free to add the optional data details and informations on the card."

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


if not (interaction.output_text): # type: ignore
    raise ValueError("no output text")


deck = Deck.model_validate_json(interaction.output_text) # type: ignore
print(deck)

# necessary for genanki model -> https://darigovresearch.github.io/genanki/build/html/overview.html
randomInt = random.randrange(1 << 30, 1 << 31)

with open("front.html", "r") as f_front, open("back.html", "r") as f_back, open("style.css", "r") as f_css:
    front_html = f_front.read()
    back_html = f_back.read()
    css_code = f_css.read()



anki_model = genanki.Model(
    randomInt,
    'Simpel Model',
    fields=[
        {'name': 'Translation'},
        {'name': 'Translation Details'},
        {'name': 'Japanese'},
        {'name': 'Information'},
    ],
    templates=[
        {
        'name': 'DE → JP',
        'qfmt': front_html,
        'afmt': back_html,
        },
    ],
    css=css_code
)


randomIntForDeck = random.randrange(1 << 30, 1 << 31)
my_deck = genanki.Deck(
    randomIntForDeck,
    'Test Deck'
)

for card in deck.cards:
    my_note = genanki.Note(
        model=anki_model,
        fields=[card.translation,card.details or "",card.masu,card.information or ""]
    )
    my_deck.add_note(my_note)

genanki.Package(my_deck).write_to_file('output.apkg')


