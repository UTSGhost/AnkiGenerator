import * as z from "https://esm.sh/zod";

// zod schema for verification
const Card = z.object({ 
  translation: z.string(),
  details: z.string().optional(),
  masu: z.string().optional(),
  japanese: z.string(),
  information: z.string().optional(),
  dictionary: z.string().optional(),
});

const Deck = z.array(Card);

// TODO
const GEMINI_API_KEY = "API_KEY_HERE";

document.getElementById("upload-form").addEventListener("submit", displayLoad);

async function displayLoad(event){
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
        const b64 = await fileTob64(file);

        const json = await fetchAi(b64, file.type);
        
        console.log(json);




        /*
        // create blob for download
        const fileBlob = await response.blob();
        const url = window.URL.createObjectURL(fileBlob);

        // make temporary link for user to download file
        var a = document.createElement('a');
        a.href = url;
        a.download = "deck.apkg";
        document.body.appendChild(a);
        a.click();    
        a.remove();
        // free mem
        window.URL.revokeObjectURL(url)*/
    } catch (error) {
        // display error
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
            model: "gemini-3.6-flash",
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
                schema: { // same as Zod schema
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            translation: { type: "string" },
                            details: { type: "string" },
                            masu: { type: "string" },
                            japanese: { type: "string" },
                            information: { type: "string" },
                            dictionary: { type: "string" }
                        },
                        required: ["translation", "japanese"]
                    }
                }
            }
        })
    });
    const json = await response.json();
    // maybe not needed? else to unpack response to real JSON
    const jsonString = data.output || data.candidates[0].content.parts[0].text;
    //return array
    return JSON.parse(jsonString);
}

async function getPrompt() {
    const response = await fetch('prompt.txt');
    const promptText = await response.text();
    return promptText;
}

config = {
    locateFile: filename => `/js/sql/sql-wasm.wasm`
}

var SQL;
initSqlJs(config).then(function (sql) {
    //Create the database
    SQL = sql;
});

function createDeck(json){
    var deck = new Deck(1276438724672, "Self Imported");

    json.array.forEach(card => {
        
    });
}