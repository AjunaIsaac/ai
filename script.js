document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const apiKeyInput = document.getElementById('apiKey');
    const urlInput = document.getElementById('urlInput');
    const convertBtn = document.getElementById('convertBtn');
    const statusMessage = document.getElementById('statusMessage');
    const resultContainer = document.getElementById('resultContainer');
    const jsonOutput = document.getElementById('jsonOutput');
    const copyBtn = document.getElementById('copyBtn');

    // 2. The AI Instructions (CRITICAL)
    // We define exactly how we want the AI to behave and structure the data.
    const SYSTEM_INSTRUCTION = `
        You are a Data Extraction Specialist. 
        Your Task: Analyze the provided list of video URLs. 
        1. Extract the Series Name, Season Number (e.g., S01), and Episode Number (e.g., E05) from the filename.
        2. Generate a clean "title" based on the filename (e.g., "Series Name Episode 5").
        3. "overview" field should remain an empty string "".
        4. Group the episodes by Season.
        
        REQUIRED OUTPUT FORMAT (Strict JSON Array):
        [
          {
            "season_number": 1,
            "episodes": [
              {
                "episode_number": 1,
                "title": "Cleaned Title Here",
                "videoUrl": "Original Link Here",
                "overview": ""
              }
            ]
          }
        ]

        RULES:
        - Return ONLY valid JSON.
        - Do not include markdown formatting (like \`\`\`json).
        - If the text provided is not a URL, ignore it.
    `;

    // 3. Helper: Update Status UI
    const setStatus = (msg, type = 'normal') => {
        statusMessage.textContent = msg;
        statusMessage.style.color = type === 'error' ? '#ff6b6b' : '#a0a0a0';
    };

    // 4. Main Conversion Logic
    convertBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        const rawText = urlInput.value.trim();

        // Basic Validation
        if (!apiKey) {
            setStatus('Error: Please enter a valid Gemini API Key.', 'error');
            return;
        }
        if (!rawText) {
            setStatus('Error: Please paste some URLs.', 'error');
            return;
        }

        setStatus('Analyzing filenames with Gemini...');
        resultContainer.classList.add('hidden');

        try {
            // Prepare the payload for Gemini API
            const payload = {
                contents: [
                    {
                        parts: [
                            { text: SYSTEM_INSTRUCTION }, 
                            { text: "Here is the raw list of URLs to process:\n" + rawText }
                        ]
                    }
                ]
            };

            // Call Google Gemini API (Using 1.5-flash for speed)
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'API Request Failed');
            }

            const data = await response.json();
            
            // Extract the text response from Gemini
            let aiText = data.candidates[0].content.parts[0].text;

            // Cleanup: Sometimes AI wraps code in markdown backticks (```json ... ```)
            // We verify and remove them to ensure valid JSON parsing.
            aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

            // Attempt to parse JSON to ensure it's valid
            const parsedJson = JSON.parse(aiText);

            // Display Result
            jsonOutput.textContent = JSON.stringify(parsedJson, null, 2); // Pretty print with 2 spaces
            resultContainer.classList.remove('hidden');
            setStatus('Conversion Successful!', 'success');

        } catch (error) {
            console.error(error);
            setStatus(`Error: ${error.message}`, 'error');
        }
    });

    // 5. Copy to Clipboard Functionality
    copyBtn.addEventListener('click', () => {
        const textToCopy = jsonOutput.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "Copied!";
            setTimeout(() => copyBtn.textContent = originalText, 2000);
        });
    });
});