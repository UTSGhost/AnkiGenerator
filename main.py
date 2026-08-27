from google import genai
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional
import genanki
from pathlib import Path


GEMINI_MODEL = "gemini-3.1-flash-lite"
ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.webp'}
# necessary for genanki model -> https://darigovresearch.github.io/genanki/build/html/overview.html
MODEL_ID_NORMAL = 1638294712
MODEL_ID_VERB = 1847201948
DECK_ID = 1482930491

# put your Gemini API key into .env in root
load_dotenv()
test_key = os.getenv("GEMINI_API_KEY")

class Card(BaseModel):
    translation: str = Field(description="The German translation of the word.")
    details: Optional[str] = Field(default=None, description="Optional clarification only if the German word is ambiguous (e.g. to distinguish between different Japanese translations).")
    masu: Optional[str] = Field(default=None, description="Masu-form if it is a Japanese verb; null otherwise.")
    japanese: str = Field(description="The Japanese word")
    information: Optional[str] = Field(default=None, description="Optional explanations or additions for the back side.")
    dictionary: Optional[str] = Field(default=None, description="Dictionary-form if it is a Japanese verb; null otherwise.")

class Deck(BaseModel):
    cards: List[Card]

client = genai.Client()

with (
    open("templates/front.html", "r", encoding="utf-8") as f_front,
    open("templates/back.html", "r", encoding="utf-8") as f_back,
    open("templates/style.css", "r", encoding="utf-8") as f_css,
    open("templates/frontverb.html", "r", encoding="utf-8") as f_frontv,
    open("templates/backverb.html", "r", encoding="utf-8") as f_backv,
    open("templates/stylev.css", "r", encoding="utf-8") as f_cssv,
    open("prompt.txt", "r", encoding="utf-8") as f_prompt
):
    front_html = f_front.read()
    back_html = f_back.read()
    css_code = f_css.read()
    frontv_html = f_frontv.read()
    backv_html = f_backv.read()
    cssv_code = f_cssv.read()
    prompt = f_prompt.read()

# Anki Card Model for most vocabs
normal_vocabs = genanki.Model(
    MODEL_ID_NORMAL,
    'Normal Model',
    fields=[
        {'name': 'Japanese'},
        {'name': 'Translation'},
        {'name': 'Translation Details'},
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


def main():
    image = client.files.upload(file = findImage())
    deck = fetchAi(image)
    goodCards, badCards = checkForError(deck)
    if badCards:
        fixedCards = fixVerbAi(badCards)
        deck = Deck(cards = (fixedCards.cards + goodCards))
    createDeck(deck)

def findImage():
    p = Path("./")

    for f in p.iterdir():
        if f.suffix.lower() in ALLOWED_IMAGE_EXTENSIONS:
            return f.name
    raise Exception("No valid Image File")

def fetchAi(image):
    #send data to AI
    interaction = client.interactions.create(
        model = GEMINI_MODEL,
        input = [
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
        },
        extra_body={
            "generation_config": {
                "temperature": 0.0
            }
        }
    )

    # should never be raised, but safer to check
    if not (interaction.output_text): # type: ignore
        raise ValueError("no output text")
    return Deck.model_validate_json(interaction.output_text) # type: ignore

def checkForError(deck):
    goodCards = []
    badCards = []
    for card in deck.cards:
        if ((card.masu or card.dictionary) and not (card.masu and card.dictionary and card.japanese)):
            badCards.append(card)
        else:
            goodCards.append(card)
    return goodCards, badCards

def fixVerbAi(badCards):
    #send data to AI
    interaction = client.interactions.create(
        model = GEMINI_MODEL,
        input = [{
            "type": "text", 
            "text": "You are an expert Japanese linguist and data processor. Your task is to fix the missing or incorrect verb conjugations in the provided JSON array of flashcards. Apply the following strict rules to EVERY card:\n" +
                    "1. 'japanese' and 'masu' MUST both contain the exact same Japanese Masu-form of the verb (e.g., 食べます).\n" +
                    "2. 'dictionary' MUST contain the Japanese Dictionary-form of the verb (e.g., 食べる).\n" +
                    "3. 'translation': Keep the existing German translation verbatim unless it is objectively incorrect.\n" +
                    "4. 'details' and 'information': DO NOT modify these fields under any circumstances. Copy them exactly as provided.\n" +
                    "JSON data: " + Deck(cards=badCards).model_dump_json() # create json text for LLM
        }],
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": Deck.model_json_schema()
        },
        extra_body={
            "generation_config": {
                "temperature": 0.0
            }
        }
    )

    # should never be raised, but safer to check
    if not (interaction.output_text): # type: ignore
        raise ValueError("no output text")


    return Deck.model_validate_json(interaction.output_text) # type: ignore

def createDeck(deck):
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
                        fields=[card.japanese, card.translation, card.details or "", card.information or ""]
                )
            my_deck.add_note(my_note_masu)
            my_deck.add_note(my_note)
        # for normal verbs, only add the standard card
        else:
            my_note = genanki.Note(
                model=normal_vocabs,
                fields=[card.japanese, card.translation, card.details or "", card.information or ""]
            )
            my_deck.add_note(my_note)
        
    # output can be directly imported to Anki
    genanki.Package(my_deck).write_to_file('output.apkg')


if __name__ == "__main__":
    main()