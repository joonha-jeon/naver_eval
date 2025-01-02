interface APIResponse {
  status: {
    code: string;
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
    const row = data[0]
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

      const accessToken = await getAccessToken(clientId, clientSecret)
      
      try {
        const response = await fetch(`https://api.hyperclova.ai/v1/chat-completions/${modelName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(request_data)
        })
      
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`API Error Response: ${response.status} ${response.statusText}`, errorBody);
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
        }
      
        const result = await response.json() as APIResponse
        
        console.log('API Response:', JSON.stringify(result, null, 2))
      
        if (result?.status?.code === "20000" && result?.result?.message?.content) {
          row['assistant'] = result.result.message.content.trim()
        } else {
          console.error('Unexpected response structure:', result)
          throw new Error(`Unexpected response format: ${JSON.stringify(result)}`)
        }
      } catch (error) {
        console.error(`Error processing row:`, error)
        row['assistant'] = `Error occurred during inference: ${error instanceof Error ? error.message : String(error)}`
        throw error;
      }
    } catch (error) {
      console.error(`Error processing row:`, error)
      row['assistant'] = `Error occurred during inference: ${error instanceof Error ? error.message : String(error)}`
    }

    return [row]
  } catch (error) {
    console.error(`Error in run_inference:`, error)
    throw error
  }
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch('https://api.hyperclova.ai/v1/auth/token?existingToken=true', {
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status}`)
  }

  const data = await response.json()
  return data.result.accessToken
}

