# AI-Image-to-Anki (Fullstack Web-Server Version)

Create anki decks based on Images, using Gemini API and `genanki`. 
**This branch features a Fullstack Web Application using Vanilla JS & Flask.** The backend handles API communication securely (hiding the API key from the client) and generates the deck server-side before sending it to the user.

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

You have to ways to run this app:

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

## Credits & Sources
Anki Theme / Formatting: Based on the awesome [HachiMoji Theme](https://ankiweb.net/shared/info/1367938531).