export class IntentRouter {
    static route(userInput) {
        const text = userInput.toLowerCase().trim();

        const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening'];
        if (greetings.includes(text)) return { mode: 'greeting' };

        if (text.includes('quiz') || text.includes('test me') || text.includes('mcq')) return { mode: 'quiz' };

        const mathRegex = /^[0-9+\-*/().\s]+=[?]?$/;
        if (mathRegex.test(text) || text.includes('calculate') || text.includes('solve')) return { mode: 'math' };

        return { mode: 'explain' };
    }
}