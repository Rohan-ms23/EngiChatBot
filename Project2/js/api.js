export class GeminiAPI {
    constructor() {
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    }

    async generateResponse(apiKey, prompt, intent) {
        let systemPrompt = "You are EngiMind, an advanced engineering classroom assistant.";
        
        if (intent.mode === 'quiz') {
            systemPrompt += ` The user wants a quiz. You MUST respond ONLY with a raw JSON array of 5 questions. Do not use markdown blocks. Format exactly like this: [{"q":"Question text","options":["A","B","C","D"],"answer":"Correct Option Text"}]`;
        } else if (intent.mode === 'math') {
            systemPrompt += " Provide only the step-by-step formula and the final answer.";
        } else if (intent.mode === 'greeting') {
            systemPrompt += " Respond with a short, friendly, one-sentence classroom greeting.";
        }

        const response = await fetch(`${this.baseUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || `API Error ${response.status}`);
        
        return data.candidates[0].content.parts[0].text;
    }
}