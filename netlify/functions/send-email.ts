import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { to, subject, html, userId } = JSON.parse(event.body || '{}');
    
    // Simplification: In Netlify Functions we don't have the Express app the local filesystem easily
    // So we just use common fallback or provided email
    const finalTo = to || 'ilheonha@gmail.com';
    
    console.log(`[Netlify Function] Send Email to: ${finalTo}`);
    
    const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_EZBxeziH_Nws9winQTcHvR15skxsXjyx3";
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: finalTo,
        subject: subject,
        html: html
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
