# AI-Image-to-Anki (Client-Side React SPA)

Create anki decks based on Images, using Gemini API and `genanki-js`. 
**This branch features a 100% Serverless, Client-Side Architecture built with React.** The app runs entirely in your browser using JavaScript, WebAssembly (`sql.js`), and `zod` for AI response validation. No custom backend or Python required! It communicates directly with the Gemini REST API.

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

You can visit [my site](https://anki.utsghost.dev/) to try it out, or host it yourself:

1. **Clone the repository and switch branch:**
   ```bash
   git clone https://github.com/UTSGhost/AnkiGenerator
   cd AnkiGenerator
   git checkout serverless-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
    ```bash
    npm run dev
    ```

4. **Generate Cards:**
   Open the provided localhost URL in your browser (usually `http://localhost:5173`). 
   * Enter your Google Gemini API Key directly into the secure UI field (it remains in your browser and is never sent anywhere but Google).
   * Upload your vocabulary image.
   * The browser will process the AI response and download the generated `.apkg` file automatically.

The generated output.apkg can then be directly imported into Anki.

## Credits & Sources
Anki Theme / Formatting: Based on the awesome [HachiMoji Theme](https://ankiweb.net/shared/info/1367938531).
