import { NextResponse } from "next/server";

const FLAG = "Mchal{y0u_Byb4ss3d_M3}";

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
