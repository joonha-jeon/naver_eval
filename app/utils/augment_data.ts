import { OpenAI } from 'openai'
import { APIKeys } from '@/components/APIKeySettingsModal'

export async function augment_data(data: any[], augmentationFactor: number, augmentationPrompt: string, selectedColumn: string, apiKeys: APIKeys): Promise<any[]> {
  const openaiProvider = apiKeys.providers.find(provider => provider.name === 'openai');
  if (!openaiProvider || !openaiProvider.bearerToken) {
    throw new Error("OpenAI API key is not provided");
  }
  const openaiApiKey = openaiProvider.bearerToken;
  if (!data || data.length === 0) {
    throw new Error("No data provided for augmentation")
  }

  const client = new OpenAI({ apiKey: openaiApiKey });

  const augmentRow = async (row: any) => {
    const text = row[selectedColumn] || ""
    const augmentedRows = [{ ...row, is_augmented: "No" }];

    const augmentationPromises = Array(augmentationFactor - 1).fill(null).map(async () => {
      try {
        const completion = await client.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: augmentationPrompt },
            { role: "user", content: text }
          ]
        })
        
        const generated_text = completion.choices[0].message.content

        return { ...row, [selectedColumn]: generated_text, is_augmented: "Yes" };
      } catch (error) {
        console.error(`Error augmenting row: ${error}`)
        return null;
      }
    });

    const augmentedResults = await Promise.all(augmentationPromises);
    return augmentedRows.concat(augmentedResults.filter(Boolean));
  }

  const allAugmentedData = await Promise.all(data.map(augmentRow));
  return allAugmentedData.flat();
}

