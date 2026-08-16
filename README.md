# AI-Image-to-Anki (JAMstack / Client-Side Version)

Create anki decks based on Images, using Gemini API and `genanki-js`. 
**This branch features a 100% Serverless Architecture.** The app runs entirely in your browser using JavaScript, WebAssembly (`sql.js`), and `zod` for AI response validation. No backend or Python required! It communicates directly with the Gemini REST API.

Currently built for DE -> JP (German to Japanese) including automatic Masu -> Dictionary Form cards for verbs, but can theoretically be adapted for any language.

## Preview
<table>
  <tr>
    <td align="center"><b>Web Interface Input</b></td>
    <td align="center"><b>Result in Anki</b></td>
  </tr>
  <tr>
    <td><img src="assets/preview1.png" width="400"></td>
    <td><img src="assets/preview2.png" width="400"></td>
  </tr>
</table>

## How to use
1. **Clone the repository and switch branch:**
   ```bash
   git clone https://github.com/UTSGhost/AnkiGenerator
   cd AnkiGenerator
   git checkout serverless-app
   ```

2. **Start a local development server:**
   Because this project uses ES6 Modules and WebAssembly, you cannot just double-click the `index.html` (due to browser CORS restrictions). Start a simple local server instead:
   * Using Python: `python -m http.server 5500`
   * Or using VS Code: Install the "Live Server" extension and click "Go Live".

3. **Generate Cards:**
   Open the application in your browser (e.g., [http://127.0.0.1:5500](http://127.0.0.1:5500)). 
   * Enter your Google Gemini API Key directly into the secure UI field (it remains in your browser and is never sent anywhere but Google).
   * Upload your vocabulary image.
   * The browser will process the AI response and download the generated `.apkg` file automatically.

## Credits & Sources
Anki Theme / Formatting: Based on the awesome [HachiMoji Theme](https://ankiweb.net/shared/info/1367938531).
