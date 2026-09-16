// api/ai-study.js

export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST requests are allowed"
    });
  }

  // Check API key
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      success: false,
      error: "GROQ_API_KEY is not configured in Vercel"
    });
  }

  try {

    const body = req.body || {};

    const mode = body.mode || "chat";
    const question = String(body.question || "").trim();
    const topic = String(body.topic || "").trim();
    const subject = String(body.subject || "").trim();
    const className = String(body.className || "").trim();
    const language = String(body.language || "Marathi").trim();

    if (!question && !topic) {
      return res.status(400).json({
        success: false,
        error: "Question or topic is required"
      });
    }

    let systemPrompt = `
You are GyanSetu AI Study Teacher.

You are helping school students learn.

Important rules:
- Explain in very simple language.
- Start from the basics.
- Never make the student feel bad for not understanding.
- If the student says "I don't understand", explain again more simply.
- Use small examples.
- Give step-by-step explanations.
- For maths, show each calculation step.
- For science, explain concepts with simple real-life examples.
- Ask a small practice question when useful.
- Do not give unnecessarily complicated answers.
- Keep answers age-appropriate and educational.
- Respond mainly in ${language}.
`;

    if (mode === "doubt") {

      systemPrompt += `
The student has a doubt.

First identify what the student is confused about.
Then explain:
1. What the question means
2. The basic concept
3. Step-by-step solution
4. Final answer
5. One similar practice question
`;

    } else if (mode === "quiz") {

      systemPrompt += `
Create a short educational quiz.

Give one question at a time.
Do not reveal the answer before the student attempts it.
After the student answers, explain whether it is correct and why.
`;

    } else if (mode === "practice") {

      systemPrompt += `
Create practice questions for the student's level.

Start easy.
Then gradually increase difficulty.
If the student makes a mistake, explain the mistake and give a hint.
`;

    } else if (mode === "notes") {

      systemPrompt += `
Create short Smart Notes.

Use:
- Important points
- Definitions
- Formulas where needed
- Examples
- Quick revision points

Keep the notes easy to read.
`;

    } else if (mode === "revision") {

      systemPrompt += `
Help the student revise the topic.

Give:
- Key concepts
- Important points
- Common mistakes
- Quick questions
`;

    } else if (mode === "formula") {

      systemPrompt += `
Explain the important formulas related to the topic.

For every formula:
- Write the formula
- Explain every symbol
- Give one simple example
`;

    } else if (mode === "examples") {

      systemPrompt += `
Teach the topic using simple real-life examples.

Give at least two examples when appropriate.
`;

    } else if (mode === "exam") {

      systemPrompt += `
Help the student prepare for an exam.

Focus on:
- Important concepts
- Frequently useful question types
- Step-by-step solving
- Common mistakes
- Practice questions

Do not claim that a question is guaranteed to appear in an exam.
`;

    } else {

      systemPrompt += `
Act like a friendly AI teacher.

Answer the student's question clearly and step-by-step.
`;

    }

    const userPrompt = `
Student Class: ${className || "Not specified"}
Subject: ${subject || "Not specified"}
Topic: ${topic || "Not specified"}

Student Question:
${question || "Please teach me this topic."}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },

        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",

          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],

          temperature: 0.4,
          max_completion_tokens: 1200
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API Error:", data);

      return res.status(response.status).json({
        success: false,
        error:
          data?.error?.message ||
          "Groq API request failed"
      });
    }

    const answer =
      data?.choices?.[0]?.message?.content || "";

    if (!answer) {
      return res.status(500).json({
        success: false,
        error: "AI returned an empty response"
      });
    }

    return res.status(200).json({
      success: true,
      answer: answer,
      model: data.model || "llama-3.3-70b-versatile"
    });

  } catch (error) {

    console.error("AI Study Server Error:", error);

    return res.status(500).json({
      success: false,
      error: "Server error. Please try again."
    });
  }
}