import { useState, useCallback } from 'react'
import { APIKeys } from '@/components/APIKeySettingsModal';
import { RowData } from '@/hooks/useCSVData';

export function useActionHandlers() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 })
  const [apiKeys, setApiKeys] = useState<APIKeys>(() => ({
    providers: [{ name: 'openai', bearerToken: '' }]
  }))

  const handleAction = useCallback(async (
    action: 'inference' | 'evaluate' | 'augment',
    data: RowData[],
    headers: string[],
    setData: React.Dispatch<React.SetStateAction<RowData[]>>,
    setHeaders: React.Dispatch<React.SetStateAction<string[]>>,
    setColumnWidths: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>,
    setColumnTypes: React.Dispatch<React.SetStateAction<{ [key: string]: { type: 'text' | 'dropdown', scoreRange?: number } }>>,
    systemPrompt?: string,
    userInput?: string,
    augmentationFactor?: number,
    augmentationPrompt?: string,
    selectedColumn?: string,
    evaluationSettings?: any,
    modelName?: string,
    hostUrl?: string,
    selectedProvider?: string
  ) => {
    console.log('Action request:', JSON.stringify({
      action,
      systemPrompt,
      userInput,
      augmentationFactor,
      augmentationPrompt,
      selectedColumn,
      evaluationSettings,
      apiKeys,
      ...(action === 'inference' ? { modelName } : {})
    }, null, 2));
    setIsLoading(true)
    setError(null)
    setProgress({ current: 0, total: data.length })
    
    try {
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid or empty data array')
      }

      if (action === 'augment' || action === 'evaluate') {
        const openaiProvider = apiKeys.providers.find(provider => provider.name === 'openai');
        if (!openaiProvider || !openaiProvider.bearerToken) {
          throw new Error("OpenAI API key is not provided");
        }
      }

      if (action === 'augment' && !headers.includes('is_augmented')) {
        setHeaders(prevHeaders => ['is_augmented', ...prevHeaders])
        setColumnWidths(prev => ({ is_augmented: 100, ...prev }))
        setColumnTypes(prev => ({ 
          is_augmented: { type: 'text' },
          ...prev 
        }))
      }

      const batchSize = 10;
      const totalItems = data.length;
      let processedItems = 0;
      const results: RowData[] = [];

      const processBatch = async (batch: RowData[]) => {
        try {
          const response = await fetch('/api/llm', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              action, 
              data: batch, 
              systemPrompt, 
              userInput,
              augmentationFactor, 
              augmentationPrompt,
              selectedColumn,
              evaluationSettings,
              apiKeys,
              modelName,
              hostUrl,
              selectedProvider,
            }),
          })

          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`API Error Response: ${response.status} ${response.statusText}`, errorBody);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
          }

          const result = await response.json()
          if (!result || !result.result || !Array.isArray(result.result)) {
            console.error('Invalid server response:', result);
            throw new Error('Invalid response from server')
          }

          const processedResult = result.result.map((item: any) => {
            if (action === 'augment' && item.is_augmented === undefined) {
              return { ...item, is_augmented: 'Yes' };
            }
            return item;
          });

          processedItems += batch.length;
          setProgress({ current: processedItems, total: totalItems })

          return processedResult;
        } catch (batchError) {
          console.error(`Error processing batch:`, batchError);
          return batch.map(item => ({ ...item, error: 'Error occurred during processing' }));
        }
      }

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchResults = await processBatch(batch);
        results.push(...batchResults);
      }

      if (action === 'augment') {
        const augmentedData = results.flatMap(item => {
          if (Array.isArray(item)) {
            return item.map(subItem => ({
              ...subItem,
              is_augmented: subItem.is_augmented || 'No'
            }));
          }
          return item;
        });
        setData(augmentedData);
      } else {
        setData(results);
      }

      // Handle column updates for different actions
      if (action === 'inference' && modelName) {
        const newColumnName = `${modelName}_assistant`;
        if (!headers.includes(newColumnName)) {
          const userInputIndex = headers.indexOf(userInput || '');
          if (userInputIndex !== -1) {
            setHeaders(prevHeaders => {
              const newHeaders = [...prevHeaders];
              newHeaders.splice(userInputIndex + 1, 0, newColumnName);
              return newHeaders;
            });
            setColumnWidths(prev => {
              const newWidths = { ...prev };
              const entries = Object.entries(newWidths);
              entries.splice(userInputIndex + 1, 0, [newColumnName, 200]);
              return Object.fromEntries(entries);
            });
            setColumnTypes(prev => {
              const newTypes = { ...prev };
              const entries = Object.entries(newTypes);
              entries.splice(userInputIndex + 1, 0, [newColumnName, { type: 'text' }]);
              return Object.fromEntries(entries);
            });
          } else {
            setHeaders(prevHeaders => [...prevHeaders, newColumnName]);
            setColumnWidths(prev => ({ ...prev, [newColumnName]: 200 }));
            setColumnTypes(prev => ({ ...prev, [newColumnName]: { type: 'text' } }));
          }
        }
        
        console.log(`Added new column: ${newColumnName}`);
      }
      
      if (action === 'evaluate') {
        if (!headers.includes('LLM_Eval 근거')) {
          const llmEvalIndex = headers.indexOf('LLM_Eval')
          const newHeaders = [...headers]
          newHeaders.splice(llmEvalIndex === -1 ? headers.length : llmEvalIndex, 0, 'LLM_Eval 근거')
          setHeaders(newHeaders)
          setColumnWidths(prev => ({ ...prev, 'LLM_Eval 근거': 300 }))
          setColumnTypes(prev => ({ ...prev, 'LLM_Eval 근거': { type: 'text' } }))
        }
        if (!headers.includes('LLM_Eval')) {
          setHeaders(prevHeaders => [...prevHeaders, 'LLM_Eval'])
          setColumnWidths(prev => ({ ...prev, LLM_Eval: 100 }))
          setColumnTypes(prev => ({ ...prev, LLM_Eval: { type: 'dropdown', scoreRange: 7 } }))
        }
      }

    } catch (error) {
      console.error('Error in handleAction:', error)
      setError(error instanceof Error ? error.message : 'An unknown error occurred')
      if (action === 'inference' && modelName) {
        const newColumnName = `${modelName}_assistant`;
        setData(prevData => prevData.map(row => ({ ...row, [newColumnName]: 'Error occurred during processing' })))
      }
    } finally {
      setIsLoading(false)
      setProgress({ current: 0, total: 0 })
    }
  }, [apiKeys])

  return {
    isLoading,
    error,
    progress,
    handleAction,
    apiKeys,
    setApiKeys
  } as const;
}

