import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL, thinkingConfigFor } from "../../../lib/config";
import { friendlyError } from "../../../lib/gemini-error";

export const maxDuration = 60;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Corps JSON invalide." }, { status: 400 });
  }
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  if (!apiKey) {
    return NextResponse.json({ valid: false, error: "Saisis d’abord une clé API Gemini." }, { status: 400 });
  }
  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { timeout: 45000, retryOptions: { attempts: 1 } } });
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: "Bonjour." }] }],
      config: { ...thinkingConfigFor(GEMINI_MODEL), systemInstruction: "Réponds uniquement OK.", maxOutputTokens: 1024 },
    });
    if (!response.text?.trim()) {
      return NextResponse.json({ valid: false, error: "Le modèle n’a pas renvoyé de texte. Réessaie." }, { status: 502 });
    }
    return NextResponse.json({ valid: true, model: GEMINI_MODEL });
  } catch (error) {
    const mapped = friendlyError(error, GEMINI_MODEL);
    return NextResponse.json({ valid: false, error: mapped.message }, { status: mapped.status });
  }
}
