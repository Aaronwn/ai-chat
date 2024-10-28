import { OpenAI } from 'openai';

// 添加环境变量检查和日志
const apiKey = process.env.DEEPSEEK_API_KEY;
console.log('API Key exists:', !!apiKey);

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.deepseek.com/v1'
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const stream = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    // 创建一个新的 ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let buffer = ''; // 用于存储未完成的数据

        try {
          for await (const chunk of stream) {
            if (chunk.choices && chunk.choices[0]?.delta?.content) {
              const content = chunk.choices[0].delta.content;
              buffer += content;

              // 检查是否有完整的字符
              if (buffer.length > 0) {
                // 发送完整的字符
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                buffer = ''; // 清空缓冲区
              }
            }
          }

          // 处理剩余的缓冲区内容
          if (buffer.length > 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: buffer })}\n\n`));
          }

          controller.close();
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        }
      },
      cancel() {
        // 处理流被取消的情况
        console.log('Stream was canceled');
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: '服务器错误，请稍后重试',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

