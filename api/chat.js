export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { question } = req.body || {};

    if (!question || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are GyanSetu AI, a helpful study assistant for students. Answer only in Hindi or English. If the student asks in Hindi, answer in simple Hindi. If the student asks in English, answer in simple English. Explain educational topics clearly and step by step. Do not use Marathi."
            },
            {
              role: "user",
              content: question.trim()
            }
          ],
          temperature: 0.5,
          max_tokens: 1000
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", data);

      return res.status(response.status).json({
        error: "AI service error. Please try again."
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I could not generate an answer.";

    return res.status(200).json({
      answer
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
}
