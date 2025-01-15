import { NextResponse } from 'next/server'
import { run_inference } from '@/app/utils/run_inference'
import { evaluate_llm } from '@/app/utils/evaluate_llm'
import { augment_data } from '@/app/utils/augment_data'
import { APIKeys } from '@/components/APIKeySettingsModal'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { action, data, systemPrompt, userInput, augmentationFactor, augmentationPrompt, selectedColumn, evaluationSettings, apiKeys, modelName, hostUrl, selectedProvider } = await request.json()

    console.log('API Route received request:', JSON.stringify({
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

    if (!action || !data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    if (!apiKeys || !apiKeys.providers) {
      return NextResponse.json({ error: 'API keys are not provided or invalid' }, { status: 400 })
    }

    let result
    try {
      switch (action) {
        case 'inference':
          result = await run_inference(
            data, 
            systemPrompt, 
            userInput, 
            apiKeys, 
            hostUrl, 
            modelName, 
            selectedProvider
          )
          break
        case 'evaluate':
          result = await evaluate_llm(data, evaluationSettings, apiKeys);
          break
        case 'augment':
          if (!augmentationFactor || !augmentationPrompt || !selectedColumn) {
            return NextResponse.json({ error: 'Missing augmentation parameters' }, { status: 400 });
          }
          result = await augment_data(data, augmentationFactor, augmentationPrompt, selectedColumn, apiKeys);
          break
        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }
    } catch (actionError) {
      console.error(`Error executing ${action}:`, actionError);
      return NextResponse.json({ 
        error: actionError instanceof Error ? actionError.message : 'An error occurred during processing',
        stack: actionError instanceof Error ? actionError.stack : undefined
      }, { status: 500 });
    }

    if (!result) {
      throw new Error('Operation failed')
    }

    console.log('API Route sending response:', JSON.stringify(result, null, 2));

    return NextResponse.json({ result })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal Server Error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

