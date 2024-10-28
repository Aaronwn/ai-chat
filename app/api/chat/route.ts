import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 添加环境变量检查和日志
const apiKey = process.env.DEEPSEEK_API_KEY;
console.log('API Key exists:', !!apiKey);

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.deepseek.com/v1'
});

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY is not configured in environment');
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 }
      );
    }

    const { messages } = await req.json();
    console.log('Received messages:', messages.length);

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    try {
      console.log('Sending request to DeepSeek API...');

      // 使用 Promise.race 来实现超时控制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });

      const responsePromise = openai.chat.completions.create({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const response = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;
      console.log('Received response from DeepSeek API');

      if (!response.choices || response.choices.length === 0) {
        console.error('No choices in API response');
        return NextResponse.json(
          { error: 'No response from API' },
          { status: 500 }
        );
      }

      return NextResponse.json(response.choices[0].message);
    } catch (error: any) {
      if (error.message === 'Request timeout') {
        return NextResponse.json(
          { error: '请求超时，请稍后重试' },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    // 尝试解析错误响应
    let errorMessage = '发生未知错误';
    if (error.response) {
      try {
        const errorData = await error.response.text();
        errorMessage = `API 错误: ${errorData}`;
      } catch (e) {
        errorMessage = `API 错误: ${error.message}`;
      }
    } else {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: error.status || 500 }
    );
  }
}
