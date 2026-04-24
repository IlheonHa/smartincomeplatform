import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  const { email, apiKey } = event.queryStringParameters || {};
  const targetEmail = email || 'ilheonha@gmail.com';
  
  console.log(`[Netlify Function] Test Email Request for: ${targetEmail}`);
  
  const RESEND_API_KEY = (apiKey && apiKey.length > 5) 
    ? apiKey 
    : (process.env.RESEND_API_KEY || "re_EZBxeziH_Nws9winQTcHvR15skxsXjyx3");
  
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: targetEmail,
        subject: "🚀 [Smart Insure Lab] 시스템 테스트 메일 (Netlify)",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>시스템 알림 테스트 (Netlify Function)</h2>
            <p>이 메일은 Netlify Functions를 통해 발송되었습니다.</p>
            <p>발송 시간: ${new Date().toLocaleString()}</p>
            <p>수신자: ${targetEmail}</p>
          </div>
        `
      })
    });

    const result = await response.json();
    return {
      statusCode: response.ok ? 200 : 500,
      body: JSON.stringify({ success: response.ok, result })
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
