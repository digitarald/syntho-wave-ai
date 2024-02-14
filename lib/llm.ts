
export type TranscriptSummary = {
    speaker: number;
    insight?: string;
    recommendation?: string;
};

export interface AdvisorDetails {
    conversation: string;
    participants: string[] | string;
    feedback?: string;
    audience?: string;
    language?: string;
    outcome: string;
}

const advisors: Record<string, AdvisorDetails> = {
    "Job Interview": {
        conversation: "job interview for a marketing position",
        participants: ["interviewer, asking probing questions", "job candidate, trying to make a good impression"],
        feedback: "missed to answer, unclear, too technical, too vague, too long, too short, etc.",
        audience: "job candidate",
        outcome: "help the job candidate improve their chances of getting hired",
    },
    "Spanish Practice": {
        conversation: "conversation in Spanish",
        participants: "multiple spanish learners",
        feedback: "Point out SPECIFIC vocabulary, grammar, and expression mistakes. In English.",
        audience: "spanish learners",
        outcome: "help the learners get a better grasp of the language and improve their speaking skills",
        language: "es-ES",
    },
    "Movie Script": {
        conversation: "movie script reading",
        participants: "various actors",
        feedback: "script weaknesses, character development, plot holes, etc.",
        audience: "screen writer",
        outcome: "make a great movie script that is captivating and engaging",
    },
    "Product Demo": {
        conversation: "product demonstration for potential clients",
        participants: ["sales representative, presenting the product", "potential clients, evaluating the product"],
        feedback: "presentation skills, product knowledge, handling objections, etc.",
        audience: "sales representative",
        outcome: "improve the product demonstration to increase sales",
    },
    "Status Meeting": {
        conversation: "weekly status meeting",
        participants: "team members, reporting on their progress",
        feedback: "communication clarity, time management, task tracking, etc.",
        audience: "team members and project manager",
        outcome: "improve the efficiency and effectiveness of status meetings",
    }
};

export const advisorList = Object.keys(advisors);

export class Agents {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async fetchOpenaiAPI(messages: any[], maxTokens = 25) {
        const apiUrl = "https://api.openai.com/v1/chat/completions";
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo-0125",
                    response_format: { "type": "json_object" },
                    max_tokens: maxTokens,
                    messages: messages,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch OpenAI API: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error) {
            console.error("Error calling OpenAI API:", error);
            throw error;
        }
    }

    public async reviewLatest(advisorId: string, transcript: string[], lastRecommendation?: string): Promise<TranscriptSummary> {
        const advisor = advisors[advisorId];
        if (!advisor) {
            throw new Error(`Advisor not found: ${advisorId}`);
        }
        const messages = [
            {
                role: "system",
                content: `
                    You are an expert mentor that provides real-time feedback on a transcript from a live conversation. You are provided transcript snapshot and the last recommendation you provided. Your goal is to analyze the transcript for actionable feedback and follow-up guidance, so ${advisor.outcome}. You have excellent listening skills, deep understanding of human behavior, and a knack for giving actionable advice that helps in the moment.

                    # Conversation Details
                    Context: Conversation is a ${advisor.conversation}.
                    ${Array.isArray(advisor.participants) ? advisor.participants.map((participant, idx) => `Participant ${idx + 1}: ${participant}`).join("\n") : `Participants: ${advisor.participants}`
                    }
                    Feedback: Will be read by ${advisor.audience || advisor.participants[0]}.
                    
                    # Think step-by-step:
                    Step 1: Read the summary and latest transcript line carefully and make informed assumptions about the speakers, context, subtext, open questions, and hidden messages.
                    Step 2: Based on the LAST LINE and prior conversation provide constructive feedback (${advisor.feedback}) with specific and actionable guidance for follow-up (10 words maximum).
                    Step 3: Return JSON (Typescript type: { speaker: number; recommendation?: string; };). Skip optional values if not applicable. Keep the JSON compact with no added whitespace or line breaks.

                    # Remember
                    - Your feedback will be read by ${advisor.audience || advisor.participants[0]} as they are having the conversation, so it should be concise (easy to scan) and actionable (can be applied here and now).
                    - Do not provide recommendations for later practice or general advice, but focus on specific and direct feedback that can be applied real-time in the moment.
                    - If you find a mistake, point it out directly and provide a correction. Avoid socratic questioning or indirect feedback.

                    # Your Work Matters!
                    If you provide the best real-time mentoring, you will ${advisor.outcome}, and you will earn the Mentor Master badge. Good luck!
                `.replace(/\n\s+/g, "\n"),

                // Step 2: For the LAST LINE, determine the subtext behind it.Look for clues such as tone, emphasis, irony, sarcasm, humor, or deception.Identify the hidden or implied messages that the speakers are trying to convey or conceal.If the LAST LINE has a hidden or implied meaning, summarize it as actionable insight(10 words maximum), otherwise skip this step.
            },
            {
                role: "user",
                content: `# PREVIOUS CONVERSATION\n${transcript.slice(0, transcript.length - 1).join("\n")}`,
            }
        ];

        // Add before last entry
        if (lastRecommendation) {
            messages.push({
                role: "user",
                content: `# YOUR PREVIOUS RECOMMENDATION\n${lastRecommendation}`
            });
        }
        messages.push({
            role: "user",
            content: `# LAST LINE\n${transcript[transcript.length - 1]}`
        });

        const response = await this.fetchOpenaiAPI(messages, 500);
        const message = JSON.parse(response.choices[0].message.content);
        console.log(message);

        return (Array.isArray(message) ? message[0] : message) as TranscriptSummary;
    }
}
