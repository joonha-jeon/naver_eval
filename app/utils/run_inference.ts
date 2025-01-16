import axios, { AxiosError } from 'axios';

interface DataRow {
  [key: string]: string | undefined;
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
    const axiosInstance = axios.create({
      timeout: 60000, // Increase timeout to 60 seconds
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearerToken}`
      }
    });

    console.log(`Sending request to: ${hostUrl}`);
    console.log('Request data:', JSON.stringify(completionRequest, null, 2));

    const response = await axiosInstance.post<CompletionResponse>(
      hostUrl,
      completionRequest
    );

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error('Error in API call:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Axios error:', axiosError.message);
      console.error('Status:', axiosError.response?.status);
      console.error('Response data:', axiosError.response?.data);
      console.error('Request config:', axiosError.config);
      
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('API request timed out. Please check your network connection and try again.');
      }
      
      if (axiosError.response) {
        throw new Error(`API error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`);
      } else if (axiosError.request) {
        throw new Error('No response received from API. Please check your network connection and API endpoint.');
      }
    }
    throw new Error(`Error occurred during inference: ${error instanceof Error ? error.message : String(error)}`);
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

    const processedData = await Promise.all(data.map(async (row, index) => {
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

        console.log(`Processing row ${index + 1}/${data.length}`);
        console.log('Inference request:', JSON.stringify({
          modelName,
          system,
          text,
          request_data
        }, null, 2));

        const result = await executeChatCompletion(hostUrl, provider.bearerToken, request_data);
        
        console.log('API Response:', JSON.stringify(result, null, 2))
      
        const newColumnName = `${modelName}_assistant`;
        if (result.choices && result.choices[0]?.message?.content) {
          row[newColumnName] = result.choices[0].message.content.trim();
        } else if (result.result?.message?.content) {
          row[newColumnName] = result.result.message.content.trim();
        } else {
          console.error('Unexpected response structure:', result);
          throw new Error(`Unexpected response format: ${JSON.stringify(result)}`);
        }
        console.log(`Added inference result to column: ${newColumnName}`);

        return row;
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
        const newColumnName = `${modelName}_assistant`;
        return { ...row, [newColumnName]: `Error occurred during inference: ${error instanceof Error ? error.message : String(error)}` };
      }
    }));

    return processedData;
  } catch (error) {
    console.error(`Error in run_inference:`, error);
    throw error;
  }
}

