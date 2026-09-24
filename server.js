import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 8787;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: "1mb" }));

function parseRepoUrl(input) {
  try {
    const url = new URL(input);
    if (url.hostname !== "github.com")
      throw new Error("Only public GitHub repository URLs are supported.");
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (!owner || !repo)
      throw new Error("That does not look like a GitHub repository URL.");
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch (error) {
    throw new Error(error.message || "Enter a valid GitHub URL.");
  }
}

async function github(pathname, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "repo-roaster",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com${pathname}`, {
    headers,
  });
  if (!response.ok)
    throw new Error(
      `GitHub returned ${response.status}. Check the URL or your access token.`
    );
  return response.json();
}

app.post("/api/roast", async (req, res) => {
  try {
    const { repoUrl, githubToken, roastingLevel = "brutal" } = req.body || {};
    const token = githubToken?.trim() || process.env.GITHUB_TOKEN;
    const levelGuidance = {
      gentle:
        "Be encouraging and diplomatic. Prioritize teachable suggestions over jokes.",
      constructive:
        "Be candid and constructive. Pair each criticism with a practical improvement and explain the reasoning.",
      brutal:
        "Act as a brutal senior developer focused on real sarcastic roasting: use dry wit, pointed comparisons, and clever technical punchlines to expose poor decisions. Be unfiltered, technically rigorous, and direct about consequences. Roast the code and its design choices, never the people; remain accurate and useful.",
    };
    if (!levelGuidance[roastingLevel])
      throw new Error("Choose one of the available roasting levels.");
    const { owner, repo } = parseRepoUrl(repoUrl || "");
    const tree = await github(
      `/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      token
    );
    const candidates = tree.tree.filter(
      (item) =>
        item.type === "blob" &&
        item.size < 60000 &&
        !/(lock|\.min\.|dist\/|build\/|node_modules\/)/i.test(item.path)
    );
    const files = candidates.slice(0, 12);
    if (!files.length)
      throw new Error("No readable source files found in that repository.");
    const fileContents = await Promise.all(
      files.map(async (file) => {
        const data = await github(
          `/repos/${owner}/${repo}/contents/${file.path}`,
          token
        );
        return {
          path: file.path,
          content: Buffer.from(data.content, "base64")
            .toString("utf8")
            .slice(0, 18000),
        };
      })
    );

    if (!process.env.OPENAI_API_KEY)
      throw new Error(
        "OPENAI_API_KEY is missing on the server. Add it to .env and restart."
      );
    const prompt = `You are reviewing a public GitHub repository at the "${roastingLevel}" roasting level. ${
      levelGuidance[roastingLevel]
    } Make the difference obvious in every file comment: Gentle reviewer comments must sound supportive and explain improvements; Constructive critic comments must be candid, specific, and solution-oriented; Brutal senior developer comments must use real sarcasm, dry wit, vivid analogies, and pointed technical punchlines while explicitly explaining consequences. Roast the code and design choices, never the people. Do not invent issues. Only discuss evidence in the files. Return ONLY valid JSON matching this shape: {"summary":"short verdict","debtLevel":7,"files":[{"path":"src/x.js","comment":"file-specific roast","severity":"high|medium|low"}],"verdict":"one punchy closing line"}. debtLevel is an integer 1-10. Review these files from ${owner}/${repo}:\n\n${fileContents
      .map((file) => `--- ${file.path} ---\n${file.content}`)
      .join("\n")}`;
    const openaiBaseUrl = (
      process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1"
    ).replace(/\/$/, "");
    const response = await fetch(`${openaiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a sharp code reviewer." },
          { role: "user", content: prompt },
        ],
      }),
    });
    const responseText = await response.text();
    let completion;
    try {
      completion = JSON.parse(responseText);
    } catch {
      completion = {};
    }
    if (!response.ok) {
      const apiError = completion.error || {};
      const detail = apiError.message || responseText.slice(0, 240);
      const code = apiError.code ? ` [${apiError.code}]` : "";
      throw new Error(`OpenAI returned ${response.status}${code}: ${detail}`);
    }
    const roast = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
    res.json({
      repo: `${owner}/${repo}`,
      filesReviewed: files.length,
      roastingLevel,
      roast,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "Roast failed." });
  }
});

if (process.env.NODE_ENV === "production")
  app.use(express.static(path.join(__dirname, "dist")));
app.listen(port, () =>
  console.log(`Repo Roaster listening on http://localhost:${port}`)
);
