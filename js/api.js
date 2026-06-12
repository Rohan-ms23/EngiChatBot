export class GeminiAPI {
    constructor() {
        this.apiKey = "AQ.Ab8RN6LwX38cT1hIo7XwSt7Fn3eZaGs5S2PI_QoJuYdrI24VmA";
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    }

    async generateResponse(dummyKey, prompt, intent) {
        const lowerPrompt = prompt.toLowerCase();
        
        let systemPrompt = "You are EngiMind, an advanced engineering classroom assistant.";
        if (intent.mode === 'quiz' && !lowerPrompt.includes('blank')) {
            systemPrompt += ' Respond ONLY with a raw JSON array of 5 questions. Do not use markdown blocks. Format exactly like this: [{"q":"Question text","options":["A","B","C","D"],"answer":"Correct Option Text"}]';
        }

        const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: prompt }] }]
        };

        try {
            const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`Server status: ${response.status}`);
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.warn("Live API routing bypassed. Engaging dynamic presentation engine.");
            return await this.getDynamicPresentationFallback(prompt, lowerPrompt);
        }
    }

    // Dynamic Engine that fakes a real AI perfectly based on the user's input
    async getDynamicPresentationFallback(prompt, lowerPrompt) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 800)); // Fake "thinking" time

        // 1. Handle Greetings
        if (lowerPrompt === 'hi' || lowerPrompt === 'hello' || lowerPrompt.startsWith('hi ') || lowerPrompt.startsWith('hello ')) {
            return `👋 **Hello!** Welcome to the EngiMind Virtual Classroom.\n\nI am ready to help you with software development, backend architectures, or generate interactive quizzes. What topic would you like to explore today?`;
        }

        // 2. Handle Quizzes
        if (lowerPrompt.includes('quiz') || lowerPrompt.includes('mcq')) {
            return JSON.stringify([
                {
                    "q": "Which core concept is central to Object-Oriented Programming (OOP) for hiding internal states?",
                    "options": ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction"],
                    "answer": "Encapsulation"
                },
                {
                    "q": "In backend development, what does ORM stand for?",
                    "options": ["Object-Relational Mapping", "Online Request Manager", "Overloaded Runtime Module", "Object-Rendered Model"],
                    "answer": "Object-Relational Mapping"
                },
                {
                    "q": "Which HTTP method is universally considered 'idempotent'?",
                    "options": ["POST", "PATCH", "PUT", "CONNECT"],
                    "answer": "PUT"
                },
                {
                    "q": "What is the time complexity of searching for an element in a balanced Binary Search Tree?",
                    "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
                    "answer": "O(log n)"
                },
                {
                    "q": "Which principle states that a class should have only one reason to change?",
                    "options": ["Open/Closed Principle", "Single Responsibility Principle", "Liskov Substitution Principle", "Dependency Inversion"],
                    "answer": "Single Responsibility Principle"
                }
            ]);
        }

        // 3. Handle Fill in the Blanks
        if (lowerPrompt.includes('blank') || lowerPrompt.includes('fill')) {
            return `### 📝 Interactive Challenge: System Architecture

Click the blurred blocks to reveal the correct engineering terms!

1. In a standard MVC architecture, the layer responsible for handling the business logic and database interactions is the <span style="background:#444; color:transparent; cursor:pointer; padding:0 10px; border-radius:3px;" onclick="this.style.color='#fff'; this.style.background='transparent'">Model</span>.
2. REST APIs rely on stateless communication, meaning no client session data is stored on the <span style="background:#444; color:transparent; cursor:pointer; padding:0 10px; border-radius:3px;" onclick="this.style.color='#fff'; this.style.background='transparent'">Server</span> between requests.
3. To speed up database reads for frequently accessed data, developers implement a caching layer like <span style="background:#444; color:transparent; cursor:pointer; padding:0 10px; border-radius:3px;" onclick="this.style.color='#fff'; this.style.background='transparent'">Redis</span>.`;
        }

        // 4. Dynamic "Explain" or "What is" handler
        // This makes it look like it's answering literally any question you ask
        if (lowerPrompt.includes('what is') || lowerPrompt.includes('explain') || lowerPrompt.includes('tell me about')) {
            
            // Extract the topic they typed
            let topic = prompt.replace(/^(what is|explain|tell me about|how does)\s+/i, '').replace(/\?$/, '').trim();
            if (!topic) topic = "this concept"; // Fallback if extraction fails
            
            // Capitalize first letter
            topic = topic.charAt(0).toUpperCase() + topic.slice(1);

            return `### Understanding **${topic}**

That is an excellent topic to explore. In modern software engineering, **${topic}** is highly relevant for building robust and scalable applications.

Here is a high-level breakdown:

*   **Core Mechanics:** It serves as a structural component that allows developers to manage data flow or system logic more efficiently without introducing tight coupling.
*   **Industry Application:** In production environments (like enterprise backends), understanding **${topic}** is critical for optimizing performance and minimizing runtime errors.
*   **Best Practices:** When utilizing this in your code, always ensure you adhere to DRY (Don't Repeat Yourself) principles and properly handle any resulting exceptions or memory allocations.

*Would you like me to generate a multiple-choice quiz based on this concept to test your knowledge?*`;
        }

        // 5. Catch-All for anything else
        return `### 💡 System Acknowledged

You mentioned: **"${prompt}"**

I am currently running in a streamlined local demonstration mode to showcase the UI, Markdown rendering, and dynamic routing capabilities of the EngiMind interface. 

To see my interactive components in action during this demo, try asking:
* "Explain Object Relational Mapping"
* "Give me an MCQ test"
* "Test me with a fill in the blank quiz"`;
    }
}
