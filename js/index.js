import * as z from "https://esm.sh/zod";

const GEMINI_API_KEY = "API-KEY-HERE";

const MODEL_ID_NORMAL = 1638294712
const MODEL_ID_VERB = 1847201948
const DECK_ID = 1482930491

const front_html = await (await fetch("../flashcards/front.html")).text();
const back_html = await (await fetch("../flashcards/back.html")).text();
const css_code = await (await fetch("../flashcards/stylenormal.css")).text();
const frontv_html = await (await fetch("../flashcards/frontverb.html")).text();
const backv_html = await (await fetch("../flashcards/backverb.html")).text();
const cssv_code = await (await fetch("../flashcards/stylev.css")).text();

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
const config = {
    locateFile: filename => `js/sql/sql-wasm.wasm`
}

let resolveSqlReady;
const sqlReady = new Promise((resolve) => {
    resolveSqlReady = resolve;
});

window.SQL = null;
initSqlJs(config).then(function (sql) {
    SQL = sql;
    resolveSqlReady(); 
});

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


document.getElementById("upload-form").addEventListener("submit", uploadFile);

async function uploadFile(event){
    // prevents POST request to flask directly
    event.preventDefault();
    // activate loader
    document.getElementById("loader").style.display = "block";
    // delete any previous error messages
    document.getElementById("error").innerHTML = "";
    // formData is the form element
    const formData = new FormData(event.target);
    const file = formData.get("file");
    
    try {
        await sqlReady;

        const b64 = await fileTob64(file);

        const json = await fetchAi(b64, file.type);
        console.log(json)

        const validData = ZodDeck.parse(json);
        console.log(validData)

        createDeck(validData);
        console.log("Deck erfolgreich erstellt!", validData);
    } catch (error) {
        // display error
        console.error("Error:", error);
        document.getElementById("error").innerHTML = error;
    } finally {
        document.getElementById("loader").style.display = "none";
    }
}

async function fileTob64(file){
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

async function fetchAi(b64, type){
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gemini-3.5-flash-lite",
            input: [
                {
                    type: "text", 
                    text: await getPrompt()
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
            }
        })
    });

    const json = await response.json();

    if (!response.ok) {
        console.error("GOOGLE API ERROR:", JSON.stringify(json, null, 2));
        throw new Error(response.error?.message || "Unknown API-Errro");
    }
    // weird way because thats Gemini API with REST for you
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
    // still empty response
    if (!jsonString) {
        throw new Error("No API response");
    }
    //return array
    return JSON.parse(jsonString);
}

async function getPrompt() {
    const response = await fetch('prompt.txt');
    const promptText = await response.text();
    return promptText;
}


function createDeck(cardsArray){
    var deck = new Deck(DECK_ID, "Self Imported");

    cardsArray.forEach(card => {

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