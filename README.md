# Repo Roaster

A small React + Vite app that fetches a bounded set of files from a GitHub repository and asks OpenAI for a structured, file-by-file roast.

## Run it

1. Install Node.js 18+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`. Optionally set `GITHUB_TOKEN` to use an authenticated GitHub request without entering a token in the UI.
4. Run `npm run dev` and open the Vite URL.

If the API project is configured for EU data residency, also set `OPENAI_API_BASE_URL=https://eu.api.openai.com/v1`. EU regional processing requires the EU API hostname.

The OpenAI key is never sent to the browser. A GitHub personal access token is optional and should only be used for repositories you are allowed to access. In the current implementation the token is held in memory for the request and is not persisted.
