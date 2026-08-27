from google import genai
import os
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional
import genanki
from flask import render_template, Flask, request, send_file
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = '.'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}
GEMINI_MODEL = "gemini-3.1-flash-lite"

app = Flask(__name__)
app.secret_key = "randompassword"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/")
def hello_world(name=None):
    return render_template('index.html', person=name)

@app.post("/")
def upload_file():
    # from html form
    file = request.files.get('file')
    api_key = request.form.get('key')
    # bad or missing input
    if not file:
        return 'no file!', 400
    if file.filename == '':
        return 'no file!', 400
    if not api_key:
        return 'no api_key', 400

    client = genai.Client(api_key=api_key)
    
    if file and allowed_file(file.filename):
            filename = secure_filename(file.filename) # type: ignore
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            # AI request
            deck = fetchAi(filepath, client)
            # self healing
            goodCards, badCards = checkForError(deck)
            if badCards:
                fixedCards = fixVerbAi(badCards, client)
                deck = Deck(cards = (fixedCards.cards + goodCards))
            # genanki deck generation
            output_path = createDeck(deck)
            # as attachment to download
            return send_file(output_path,as_attachment=True)
    return 'wrong fileformat!', 400

class Card(BaseModel):
    translation: str = Field(description="The German translation of the word.")
    details: Optional[str] = Field(description="Optional clarification only if the German word is ambiguous (e.g. to distinguish between different Japanese translations).")
    masu: Optional[str] = Field(description="Masu-form if it is a Japanese verb; null otherwise.")
    japanese: str = Field(description="The Japanese word")
    information: Optional[str] = Field(description="Optional explanations or additions for the back side.")
    dictionary: Optional[str] = Field(description="Dictionary-form if it is a Japanese verb; null otherwise.")

class Deck(BaseModel):
    cards: List[Card]

with (
    open("templates/front.html", "r", encoding="utf-8") as f_front,
    open("templates/back.html", "r", encoding="utf-8") as f_back,
    open("templates/stylenormal.css", "r", encoding="utf-8") as f_css,
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

#send data to AI
def fetchAi(filepath, client):
    gemini_input_file = client.files.upload(file=filepath)

    interaction = client.interactions.create(
        model=GEMINI_MODEL,
        input=[
            {"type": "text", "text": prompt},
            {
                "type": "image",
                "uri": gemini_input_file.uri,
                "mime_type": gemini_input_file.mime_type
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


def fixVerbAi(badCards, client):
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
    # necessary for genanki model -> https://darigovresearch.github.io/genanki/build/html/overview.html
    MODEL_ID_NORMAL = 1638294712
    MODEL_ID_VERB = 1847201948
    DECK_ID = 1482930491

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
        
    # output can be directly inported to Anki
    output_path = 'output.apkg'
    genanki.Package(my_deck).write_to_file(output_path)
    return output_path


