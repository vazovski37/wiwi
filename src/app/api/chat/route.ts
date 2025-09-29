// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await model.generateContent(message);
    
    const response = result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}