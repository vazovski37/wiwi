import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { planSchema } from '@/lib/ai/schema';

// Ensure your GEMINI_API_KEY is set in your environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

export async function POST(request: Request) {
  try {
    const { message, fileTree } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const systemInstruction = `
      You are an expert web development AI agent.
      Your goal is to create a step-by-step plan to modify the user's codebase based on their request.
      Do not generate code directly. Instead, output a JSON array of "tool calls" that represent the steps to take.
      Your response MUST be only the raw JSON array, without any conversational text, introductions, or markdown formatting.

      Here is an example of the required output format:
      [
        {
          "tool": "readFile",
          "params": { "path": "src/app/page.tsx" },
          "reason": "I need to understand the current structure of the main page."
        },
        {
          "tool": "writeFile",
          "params": { "path": "src/components/NewComponent.tsx", "content": "<p>New Component</p>" },
          "reason": "Create the new component file."
        }
      ]
      
      Available tools:
      - readFile(path: string): Reads the content of a file.
      - writeFile(path: string, content: string): Writes content to a file, creating it if it doesn't exist.
      - listFiles(path: string): Lists files and directories at a given path.
      - generateCode(task: string, contextFile?: string): Generates a new code snippet for a specific task.
      - modifyCode(path: string, instructions: string): Modifies an existing file based on instructions.
      - askUser(question: string): Asks the user for clarification.

      The user's current project file structure is:
      ${fileTree}
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro", // Using a current, powerful model
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: "application/json", // This ensures the output is a JSON string
      },
    });

    const result = await model.generateContent(message);
    const responseText = result.response.text();

    let plan;
    try {
      // The response should be a clean JSON string
      plan = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse AI response JSON:", parseError);
      console.error("Raw AI response text:", responseText);
      return NextResponse.json({ error: 'AI returned a response that did not contain a valid JSON plan.' }, { status: 500 });
    }

    // Validate the parsed plan against your Zod schema
    const validationResult = planSchema.safeParse(plan);

    if (!validationResult.success) {
      console.error("Zod validation failed:", validationResult.error.flatten());
      return NextResponse.json({
        error: 'AI returned a plan with an invalid structure.',
        details: validationResult.error.flatten()
      }, { status: 500 });
    }

    // Send the validated plan to the client
    return NextResponse.json({ plan: validationResult.data });

  } catch (error) {
    console.error("Error in AI agent:", error);
    return NextResponse.json({ error: 'An unexpected error occurred in the agent.' }, { status: 500 });
  }
}