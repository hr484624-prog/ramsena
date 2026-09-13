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
            `Speak naturally as a friendly professional AI interviewer.
Use a warm conversational tone.
Speak in ${languageCode}.

Text:
${text}`,

          response_format: {
            type: "audio",
            mime_type: "audio/wav"
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

      console.error("Gemini TTS Error:", data);

      return res.status(500).json({
        error: "Gemini voice generation failed",
        details: data
      });
    }

    const audio = data.output_audio;

    if (!audio || !audio.data) {

      console.error("No audio returned:", data);

      return res.status(500).json({
        error: "No audio returned by Gemini"
      });
    }

    const audioBuffer = Buffer.from(
      audio.data,
      "base64"
    );

    res.setHeader(
      "Content-Type",
      audio.mime_type || "audio/wav"
    );

    res.setHeader(
      "Content-Length",
      audioBuffer.length
    );

    return res.status(200).send(audioBuffer);

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