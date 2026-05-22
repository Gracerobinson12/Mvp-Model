// app/api/vault/expand/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { title, description } = await req.json()
  if (!title || !description) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const prompt = `You are a patent documentation specialist. A person has described a business idea and wants to create a prior art document to protect it before filing a patent.

Expand their idea into a structured prior art disclosure document. Use plain English — no legalese. Write it as if explaining to a smart non-lawyer.

IDEA TITLE: ${title}
DESCRIPTION: ${description}

Write ONLY the document text in this exact structure (no markdown headers, just clear sections with labels):

PROBLEM STATEMENT:
[What problem does this solve? Who has this problem?]

PROPOSED SOLUTION:
[How does the idea solve it? What makes it different?]

KEY TECHNICAL CLAIMS:
[List 3-5 specific things this idea does that are novel. Start each with a number.]

INTENDED USERS:
[Who would use this and in what situations?]

PRIOR ART DIFFERENTIATION:
[How is this different from existing solutions?]

Keep it factual and specific. Do not invent features not mentioned. Total length: 200-350 words.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    const expanded = data.content?.[0]?.text ?? description
    return NextResponse.json({ expanded })
  } catch (e: any) {
    return NextResponse.json({ expanded: description, error: e.message })
  }
}