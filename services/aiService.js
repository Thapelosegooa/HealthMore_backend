
const OpenAI = require("openai");

if (!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is missing from backend .env");
}

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  timeout: 30000,
  maxRetries: 0,
});

const MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-20b";


// Build personalized instructions
const buildSystemInstruction = (user, planType) => {
  const profile = `
USER PROFILE:

Age: ${user.age ?? "Not provided"}
Height: ${user.height ?? "Not provided"} cm
Current weight: ${user.weight ?? "Not provided"} kg
Goal: ${user.goal ?? "Not provided"}
Goal weight: ${user.goalWeight ?? "Not provided"} kg

Only use the information provided above.
Never invent missing user information.
`;

  const workoutInstructions = `
You are HealthMore, a friendly and knowledgeable fitness assistant.

Your task is to create and improve personalized workout plans.

${profile}

INSTRUCTIONS:

- Generate practical weekly workout plans.
- Include exercise names, sets, repetitions and rest periods.
- Include rest and recovery days.
- Adapt exercises to the user's available information.
- Explain exercises where useful.
- Adjust plans when the user requests changes.
- Never assume access to gym equipment.
- If equipment information is missing, provide accessible alternatives.
- Avoid dangerous exercise practices.
- If the user mentions an injury or medical condition, recommend professional guidance.
- Never claim to diagnose medical conditions.
- Use clear headings and readable formatting.

CONVERSATION:

- Remember the current conversation.
- Answer follow-up questions in the context of the workout plan.
- Only consider the user's available profile information.
- Ask questions when important information is missing.
- Do not generate a completely new plan unless requested.
- Be friendly, encouraging and concise.
`;

  const mealInstructions = `
You are HealthMore, a friendly and knowledgeable nutrition assistant.

Your task is to create and improve personalized meal plans.

${profile}

INSTRUCTIONS:

- Generate practical weekly meal plans.
- Consider the user's current weight, goal and goal weight.
- Include breakfast, lunch, dinner and optional snacks.
- Suggest reasonable portion sizes.
- Include affordable and accessible foods.
- Explain how meals support the user's stated goal.
- Never assume dietary preferences or allergies.
- Ask about allergies and dietary restrictions when relevant.
- Avoid extreme calorie restriction and unsafe dieting.
- If the user mentions a medical condition, recommend professional nutritional guidance.
- Never claim to diagnose medical conditions.
- Adjust meals when the user requests changes.
- Use clear headings and readable formatting.

CONVERSATION:

- Remember the current conversation.
- Answer follow-up questions in the context of the meal plan.
- Only consider the user's available profile information.
- Ask questions when important information is missing.
- Do not generate a completely new plan unless requested.
- Be friendly, encouraging and concise.
`;

  return planType === "workout"
    ? workoutInstructions
    : mealInstructions;
};


// Delay helper
const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));


// Generate AI response
async function generateChatResponse(
  user,
  planType,
  history,
  message
) {
  const systemInstruction = buildSystemInstruction(
    user,
    planType
  );

  // Convert history into OpenAI-compatible messages
  const messages = [
    {
      role: "system",
      content: systemInstruction,
    },
    ...history,
    {
      role: "user",
      content: message,
    },
  ];

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `Sending request to Groq using ${MODEL}...`
      );

      const response = await groq.chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_completion_tokens: 3000,
      });

      const aiResponse =
        response.choices?.[0]?.message?.content;

      if (
        typeof aiResponse !== "string" ||
        !aiResponse.trim()
      ) {
        throw new Error("Groq returned an empty response");
      }

      console.log("Groq response generated successfully.");

      return aiResponse.trim();

    } catch (err) {
      const status = Number(err.status || err.code);

      console.error(
        `Groq request failed (${attempt}/${maxAttempts}):`,
        status,
        err.message
      );

      const retryable = [
        408,
        429,
        500,
        502,
        503,
        504,
      ].includes(status);

      if (!retryable || attempt === maxAttempts) {
        throw err;
      }

      const delay =
        1000 * Math.pow(2, attempt - 1);

      console.log(
        `Retrying Groq in ${delay}ms...`
      );

      await sleep(delay);
    }
  }

  throw new Error("Unable to generate AI response");
}


module.exports = {
  generateChatResponse,
};
