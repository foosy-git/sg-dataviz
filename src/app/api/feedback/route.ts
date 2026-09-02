import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, email, message } = body;

    const webhookUrl = process.env.GOOGLE_FEEDBACK_WEBHOOK_URL;

    // If webhook isn't configured, we simulate a 500 error so the client falls back to the mailto: link
    if (!webhookUrl) {
      console.warn('GOOGLE_FEEDBACK_WEBHOOK_URL is not set. Falling back to client-side mailto.');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 501 });
    }

    // Forward the data to the Google Apps Script Web App
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Google Apps script requires data to be sent cleanly
      body: JSON.stringify({
        type,
        email: email || 'Anonymous',
        message,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script responded with ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
