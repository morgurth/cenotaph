# The Cenotaph

An interactive fiction, local-AI terminal game. The Cenotaph is a web-based, serverless Alternate Reality Game (ARG) engine where players converse with the dying "Core Mind" of a dead planetary archive.

Powered entirely by **WebLLM** and **WebGPU**, the AI runs 100% locally in the player's browser. There are no API keys, no backend servers, and zero inference costs.

## Features

* **Local LLM Inference:** Uses `@mlc-ai/web-llm` to run models (like Llama-3-8B or Qwen-0.5B) directly on the user's GPU.
* **Progressive Web App (PWA):** Fully installable on desktops and mobile devices, with offline capabilities via Service Workers.
* **Generative Audio:** Dynamic, ominous ambient drone audio and terminal sound effects synthesized in real-time using the Web Audio API.
* **Retro CRT Aesthetic:** Custom CSS terminal interface with scanlines, phosphor glow, and screen-shake glitch effects.
* **Scripted Narrative Engine:** Hidden text triggers organically advance the state of the game, changing prompts, UI colors, and audio dynamically.
* **Archive Extraction:** Players can download a full `.txt` transcript of their session upon reaching the end state.
* **Security Through Obscurity:** Narrative prompts and transition keywords are Base64 encoded to deter casual source-code reading by players.

## Getting Started (Local Development)

Because this project uses ES Modules and Web Workers, it must be served over a local HTTP server (simply opening `index.html` as a file in your browser will not work).

1. Clone the repository.
2. Serve the directory using any local web server. For example:
   * **VS Code:** Install and run the "Live Server" extension.
   * **Python:** Run `python -m http.server 8000` in the directory.
   * **Node.js:** Run `npx serve .`
3. Open your browser to `http://localhost:8000` (or your respective port).

*Note: A modern, WebGPU-compatible browser (e.g., Google Chrome, Microsoft Edge) is required.*

## Customization (Building an ARG)

The Cenotaph is designed to be easily re-themed into a Cyberpunk hacking ARG or other interactive fiction.

To customize the narrative:
1. Open `app.js`.
2. Modify the `SYSTEM_PROMPT` and `STAGE_DIRECTIVES`. (Use `btoa("your text")` in a browser console to encode your new prompts in Base64).
3. Update the `emotionalKeywords` array to your desired trigger words (e.g., hacking commands like "sudo", "override").
4. Adjust CSS variables in `index.css` to change the terminal color scheme (e.g., swap the phosphor green for a neon pink or corporate cyan).

## Deployment

Because there is no backend or database, you can host this project completely for free on **GitHub Pages**, **Netlify**, or **Vercel**. 

* **HTTPS is strictly required** for WebGPU to function in production. 
* The `sw.js` (Service Worker) automatically caches files for fast, offline-capable load times. Update the `CACHE_NAME` in `sw.js` whenever you push new changes to force clients to update their local files.

## License

MIT License
