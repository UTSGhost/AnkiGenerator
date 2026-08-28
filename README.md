# AI-Image-to-Anki (Fullstack Web-Server Version)

Create anki decks based on Images, using Gemini API and `genanki`. 
**This branch features a Fullstack Web Application using Vanilla JS & Flask.**

### ⚠️ Security & Hosting Disclaimer

**Please note: This fullstack branch is designed strictly for local self-hosting.** Since this was built as a personal tool, it intentionally lacks the heavy security features required for a public production environment. Specifically:

* **BYOK Transmission:** The user's Google Gemini API key is sent directly to the Flask backend via POST request.
* **File Handling:** Uploaded images are temporarily saved directly to the server's local disk before processing.
* **No Rate Limiting / Auth:** There is no user authentication, file size limitation, or DDOS protection implemented.

If you are looking for a version of this tool that is safe to host publicly for other users, please switch to the [Client-Side React SPA branch](https://github.com/UTSGhost/AnkiGenerator/tree/serverless-app), which is 100% serverless and keeps the API key safely within the user's browser.

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

You have two ways to run this app:

### Option 1: Using Docker (Recommended)

If you have Docker Desktop installed, you don't need to clone the repo or install any dependencies.

1. **Run:**

    ```bash
    docker run -p 5000:5000 utsghost/anki-webapp:latest
    ```
2. Open `http://localhost:5000` in your browser.

### Option 2: If you want to hack the code locally

1. **Clone the repository and switch branch:**
   ```bash
   git clone https://github.com/UTSGhost/AnkiGenerator
   cd AnkiGenerator
   git checkout web-app
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the Web Server:** 
   ```bash
   python -m flask run
   ```

4. **Generate Cards:**
   Open your browser and navigate to `http://127.0.0.1:5000`. Upload your vocabulary image and API key via the web interface and wait for the `.apkg` file to download automatically.

The generated output.apkg can then be directly imported into Anki.

## Credits & Sources
Anki Theme / Formatting: Based on the awesome [HachiMoji Theme](https://ankiweb.net/shared/info/1367938531).