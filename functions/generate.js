// This is your Cloudflare Pages Function
export async function onRequest(context) {
    try {
        // 1. Check if the request is a POST request
        if (context.request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        // 2. Get the data the user sent from the frontend
        const requestBody = await context.request.json();
        const { model, contents } = requestBody;

        // 3. Securely access the API key from Cloudflare's environment variables
        // 'context.env' is where Cloudflare stores your secrets
        const API_KEY = context.env.GOOGLE_API_KEY;

        if (!API_KEY) {
            return new Response(JSON.stringify({ error: "API key is not configured on the server." }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 4. The URL to the Google API
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        // 5. Call the Google API from the secure serverless function
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ contents: contents }),
        });

        // 6. Get the JSON data from Google's response
        const data = await response.json();

        // 7. Send the response back to your frontend
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}