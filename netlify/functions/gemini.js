// netlify/functions/gemini.js

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 1. Parse request
    const body = JSON.parse(event.body);
    const message = body.message;

    // 2. Check API Key (Server-side)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing in Netlify settings.");
      return { statusCode: 500, body: JSON.stringify({ reply: "서버 설정 오류: API 키가 없습니다." }) };
    }

    // 3. Call Google API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are 'Mindful AI', a compassionate mental health assistant. User says: "${message}". Provide a warm, empathetic response in Korean (under 3 sentences).`
          }]
        }]
      })
    });

    const data = await response.json();

    // 4. Handle Google's response
    if (!response.ok) {
       console.error("Google API Error:", data);
       return { statusCode: response.status, body: JSON.stringify({ reply: "AI 서버 연결에 실패했습니다." }) };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "응답을 생성하지 못했습니다.";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: reply })
    };

  } catch (error) {
    console.error("Function Internal Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "내부 서버 오류가 발생했습니다." })
    };
  }
};