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

    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    try {
      console.log('Sending request to DeepSeek API...');
      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        // 添加信号控制器
        signal: controller.signal as any,
      });
      console.log('Received response from DeepSeek API');

      clearTimeout(timeoutId);

      if (!response.choices || response.choices.length === 0) {
        console.error('No choices in API response');
        return NextResponse.json(
          { error: 'No response from API' },
          { status: 500 }
        );
      }

      return NextResponse.json(response.choices[0].message);
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error; // 重新抛出错误以便外层 catch 处理
    }
  } catch (error: any) {
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

    // 处理不同类型的错误
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: '请求超时，请稍后重试' },
        { status: 504 }
      );
    }

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
