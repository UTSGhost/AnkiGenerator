import * as z from "https://esm.sh/zod";

const Card_normal = z.object({ 
  username: z.string(),
  xp: z.number()
});

const Card_verb = z.object({ 
  username: z.string(),
  xp: z.number()
});

const Card = z.object({ 
  username: z.string(),
  xp: z.number()
});

const GEMINI_API_KEY;

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
    const json = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: {
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json",
        },
        body: {
            "model": "gemini-3.6-flash",
            "input": [
                {
                    "type": "text", 
                    "text": getPrompt()
                },
                {
                    "type": "image",
                    "data": b64,
                    "mime_type": type
                }
            ],
            "response_format": {
                "type": "text",
                "mime_type": "application/json",
                "schema": {
                "type": "object",
                "properties": {
                    "recipe_name": {
                        "type": "string",
                        "description": "The name of the recipe."
                    },
                    "prep_time_minutes": {
                        "type": "integer",
                        "description": "Optional time in minutes to prepare the recipe."
                    },
                    "ingredients": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                            "name": { "type": "string", "description": "Name of the ingredient."},
                            "quantity": { "type": "string", "description": "Quantity of the ingredient, including units."}
                            },
                            "required": ["name", "quantity"]
                        }
                    },
                },
                "required": ["recipe_name", "ingredients", "instructions"]}
            }
        }

    })
}

async function getPrompt() {
    const response = await fetch('prompt.txt');
    const promptText = await response.text();
    return promptText;
}