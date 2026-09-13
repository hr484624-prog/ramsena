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
You are GyanSetu AI Interview Coach.

Interview Type:
${interviewType || "General"}

Language:
${language || "Marathi"}

Previous Question:
${previousQuestion || "None"}

Candidate Answer:
${userAnswer || "No answer provided"}

Rules:
1. Act like a friendly professional interviewer.
2. Briefly react to the candidate's answer.
3. Ask exactly ONE next interview question.
4. Keep the question related to the selected interview type.
5. Reply in the selected language.
6. Keep the response natural and concise.
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

    console.log("Gemini response:", data);

    if (!response.ok) {

      return res.status(response.status).json({
        error: "Gemini API request failed",
        details: data
      });

    }

    let reply = "";

    if (typeof data.output_text === "string") {
      reply = data.output_text.trim();
    }

    if (!reply && Array.isArray(data.steps)) {

      for (const step of data.steps) {

        if (
          step.type === "model_output" &&
          Array.isArray(step.content)
        ) {

          for (const part of step.content) {

            if (
              part.type === "text" &&
              typeof part.text === "string"
            ) {

              reply += part.text;
            }

          }

        }

      }

    }

    reply = reply.trim();

    if (!reply) {

      return res.status(500).json({
        error: "Gemini returned empty response",
        details: data
      });

    }

    return res.status(200).json({
      success: true,
      reply: reply
    });

  } catch (error) {

    console.error("Interview Server Error:", error);

    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });

  }

}