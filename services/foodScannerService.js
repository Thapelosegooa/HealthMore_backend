
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function scanFood(imageBuffer, mimeType) {
  const base64Image = imageBuffer.toString("base64");

  const response = await groq.chat.completions.create({
    model: "qwen/qwen3.8-27b",

    messages: [
      {
        role: "system",
        content: `
          You are a food calorie estimation system.

          Analyze the food in the provided image.

          Identify all visible food items.
          Estimate their portion sizes.
          Estimate the total calories of the entire meal.

          Consider visible ingredients, cooking methods
          and portion sizes.

          Return ONLY valid JSON in this format:

          {
            "calories": 650
          }

          The calories value must be a whole number.

          Do not provide explanations.
          Do not provide descriptions.
          Do not provide nutritional advice.
          Do not include any conversational text.

          If the image does not contain identifiable food,
          return:
          {
            "calories": null
          }
        `
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Estimate the total calories in this meal."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          }
        ]
      }
    ],

    response_format: {
      type: "json_object"
    },

    temperature: 0.1,
    max_completion_tokens: 100
  });

  const result = JSON.parse(
    response.choices[0].message.content
  );

  if (
    result.calories !== null &&
    (!Number.isInteger(result.calories) ||
      result.calories < 0 ||
      result.calories > 10000)
  ) {
    throw new Error("Invalid calorie estimate");
  }

  return result.calories;
}

module.exports = { scanFood };
