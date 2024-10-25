import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: messages,
    });

    if (!response.choices || response.choices.length === 0) {
      return NextResponse.json({ error: 'No response from API' }, { status: 500 });
    }

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}
