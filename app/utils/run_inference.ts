import { ChatCompletionExecutor } from './chatCompletionExecutor'

interface APIResponse {
  status: {
    code: string;
    message: string;
  };
  result: {
    message: {
      content: string;
    };
  };
}

interface DataRow {
  [key: string]: string | undefined;
  assistant?: string;
}

interface RequestData {
  messages: Array<{
    role: string;
    content: string;
  }>;
  maxTokens: number;
  temperature: number;
  topK: number;
  topP: number;
  repeatPenalty: number;
  stopBefore: string[];
  includeAiFilters: boolean;
  seed: number;
}

export async function run_inference(
  data: DataRow[], 
  system_prompt: string, 
  user_input: string,
  clientId: string,
  clientSecret: string,
  modelName: string
): Promise<DataRow[]> {
  if (!data || data.length === 0) {
    throw new Error("No data provided for inference")
  }
  if (!modelName) {
    throw new Error("Model name is not provided");
  }

  try {
    const chatCompletionExecutor = new ChatCompletionExecutor(clientId, clientSecret);
    
    const processedData = await Promise.all(data.map(async (row) => {
      try {
        const system = system_prompt ? row[system_prompt] ?? "" : ""
        const text = user_input ? row[user_input] ?? "" : ""
        
        const request_data: RequestData = {
          messages: [{
            role: "system",
            content: system
          }, {
            role: "user",
            content: text
          }],
          maxTokens: 400,
          temperature: 0.5,
          topK: 0,
          topP: 0.8,
          repeatPenalty: 5.0,
          stopBefore: [],
          includeAiFilters: true,
          seed: 0
        }

        console.log('Inference request:', JSON.stringify({
          modelName,
          system,
          text,
          request_data
        }, null, 2));

        const result = await chatCompletionExecutor.execute(request_data);
        
        console.log('API Response:', JSON.stringify(result, null, 2))
      
        if (result?.result?.message?.content) {
          row['assistant'] = result.result.message.content.trim()
        } else {
          console.error('Unexpected response structure:', result)
          throw new Error(`Unexpected response format: ${JSON.stringify(result)}`)
        }

        return row;
      } catch (error) {
        console.error(`Error processing row:`, error)
        return { ...row, assistant: `Error occurred during inference: ${error instanceof Error ? error.message : String(error)}` }
      }
    }));

    return processedData;
  } catch (error) {
    console.error(`Error in run_inference:`, error)
    throw error
  }
}

