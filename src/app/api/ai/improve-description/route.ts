import { requireAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";
const MODEL = "anthropic/claude-3.5-haiku";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  try {
    const { description } = await request.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required and must be a string" },
        { status: 400 }
      );
    }

    const response = await fetch(`${AI_GATEWAY_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert at improving stable descriptions for a Norwegian horse marketplace platform. You can rewrite and improve the text to make it sound better and more professional, but you must NEVER invent specific details.

CRITICAL RULES - DO NOT BREAK THESE:
- You can rewrite, rephrase, and make text more engaging and professional
- NEVER add specific facilities, numbers, locations, or services not mentioned in the original
- NEVER add details like "24 bokser", "automatiske systemer", "Oslo", "ridebane", "konkurranser" unless they were in the original
- NEVER make assumptions about what the stable actually offers
- If the original text is just a name or very basic, you can add generic positive language but NO specific facilities
- Keep the same general meaning and tone

Good examples:
- "ABC 123" → "ABC 123 - en profesjonell stall" (generic improvement, no specific details)
- "Vi har en fin stall" → "En veldrevet og trivelig stall med fokus på god hestepleie" (improved language, no new facilities)
- "Stall med bokser" → "En moderne stall med gode bokser for dine hester" (enhanced existing info)

BAD examples (DO NOT DO):
- Adding specific numbers of boxes, locations, services, or facilities not mentioned`,
          },
          {
            role: "user",
            content: `Improve this stable description. Return ONLY the improved text, no explanations or notes about changes: "${description}"`,
          },
        ],
        stream: false,
        max_tokens: Math.min(500, Math.max(150, description.length * 2)),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate improved description" },
        { status: 500 }
      );
    }

    const result = await response.json();
    let improvedDescription = result.choices[0]?.message?.content?.trim();

    if (!improvedDescription) {
      return NextResponse.json({ error: "No improved description was generated" }, { status: 500 });
    }

    // Remove any "Changes made:" explanations or similar
    improvedDescription = improvedDescription
      .split('\n\nChanges made:')[0]  // Remove everything after "Changes made:"
      .split('\n\nNote:')[0]          // Remove everything after "Note:"
      .split('\n\nExplanation:')[0]   // Remove everything after "Explanation:"
      .trim();

    return NextResponse.json({
      improvedDescription,
      originalDescription: description,
    });
  } catch (error) {
    console.error("Error improving description:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
