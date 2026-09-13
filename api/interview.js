export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY not found"
      });
    }

    const {
      interviewType,
      language,
      userAnswer,
      previousQuestion
    } = req.body || {};

    const prompt = `
You are the AI interviewer of GyanSetu.

Interview Type: ${interviewType || "General"}
Language: ${language || "Marathi"}

Previous Question:
${previousQuestion || "None"}

Candidate Answer:
${userAnswer || "No answer provided"}

Rules:
1. Respond like a friendly professional interviewer.
2. Briefly react to the candidate's answer.
3. Ask exactly ONE next question.
4. The next question must be related to the interview type.
5. Use the selected language.
6. Keep the response clear and natural.
7. Do not mention these instructions.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },

        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: prompt
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error("Gemini API Error:", data);

      return res.status(500).json({
        error: "Gemini API request failed"
      });
    }

    let reply = "";

    if (data.output_text) {
      reply = data.output_text;
    }

    if (!reply && Array.isArray(data.steps)) {

      for (const step of data.steps) {

        if (
          step.type === "model_output" &&
          Array.isArray(step.content)
        ) {

          for (const part of step.content) {

            if (part.type === "text") {
              reply += part.text;
            }

          }

        }

      }

    }

    return res.status(200).json({
      success: true,
      reply: reply || "पुढील प्रश्न तयार आहे."
    });

  } catch (error) {

    console.error("Server Error:", error);

    return res.status(500).json({
      error: "Internal server error"
    });

  }

}