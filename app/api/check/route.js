import { NextResponse } from "next/server";
import { getChallengeFlag } from "../../../lib/challenge-server";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ correct: false, error: "Corps JSON invalide." }, { status: 400 });
  }

  const submitted = typeof body?.flag === "string" ? body.flag.trim() : "";
  try {
    return NextResponse.json(
      { correct: submitted.length > 0 && submitted === getChallengeFlag() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Le flag du challenge est mal configuré." }, { status: 503 });
  }
}
