import { z } from "zod";

// Define the schema for a single tool call
export const toolCallSchema = z.object({
  tool: z.enum([
    "readFile", 
    "writeFile", 
    "listFiles", 
    "generateCode", 
    "modifyCode",
    "askUser"
  ]),
  params: z.record(z.any()),
  reason: z.string().describe("The AI's reasoning for why this step is necessary."),
});

// Define the schema for the overall plan, which is an array of tool calls
export const planSchema = z.array(toolCallSchema);

// Type definition inferred from the schema
export type Plan = z.infer<typeof planSchema>;
export type ToolCall = z.infer<typeof toolCallSchema>;
