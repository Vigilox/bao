import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const ABACUSAI_API_KEY = process.env.ABACUSAI_API_KEY;
const ABACUSAI_API_URL = 'https://routellm.abacus.ai/v1/chat/completions';

// POST /api/design/suggestions - Generate AI design suggestions
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, context } = body; // type: 'colors', 'layout', 'typography'

    if (!type) {
      return NextResponse.json({ error: 'Suggestion type required' }, { status: 400 });
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'colors') {
      systemPrompt = `You are a professional color palette generator for designers. Generate harmonious color palettes in hex format.`;
      userPrompt = `Generate 3 different color palettes (5 colors each) for ${context || 'a modern design'}. For each palette, provide:
1. A descriptive name
2. Five hex colors that work well together
3. Brief usage suggestions (primary, accent, background, text, etc.)

Format your response as valid JSON:
{
  "palettes": [
    {
      "name": "Palette Name",
      "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
      "usage": {
        "primary": "#hex1",
        "accent": "#hex2",
        "background": "#hex3",
        "text": "#hex4",
        "secondary": "#hex5"
      },
      "description": "Brief description of when to use this palette"
    }
  ]
}`;
    } else if (type === 'layout') {
      systemPrompt = `You are a professional UI/UX designer specializing in layout composition.`;
      userPrompt = `Suggest 3 different layout compositions for ${context || 'a design project'}. For each layout, provide:
1. A descriptive name
2. Grid structure (rows and columns)
3. Element positions and sizes
4. Design principles used

Format your response as valid JSON:
{
  "layouts": [
    {
      "name": "Layout Name",
      "description": "Brief description",
      "grid": { "rows": 3, "cols": 3 },
      "elements": [
        {
          "type": "text|image|button|shape",
          "position": { "x": 0, "y": 0 },
          "size": { "width": 100, "height": 50 },
          "description": "What this element represents"
        }
      ],
      "principles": ["visual hierarchy", "balance", "etc"]
    }
  ]
}`;
    } else if (type === 'typography') {
      systemPrompt = `You are a typography expert helping designers choose font combinations.`;
      userPrompt = `Suggest 3 font pairings for ${context || 'a modern design'}. For each pairing, provide:
1. Heading font
2. Body font
3. Accent font (optional)
4. Usage guidelines

Format your response as valid JSON:
{
  "pairings": [
    {
      "name": "Pairing Name",
      "heading": "Font Name",
      "body": "Font Name",
      "accent": "Font Name",
      "sizes": {
        "h1": "48px",
        "h2": "36px",
        "h3": "24px",
        "body": "16px"
      },
      "description": "When to use this combination"
    }
  ]
}`;
    } else {
      return NextResponse.json({ error: 'Invalid suggestion type' }, { status: 400 });
    }

    // Call Abacus AI API
    const response = await fetch(ABACUSAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1106',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate suggestions');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Error generating design suggestions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
