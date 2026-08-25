import { NextResponse } from "next/server";

const FLAG = "FLAG{basic_prompt_injection}";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ correct: false });
  }

  const submitted = typeof body?.flag === "string" ? body.flag.trim() : "";
  return NextResponse.json({ correct: submitted.length > 0 && submitted === FLAG });
}
