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
    masu: Optional[str] = Field(description="optional masu form when its a japanese verb (front) HAS TO BE EMPTY IF ITS NOT A JAPANESE VERB!")
    japanese: str = Field(description="The original word")
    information: Optional[str] = Field(description="optional explanations and additions (back)")
    dictionary: Optional[str] = Field(description="optional dictionary form when its a japanese verb (back) HAS TO BE EMPTY IF ITS NOT A JAPANESE VERB!")

class Deck(BaseModel):
    cards: List[Card]

client = genai.Client()
image = client.files.upload(file="image.png")

with (
    open("front.html", "r", encoding="utf-8") as f_front,
    open("back.html", "r", encoding="utf-8") as f_back,
    open("style.css", "r", encoding="utf-8") as f_css,
    open("frontverb.html", "r", encoding="utf-8") as f_frontv,
    open("backverb.html", "r", encoding="utf-8") as f_backv,
    open("stylev.css", "r", encoding="utf-8") as f_cssv,
    open("prompt.txt", "r", encoding="utf-8") as f_prompt
):
    front_html = f_front.read()
    back_html = f_back.read()
    css_code = f_css.read()
    frontv_html = f_frontv.read()
    backv_html = f_backv.read()
    cssv_code = f_cssv.read()
    prompt = f_prompt.read()

#send data to AI
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

# should never be raised, but safer to check
if not (interaction.output_text): # type: ignore
    raise ValueError("no output text")


deck = Deck.model_validate_json(interaction.output_text) # type: ignore
# for debugging
print(deck)

# necessary for genanki model -> https://darigovresearch.github.io/genanki/build/html/overview.html
MODEL_ID_NORMAL = 1638294712
MODEL_ID_VERB = 1847201948
DECK_ID = 1482930491

# Anki Card Model for most vocabs
normal_vocabs = genanki.Model(
    MODEL_ID_NORMAL,
    'Normal Model',
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

# Anki Card Model for Masu -> Dictionary form
verbs = genanki.Model(
    MODEL_ID_VERB,
    'Verb Model',
    fields=[
        {'name': 'Masu Form'},
        {'name': 'Dictionary Form'},
        {'name': 'Translation'},
        {'name': 'Translation Details'},
        {'name': 'Information'},
    ],
    templates=[
        {
        'name': 'Masu → Dictionary',
        'qfmt': frontv_html,
        'afmt': backv_html,
        },
    ],
    css=cssv_code
)

# Necessary to output as a file
my_deck = genanki.Deck(
    DECK_ID,
    'Self Imported'
)

# go through all cards from AI output to create cards and add them to the deck
for card in deck.cards:
    # for verbs, create 2 different types of cards and add both to deck
    if (card.masu):
        my_note_masu = genanki.Note(
                model=verbs,
                fields=[card.masu, card.dictionary or "", card.translation, card.details or "", card.information or ""]
            )
        my_note = genanki.Note(
                    model=normal_vocabs,
                    fields=[card.translation, card.details or "",card.japanese,card.information or ""]
            )
        my_deck.add_note(my_note_masu)
        my_deck.add_note(my_note)
    # for normal verbs, only add the standard card
    else:
        my_note = genanki.Note(
            model=normal_vocabs,
            fields=[card.translation, card.details or "",card.japanese,card.information or ""]
        )
        my_deck.add_note(my_note)
    
# output can be directly inported to Anki
genanki.Package(my_deck).write_to_file('output.apkg')


