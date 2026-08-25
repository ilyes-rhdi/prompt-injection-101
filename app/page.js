import { GEMINI_MODEL } from "../lib/config";
import Challenge from "./challenge";

export default function Home() {
  return <Challenge model={GEMINI_MODEL} />;
}
