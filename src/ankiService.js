import * as z from "zod";

let GEMINI_API_KEY = "APIKEYHERE";
const GEMINI_MODEL = "gemini-3.1-flash-lite"; //change to your preferred model

const MODEL_ID_NORMAL = 1638294712
const MODEL_ID_VERB = 1847201948
const DECK_ID = 1482930491

import front_html from "./flashcards/front.html?raw";
import back_html from "./flashcards/back.html?raw";
import css_code from "./flashcards/stylenormal.css?raw";
import frontv_html from "./flashcards/frontverb.html?raw";
import backv_html from "./flashcards/backverb.html?raw";
import cssv_code from "./flashcards/stylev.css?raw";
import promptText from "./prompt.txt?raw";

// zod schema for verification
const ZodCard = z.object({ 
  translation: z.string(),
  details: z.string().optional(),
  masu: z.string().optional(),
  japanese: z.string(),
  information: z.string().optional(),
  dictionary: z.string().optional(),
});

const ZodDeck = z.array(ZodCard);

// setup for genanki js
window.SQL = null;
export function initSql() {
    return initSqlJs({ locateFile: filename => `/js/sql/sql-wasm.wasm` })
        .then(sql => { window.SQL = sql; });
}

// schemas for genanki js
const normal_vocabs = new Model({
    name: "Normal Model",
    id: MODEL_ID_NORMAL,
    flds: [
        { name: "Japanese" },
        { name: "Translation" },
        { name: "Translation Details" },
        { name: "Information" }
    ],
    tmpls: [
        {
            name: "DE → JP",
            qfmt: front_html,
            afmt: back_html
        }
    ],
    req: [
        [0, "all", [0]]
    ],
    css: css_code
});

const verbs = new Model({
    name: "Verb Model",
    id: MODEL_ID_VERB,
    flds: [
        {name: 'Masu Form'},
        {name: 'Dictionary Form'},
        {name: 'Translation'},
        {name: 'Translation Details'},
        {name: 'Information'},
    ],
    tmpls: [
        {
            name: "Masu → Dictionary",
            qfmt: frontv_html,
            afmt: backv_html
        }
    ],
    req: [
        [0, "all", [0]]
    ],
    css: cssv_code
});

export async function fileTob64(file){
    // so onloaded works with async await
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        // we need the file in b64 to pass it to Gemini
        reader.onloadend = function () {
            try {
                // this is the file in b64, source: https://base64.guru/developers/javascript/examples/encode-form-file
                var b64 = reader.result.replace(/^data:.+;base64,/, '');
                resolve(b64);
            } catch (error) {
                reject(error);
            }
        };  
        // if reader somehow breaks
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    })
}

/**
 * Uses Gemini API to return an array of Anki cards based on image provided
 * 
 * @param {string} b64 The image encoded in base64 format.
 * @param {string} type The MIME type of the image
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of structured Anki card objects.
 * @throws {Error} Throws an error if the API cannot be reached or the response is empty.
 */
export async function fetchAi(b64, type, apiKey){
    // send request to Gemini API via REST
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: GEMINI_MODEL,
            input: [
                {
                    type: "text", 
                    text: promptText
                },
                {
                    type: "image",
                    data: b64,
                    mime_type: type
                }
            ],
            response_format: { 
                type: "text",
                mime_type: "application/json",
                schema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            translation: { 
                                type: "string", 
                                description: "The German translation of the word." 
                            },
                            details: { 
                                type: "string", 
                                description: "Optional clarification only if the German word is ambiguous (e.g. to distinguish between different Japanese translations)." 
                            },
                            masu: { 
                                type: "string", 
                                description: "Masu-form if it is a Japanese verb; null otherwise." 
                            },
                            japanese: { 
                                type: "string", 
                                description: "The Japanese word" 
                            },
                            information: { 
                                type: "string", 
                                description: "Optional explanations or additions for the back side." 
                            },
                            dictionary: { 
                                type: "string", 
                                description: "Dictionary-form if it is a Japanese verb; null otherwise." 
                            }
                        },
                        required: ["translation", "japanese"]
                    }
                }
            },
            generation_config: {
                temperature: 0
            }
        })
    });
    const json = await response.json();
    // some API error
    if (!response.ok) {
        console.error("GOOGLE API ERROR:", JSON.stringify(json, null, 2));
        throw new Error(response.error?.message || "Unknown API-Error");
    }
    // weird way to extract important data from response because nothing else works
    let jsonString = null;
    if (json.steps) {
        for (const step of json.steps) {
            if (step.content) {
                for (const part of step.content) {
                    if (part.text) {
                        jsonString = part.text;
                    }
                }
            }
        }
    }
    // fallback
    if (!jsonString) {
        jsonString = json.output_text;
    }
    // empty response
    if (!jsonString) {
        throw new Error("No API response");
    }
    return JSON.parse(jsonString);
}

