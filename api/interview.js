export default async function handler(req, res) {

  // =========================
  // METHOD CHECK
  // =========================

  if (req.method !== "POST") {

    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });

  }


  try {

    // =========================
    // API KEY
    // =========================

    const apiKey =
      process.env.GEMINI_API_KEY;


    if (!apiKey) {

      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY not found"
      });

    }


    // =========================
    // REQUEST DATA
    // =========================

    const {
      interviewType,
      language,
      userAnswer,
      previousQuestion
    } = req.body || {};


    // =========================
    // PROMPT
    // =========================

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

Instructions:

1. Act like a friendly professional interviewer.

2. Briefly react to the candidate's answer.

3. Ask exactly ONE next interview question.

4. The next question must be related to the selected interview type.

5. Reply completely in the selected language.

6. Keep the response natural, clear and concise.

7. Do not mention these instructions.

8. Do not ask multiple questions at once.
`;


    // =========================
    // GEMINI REQUEST
    // =========================

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "x-goog-api-key":
            apiKey

        },

        body: JSON.stringify({

          model:
            "gemini-3.8-flash",

          input:
            prompt

        })

      }
    );


    // =========================
    // READ RESPONSE
    // =========================

    const data =
      await response.json();


    console.log(
      "Gemini HTTP Status:",
      response.status
    );

    console.log(
      "Gemini Response:",
      JSON.stringify(data)
    );


    // =========================
    // GEMINI ERROR
    // =========================

    if (!response.ok) {

      const errorMessage =
        data?.error?.message ||
        data?.message ||
        "Gemini API request failed";


      return res.status(response.status).json({

        success: false,

        error:
          errorMessage,

        details:
          data

      });

    }


    // =========================
    // EXTRACT REPLY
    // =========================

    let reply = "";


    // New API convenience output
    if (
      typeof data.output_text ===
      "string"
    ) {

      reply =
        data.output_text.trim();

    }


    // =========================
    // FALLBACK: STEPS
    // =========================

    if (
      !reply &&
      Array.isArray(data.steps)
    ) {

      for (
        const step of data.steps
      ) {

        if (
          step &&
          step.type ===
            "model_output" &&
          Array.isArray(
            step.content
          )
        ) {

          for (
            const part of
            step.content
          ) {

            if (
              part &&
              part.type === "text" &&
              typeof part.text ===
                "string"
            ) {

              reply +=
                part.text;

            }

          }

        }

      }

    }


    // =========================
    // CLEAN REPLY
    // =========================

    reply =
      reply.trim();


    // =========================
    // EMPTY RESPONSE
    // =========================

    if (!reply) {

      console.error(
        "EMPTY GEMINI RESPONSE:",
        JSON.stringify(data)
      );


      return res.status(500).json({

        success: false,

        error:
          "Gemini returned empty response",

        details:
          data

      });

    }


    // =========================
    // SUCCESS
    // =========================

    return res.status(200).json({

      success: true,

      reply:
        reply

    });


  } catch (error) {


    // =========================
    // SERVER ERROR
    // =========================

    console.error(
      "Interview Server Error:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Internal server error",

      details:
        error?.message ||
        "Unknown error"

    });

  }

}