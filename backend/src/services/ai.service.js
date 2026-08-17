import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_KEY_1 = process.env.OPENROUTER_API_KEY_1;

export const generateRecommendations = async (stats) => {
  try {
    const prompt = `You are an AI academic advisor. Given the following student statistics, generate exactly 4 personalized recommendations in a valid JSON object with a single key "recommendations" containing an array of objects.
Stats:
- Attendance: ${stats.attendancePct}
- GPA: ${stats.gpa}
- Pending Assignments: ${stats.pendingAssignments}
- Completed Assignments: ${stats.completedAssignments}

Each recommendation in the JSON array should have:
- "id": a unique integer
- "type": one of "urgent", "warning", "info", "success"
- "title": A short title
- "message": A 1-2 sentence description
- "action": A short action text for a button (e.g. "View Log")

Return ONLY the JSON object, nothing else.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    
    let content = data.choices[0].message.content;
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(content);
    return parsed.recommendations;
  } catch (err) {
    console.error("Error generating recommendations:", err);
    throw new Error("Failed to generate recommendations: " + err.message);
  }
};

export const chatWithTutor = async (messages) => {
  try {
    // messages is array of { role: 'user' | 'assistant', content: string }
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a helpful, expert AI Tutor for a university student. Provide clear, concise, and educational answers." },
          ...messages
        ]
      })
    });
    const data = await response.json();
    if (data.error) {
       const errMsg = typeof data.error === 'string' ? data.error : data.error.message;
       throw new Error(errMsg || "Provider returned error");
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response from provider");
    }

    return data.choices[0].message.content || "";
  } catch (err) {
    console.error("Error in Tutor Chat:", err);
    throw new Error("Failed to get response from Tutor: " + err.message);
  }
};

export const summarizeNotes = async (notes) => {
  try {
    const prompt = `Summarize the following study notes in a structured, easy-to-read markdown format. Include main concepts, key takeaways, and a quick summary.\n\nNotes:\n${notes}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Error in Summarizer:", err);
    throw new Error("Failed to summarize notes");
  }
};

export const generateQuiz = async (topic, count = 5) => {
  try {
    const prompt = `Generate a ${count}-question multiple choice quiz on the topic: "${topic}".
Output ONLY a valid JSON object with a single key "questions" containing an array of objects. Each object must have:
- "question": string
- "options": array of exactly 4 strings
- "answer": string (must exactly match one of the options)
- "explanation": string explaining the answer`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      })
    });
    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Parse the JSON array
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const finalJSON = JSON.parse(content);
    return finalJSON.questions;
  } catch (err) {
    console.error("Error generating quiz:", err);
    throw new Error("Failed to generate quiz");
  }
};
