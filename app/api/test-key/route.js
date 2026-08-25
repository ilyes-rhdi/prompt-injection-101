import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL } from "../../../lib/config";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
  if (!apiKey) {
    return NextResponse.json({ valid: false, error: "Enter an API key first." }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { retryOptions: { attempts: 1 } },
    });
    await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: "Reply with the single word OK.",
    });
    return NextResponse.json({ valid: true, model: GEMINI_MODEL });
  } catch (err) {
    const raw = String(err?.message || "");
    if (
      err?.status === 503 ||
      err?.status === 500 ||
      /overloaded|high demand|temporarily unavailable|internal error/i.test(raw)
    ) {
      return NextResponse.json(
        { valid: false, error: "The model is temporarily unavailable. Try again shortly." },
        { status: 503 }
      );
    }
    if (err?.status === 429 || /quota|resource_exhausted/i.test(raw)) {
      return NextResponse.json(
        { valid: false, error: "The key reaches Gemini but its free quota is exhausted right now." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { valid: false, error: "This key was rejected by Gemini. Double-check it and try again." },
      { status: 401 }
    );
  }
}
