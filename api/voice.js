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
      text,
      languageCode = "mr-IN"
    } = req.body || {};

    if (!text) {
      return res.status(400).json({
        error: "Text is required"
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },

        body: JSON.stringify({

          model: "gemini-3.1-flash-tts-preview",

          input:
            `Speak naturally and clearly as a friendly professional AI interviewer.
             Use a warm conversational tone.
             Language: ${languageCode}.
             
             Text to speak:
             ${text}`,

          response_format: {
            type: "audio"
          },

          generation_config: {
            speech_config: [
              {
                voice: "Kore",
                language: languageCode
              }
            ]
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error(
        "Gemini TTS Error:",
        data
      );

      return res.status(500).json({
        error: "Gemini voice generation failed"
      });
    }

    return res.status(200).json({
      success: true,
      audio: data
    });

  } catch (error) {

    console.error(
      "Voice Server Error:",
      error
    );

    return res.status(500).json({
      error: "Internal server error"
    });
  }
} 