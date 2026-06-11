export class GeminiAPI {
    constructor() {
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    }

    async generateResponse(apiKey, prompt, intent, retries = 2) {
        let systemPrompt = "You are EngiMind, an advanced engineering classroom assistant.";
        
        if (intent.mode === 'quiz') {
            systemPrompt += ' The user wants a quiz. You MUST respond ONLY with a raw JSON array of 5 questions. Do not use markdown blocks. Format exactly like this: [{"q":"Question text","options":["A","B","C","D"],"answer":"Correct Option Text"}]';
        } else if (intent.mode === 'math') {
            systemPrompt += " Provide only the step-by-step formula and the final answer.";
        } else if (intent.mode === 'greeting') {
            systemPrompt += " Respond with a short, friendly, one-sentence classroom greeting.";
        }

        const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: prompt }] }]
        };

        // Retry Loop for handling Rate Limits seamlessly
        for (let attempt = 0; attempt <= retries; attempt++) {
            const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                return data.candidates[0].content.parts[0].text;
            }

            // If we hit the Free Tier Speed Limit (429 Error)
            if (response.status === 429) {
                if (attempt === retries) {
                    throw new Error("Free tier speed limit reached. Please take a 60-second break before asking the next question.");
                }
                // Wait 15 seconds, then 30 seconds before trying again automatically
                const waitTime = (attempt + 1) * 15000;
                console.warn(`Speed limit hit. AI is taking a breath. Retrying in ${waitTime/1000} seconds...`);
                
                // Pause code execution for the waitTime
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue; // Try the fetch request again
            }

            // For any other kind of error, fail immediately
            throw new Error(data.error?.message || `API Error ${response.status}`);
        }
    }
}