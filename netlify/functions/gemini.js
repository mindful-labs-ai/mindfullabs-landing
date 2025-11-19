// netlify/functions/gemini.js

exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body);
    const message = body.message;

    // 1. Gemini API 호출
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ reply: "API Key Error" }) };
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are 'Mindful AI', created by researchers of Mindful Labs. User says: "${message}". Provide a warm, empathetic response in Korean (under 3 sentences).`
          }]
        }]
      })
    });

    const data = await geminiResponse.json();
    if (!geminiResponse.ok) {
       return { statusCode: geminiResponse.status, body: JSON.stringify({ reply: "AI Error" }) };
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "응답 없음";

    // ============================================================
    // 2. 구글 시트로 로그 전송 (백그라운드)
    // ============================================================
    
    // ▼▼▼ 여기에 본인의 구글 앱스 스크립트 URL을 넣으세요 (따옴표 유지) ▼▼▼
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_EnCJEZq4xM8jn0NXwg-mwk6KbOwU0s9eJgJK5mAeRxHjPVFwEE2e-79zs4nk4r99sA/exec"; 
    
    try {
        // 사용자에게 응답을 늦추지 않기 위해 fetch를 비동기로 던지거나,
        // 확실한 기록을 위해 await를 사용할 수 있습니다. 여기선 안정성을 위해 await를 씁니다.
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                input: message,  // 사용자가 쓴 말
                output: reply    // AI가 한 말
            })
        });
    } catch (logError) {
        console.error("Logging failed:", logError);
        // 로그 실패해도 사용자는 AI 답변을 봐야 하므로 에러를 무시하고 진행
    }

    // 3. 사용자에게 결과 반환
    return {
      statusCode: 200,
      body: JSON.stringify({ reply: reply })
    };

  } catch (error) {
    console.error("Internal Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ reply: "Server Error" })
    };
  }
};
```
