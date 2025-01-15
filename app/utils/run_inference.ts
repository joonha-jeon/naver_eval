import axios from 'axios';

interface DataRow {
  [key: string]: string | undefined;
  assistant?: string;
}

interface RequestData {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

interface APIKeys {
  providers: Array<{
    name: string;
    bearerToken: string;
  }>;
}

interface CompletionResponse {
  choices?: Array<{
    message: {
      content: string;
    };
  }>;
  result?: {
    message: {
      content: string;
    };
  };
  usage?: {
    total_tokens: number;
    completion_tokens: number;
    prompt_tokens: number;
  };
}

async function executeChatCompletion(
  hostUrl: string,
  bearerToken: string,
  completionRequest: RequestData
): Promise<CompletionResponse> {
  try {
    console.log(`Sending request to: ${hostUrl}`);
    console.log('Request data:', JSON.stringify(completionRequest, null, 2));

    const response = await axios.post<CompletionResponse>(
      `${hostUrl}`,
      completionRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error:', error.message);
      console.error('Status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Request config:', error.config);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

export async function run_inference(
  data: DataRow[], 
  system_prompt: string, 
  user_input: string,
  apiKeys: APIKeys,
  hostUrl: string,
  modelName: string,
  selectedProvider: string
): Promise<DataRow[]> {
  if (!data || data.length === 0) {
    throw new Error("No data provided for inference")
  }
  if (!modelName) {
    throw new Error("Model name is not provided");
  }

  try {
    const provider = apiKeys.providers.find(p => p.name === selectedProvider);
    if (!provider) {
      throw new Error(`Selected provider "${selectedProvider}" not found`);
    }

    console.log('Using provider:', selectedProvider);
    console.log('Host URL:', hostUrl);
    console.log('Model name:', modelName);

    const processedData = await Promise.all(data.map(async (row) => {
      try {
        const system = system_prompt ? row[system_prompt] ?? "" : ""
        const text = user_input ? row[user_input] ?? "" : ""
        
        const request_data: RequestData = {
          model: modelName,
          messages: [{
            role: "system",
            content: system
          }, {
            role: "user",
            content: text
          }],
          max_tokens: 400,
          temperature: 0.5,
          top_p: 0.8,
          frequency_penalty: 0,
          presence_penalty: 0
        }

        console.log('Inference request:', JSON.stringify({
          modelName,
          system,
          text,
          request_data
        }, null, 2));

        const result = await executeChatCompletion(hostUrl, provider.bearerToken, request_data);
        
        console.log('API Response:', JSON.stringify(result, null, 2))
      
        if (result.choices && result.choices[0]?.message?.content) {
          row['assistant'] = result.choices[0].message.content.trim();
        } else if (result.result?.message?.content) {
          row['assistant'] = result.result.message.content.trim();
        } else {
          console.error('Unexpected response structure:', result);
          throw new Error(`Unexpected response format: ${JSON.stringify(result)}`);
        }

        return row;
      } catch (error) {
        console.error(`Error processing row:`, error);
        return { ...row, assistant: `Error occurred during inference: ${error instanceof Error ? error.message : String(error)}` };
      }
    }));

    return processedData;
  } catch (error) {
    console.error(`Error in run_inference:`, error);
    throw error;
  }
}