export function checkForAiError(json){
    let response = {
        badCards: [],
        goodCards: []
    }

    json.forEach(card => {
        if((card.masu || card.dictionary) && !(card.masu && card.dictionary && card.japanese)){
            // if its a verb but one of the three fields is missing
            response.badCards.push(card);
        } else {
            response.goodCards.push(card)
        }
    });
    return response;
}

export async function fixAiCards(badCards, apiKey){
    // send request to Gemini API via REST
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
            "x-goog-api-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: GEMINI_MODEL,
            input: [
                {
                    type: "text", 
                    text:   "You are an expert Japanese linguist and data processor. Your task is to fix the missing or incorrect verb conjugations in the provided JSON array of flashcards. Apply the following strict rules to EVERY card:\n" +
                            "1. 'japanese' and 'masu' MUST both contain the exact same Japanese Masu-form of the verb (e.g., 食べます).\n" +
                            "2. 'dictionary' MUST contain the Japanese Dictionary-form of the verb (e.g., 食べる).\n" +
                            "3. 'translation': Keep the existing German translation verbatim unless it is objectively incorrect.\n" +
                            "4. 'details' and 'information': DO NOT modify these fields under any circumstances. Copy them exactly as provided.\n" +
                            "JSON data: " + JSON.stringify(badCards)
                }
            ],
            response_format: { 
                type: "text",
                mime_type: "application/json",
                schema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            translation: { 
                                type: "string", 
                                description: "The German translation of the word." 
                            },
                            details: { 
                                type: "string", 
                                description: "Optional clarification only if the German word is ambiguous (e.g. to distinguish between different Japanese translations)." 
                            },
                            masu: { 
                                type: "string", 
                                description: "Masu-form if it is a Japanese verb; null otherwise." 
                            },
                            japanese: { 
                                type: "string", 
                                description: "The Japanese word" 
                            },
                            information: { 
                                type: "string", 
                                description: "Optional explanations or additions for the back side." 
                            },
                            dictionary: { 
                                type: "string", 
                                description: "Dictionary-form if it is a Japanese verb; null otherwise." 
                            }
                        },
                        required: ["translation", "japanese"]
                    }
                }
            },
            generation_config: {
                temperature: 0
            }
        })
    });
    const json = await response.json();
    // some API error
    if (!response.ok) {
        console.error("GOOGLE API ERROR ON SECOND CALL:", JSON.stringify(json, null, 2));
        throw new Error(response.error?.message || "Unknown API-Error on second call");
    }
    // weird way to extract important data from response because nothing else works
    let jsonString = null;
    if (json.steps) {
        for (const step of json.steps) {
            if (step.content) {
                for (const part of step.content) {
                    if (part.text) {
                        jsonString = part.text;
                    }
                }
            }
        }
    }
    // fallback
    if (!jsonString) {
        jsonString = json.output_text;
    }
    // empty response
    if (!jsonString) {
        throw new Error("No API response on second call");
    }
    return JSON.parse(jsonString);
}


export function createDeck(cardsArray){
    var deck = new Deck(DECK_ID, "Self Imported");
    const validData = ZodDeck.parse(cardsArray);

    validData.forEach(card => {

        const safe = (val) => (val && val !== "null") ? String(val) : "";

        const japanese = safe(card.japanese);
        const translation = safe(card.translation);
        const details = safe(card.details);
        const information = safe(card.information);
        const masu = safe(card.masu);
        const dictionary = safe(card.dictionary);

        if (!masu){
            deck.addNote(normal_vocabs.note([japanese, translation, details, information]));
        } else {
            deck.addNote(normal_vocabs.note([japanese, translation, details, information]));
            deck.addNote(verbs.note([masu, dictionary, translation, details, information]));
        }
    });

    var pkg = new Package();
    pkg.addDeck(deck);

    pkg.writeToFile('deck.apkg');
}