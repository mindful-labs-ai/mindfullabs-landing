// netlify/functions/gemini.js

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 1. Parse the user's message from the request body
    const { message } = JSON.parse(event.body);

    // 2. Get the API Key securely from Netlify Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "API Key missing" }) };
    }

    // 3. Call Gemini API (Server-to-Server)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a compassionate mental health AI assistant named 'Mindful AI'. 
                   The user is sharing their feelings: "${message}". 
                   Please provide a short, warm, and empathetic response in Korean. 
                   Include a brief mindfulness tip or a comforting metaphor. 
                   Keep it under 3 sentences. Tone: Gentle, professional, soothing.`
          }]
        }]
      })
    });

    const data = await response.json();
    
    // Extract the text safely
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "죄송합니다. AI가 응답을 생성하지 못했습니다.";

    // 4. Return the AI's reply to the frontend
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: reply })
    };

  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" })
    };
  }
};