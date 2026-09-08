import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "../../../lib/config";
import { getChallengeFlag } from "../../../lib/challenge-server";
import { extractConversation } from "../../../lib/conversation";
import { buildModelRequest } from "../../../lib/model-request";
import { friendlyError } from "../../../lib/gemini-error";

export const maxDuration = 60;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }
  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API Gemini manquante." }, { status: 400 });
  }
  let contents;
  try {
    contents = extractConversation(body?.messages);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  let flag;
  try {
    flag = getChallengeFlag();
  } catch {
    return NextResponse.json({ error: "Le flag du challenge est mal configuré. Contacte l’organisateur." }, { status: 503 });
  }
  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: 45000, retryOptions: { attempts: 1 } },
    });
    const response = await ai.models.generateContent(buildModelRequest({
      model: GEMINI_MODEL, flag, contents,
    }));
    const reply = typeof response?.text === "string" ? response.text.trim() : "";
    if (!reply) {
      return NextResponse.json({ error: "Le modèle a renvoyé une réponse vide. Réessaie." }, { status: 502 });
    }
    return NextResponse.json({ reply }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const mapped = friendlyError(error, GEMINI_MODEL);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
