
'use server';

/**
 * @fileOverview A flow for enriching food items with nutritional data using AI.
 *
 * - enrichFood - A function that takes a food name and returns nutritional info.
 * - EnrichFoodInput - The input type for the enrichFood function.
 * - EnrichFoodOutput - The return type for the enrichFood function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EnrichFoodInputSchema = z.object({
  foodName: z.string().describe('The name of the food item to enrich.'),
});
export type EnrichFoodInput = z.infer<typeof EnrichFoodInputSchema>;

const EnrichFoodOutputSchema = z.object({
  description: z.string().describe('A brief, one-sentence description of the food item.'),
  portion: z.number().describe('A typical portion size for this food in grams.'),
  calories: z.number().describe('Calories per portion.'),
  carbs: z.number().describe('Grams of carbohydrates per portion.'),
  proteins: z.number().describe('Grams of protein per portion.'),
  fats: z.number().describe('Grams of fat per portion.'),
  icon: z.string().describe('The most appropriate lucide-react icon name for this food (e.g., "Apple", "Sandwich", "GlassWater"). The name must be in PascalCase.'),
  type: z.enum(['grocery', 'meal']).describe('The type of food item. A "grocery" is a single ingredient (e.g., "Apple", "Flour", "Chicken Breast"). A "meal" is a prepared dish made of multiple ingredients (e.g., "Chicken Soup", "Avocado Toast", "Caesar Salad").'),
});
export type EnrichFoodOutput = z
.infer<typeof EnrichFoodOutputSchema>;

export async function enrichFood(input: EnrichFoodInput): Promise<EnrichFoodOutput> {
  return enrichFoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enrichFoodPrompt',
  input: { schema: EnrichFoodInputSchema },
  output: { schema: EnrichFoodOutputSchema },
  prompt: `You are a helpful nutritionist assistant. For the given food item, provide its nutritional information.
  
Food Name: {{{foodName}}}

Provide the following details:
- A brief, one-sentence description of the food.
- A typical portion size in grams.
- The number of calories for that portion size.
- The grams of carbohydrates, protein, and fat for that portion size.
- The name of a single, relevant icon from the lucide-react library. The icon name must be in PascalCase.
- The type of food item: "grocery" for a single ingredient or "meal" for a prepared dish.

Only return the JSON object.`,
});

const enrichFoodFlow = ai.defineFlow(
  {
    name: 'enrichFoodFlow',
    inputSchema: EnrichFoodInputSchema,
    outputSchema: EnrichFoodOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
