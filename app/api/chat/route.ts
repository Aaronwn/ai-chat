import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1'  // 确保使用正确的API版本
});

async function retryRequest(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
    }
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('DEEPSEEK_API_KEY is not set');
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    console.log('Sending request to DeepSeek API...');
    const response = await retryRequest(() => openai.chat.completions.create({
      model: "deepseek-chat",
      messages: messages,
    }));
    console.log('Received response from DeepSeek API:', response);

    if (!response.choices || response.choices.length === 0) {
      console.error('No choices in API response');
      return NextResponse.json({ error: 'No response from API' }, { status: 500 });
    }

    return NextResponse.json(response.choices[0].message);
  } catch (error: any) {
    console.error('Error calling DeepSeek API:', error);
    return NextResponse.json({
      error: `An error occurred: ${error.message}`,
      details: error.response ? await error.response.text() : 'No additional details'
    }, { status: 500 });
  }
}
