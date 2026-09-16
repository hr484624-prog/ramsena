// api/ai-study.js

export default async function handler(req, res) {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS
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

    const mode = String(body.mode || "chat").trim();

    const question =
      String(body.question || "").trim();

    const topic =
      String(body.topic || "").trim();

    const subject =
      String(body.subject || "").trim();

    const className =
      String(body.className || "").trim();

    const language =
      String(body.language || "मराठी").trim();


    // Question/topic required
    if (!question && !topic) {
      return res.status(400).json({
        success: false,
        error: "Question or topic is required"
      });
    }


    // Main system prompt
    let systemPrompt = `
You are GyanSetu AI Study Teacher.

You help school students learn.

Important rules:

- Explain everything in very simple language.
- Start from the absolute basics.
- Never make the student feel bad for not understanding.
- If the student says "I don't understand", explain again more simply.
- Use small and easy examples.
- Give step-by-step explanations.
- For Mathematics, show every calculation step.
- For Science, use simple real-life examples.
- For difficult topics, break them into small parts.
- Ask a small practice question when useful.
- Do not make the answer unnecessarily complicated.
- Keep answers age-appropriate and educational.
- Respond mainly in ${language}.
- Use clear headings and bullet points when useful.
`;


    // DOUBT MODE
    if (mode === "doubt") {

      systemPrompt += `
The student has a doubt.

First understand exactly what the student is confused about.

Then explain:

1. What the question means
2. Basic concept
3. Step-by-step solution
4. Final answer
5. One similar practice question

If the question is mathematical, show calculations clearly.
`;

    }


    // QUIZ MODE
    else if (mode === "quiz") {

      systemPrompt += `
Create a short educational quiz.

Give only one question at a time.

Do not reveal the answer before the student attempts it.

After the student answers:
- Tell whether it is correct.
- Explain why.
- If incorrect, explain the correct method simply.
`;

    }


    // PRACTICE MODE
    else if (mode === "practice") {

      systemPrompt += `
Create practice questions according to the student's level.

Start with easy questions.

Then gradually increase difficulty.

If the student makes a mistake:
- Explain the mistake.
- Give a hint.
- Then show the correct method if needed.
`;

    }


    // NOTES MODE
    else if (mode === "notes") {

      systemPrompt += `
Create short and useful Smart Notes.

Use:

- Important points
- Definitions
- Formulas where needed
- Simple examples
- Important keywords
- Quick revision points

Keep the notes easy to read.

Do not make the notes unnecessarily long.
`;

    }


    // REVISION MODE
    else if (mode === "revision") {

      systemPrompt += `
Help the student revise the topic.

Give:

- Key concepts
- Important points
- Important definitions
- Common mistakes
- Quick questions
- Short revision summary
`;

    }


    // FORMULA MODE
    else if (mode === "formula") {

      systemPrompt += `
Explain the important formulas related to the topic.

For every formula:

- Write the formula
- Explain every symbol
- Explain when to use it
- Give one simple example
- Show the calculation step-by-step
`;

    }


    // EXAMPLES MODE
    else if (mode === "examples") {

      systemPrompt += `
Teach the topic using simple examples.

Give at least two examples when appropriate.

Prefer real-life examples whenever possible.

Explain each example step-by-step.
`;

    }


    // EXAM MODE
    else if (mode === "exam") {

      systemPrompt += `
Help the student prepare for an exam.

Focus on:

- Important concepts
- Useful question types
- Step-by-step solving
- Common mistakes
- Practice questions
- Quick revision

Do not claim that a particular question is guaranteed to appear in an exam.
`;

    }


    // TEACHER MODE
    else if (mode === "teacher") {

      systemPrompt += `
Act as a friendly personal AI teacher.

Teach the selected topic from the absolute basics.

Follow this structure when appropriate:

1. Introduction
2. Basic concept
3. Easy explanation
4. Example
5. Step-by-step example
6. Small practice question
7. Quick recap

The student may ask follow-up questions.
Answer them based on the current topic.
`;

    }


    // CHAT MODE
    else {

      systemPrompt += `
Act like a friendly AI teacher.

Answer the student's question clearly and step-by-step.

Use the student's class, subject and topic as context.

If the student asks a follow-up question, continue from the previous context.
`;

    }


    // USER PROMPT
    const userPrompt = `
Student Class:
${className || "Not specified"}

Subject:
${subject || "Not specified"}

Topic:
${topic || "Not specified"}

Student Question:
${question || "Please teach me this topic."}
`;


    // GROQ API REQUEST
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${process.env.GROQ_API_KEY}`
        },

        body: JSON.stringify({

          // Updated Groq model
          model: "openai/gpt-oss-120b",

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


    // Read response
    const data = await response.json();


    // Groq API error
    if (!response.ok) {

      console.error(
        "Groq API Error:",
        data
      );

      return res.status(response.status).json({
        success: false,
        error:
          data?.error?.message ||
          "Groq API request failed"
      });

    }


    // Extract AI answer
    const answer =
      data?.choices?.[0]?.message?.content || "";


    // Empty answer
    if (!answer) {

      return res.status(500).json({
        success: false,
        error: "AI returned an empty response"
      });

    }


    // Success
    return res.status(200).json({

      success: true,

      answer: answer,

      model:
        data.model ||
        "openai/gpt-oss-120b"

    });


  } catch (error) {

    console.error(
      "AI Study Server Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Server error. Please try again."
    });

  }

}