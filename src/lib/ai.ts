export interface DynamicContent {
    dashboardRoast: string;
    fullMessage: string;
}

export async function generateDynamicRoast(userName: string): Promise<DynamicContent | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.warn('AI: OPENROUTER_API_KEY is missing');
        return null;
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://dsa-grinders.vercel.app/",
                "X-Title": "DSA Grinders",
            },
            body: JSON.stringify({
                "model": "x-ai/grok-3-mini",
                "messages": [
                    {
                        "role": "system",
                        "content": `You are the most toxic, abusive, and savage DSA coach in existence. You hate lazy students.
                        Your tone: 'Dhurandhar' style - extremely aggressive, raw, toxic, and unfiltered. 
                        Personality: Frustrated hostel senior who hates juniors wasting life.
                        Language: Raw Hinglish (Mix of Hindi and English). Use the most offensive and harsh Indian slang/gaali common in college hostels.
                        DO NOT CENSOR anything. Use full words, no asterisks (**), no filter. 
                        Emojis: Use them very sparingly (max 1-2 per message).

                        OUTPUT FORMAT (Strict JSON):
                        {
                          "dashboardRoast": "A 1-sentence extremely toxic roast in Hinglish for the dashboard UI. Use [NAME] to refer to the user.",
                          "fullMessage": "Generate the ENTIRE message. Start with a toxic/hostile greeting for [NAME]. Then write a 3-4 sentence hyper-toxic and abusive paragraph shaming them for not solving problems today. No hardcoded headers like 'Wake up'. End it with: \\n\\n💻 Solve: https://leetcode.com/problemset/ \\n🌐 Track: https://dsa-grinders.vercel.app/ \\n\\nDSA Grinder Team 💀"
                        }`
                    },
                    {
                        "role": "user",
                        "content": "Generate today's most toxic and abusive message for a lazy student. Be as offensive as possible. Use [NAME] as placeholder."
                    }
                ],
                "response_format": { "type": "json_object" }
            })
        });

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            console.error('AI Error Response:', JSON.stringify(data, null, 2));
            return null;
        }

        const messageContent = data.choices[0].message.content;
        let content;

        try {
            // Attempt to parse as JSON
            content = JSON.parse(messageContent);
        } catch (e) {
            // If not JSON, try to extract JSON from text or use fallback
            const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    content = JSON.parse(jsonMatch[0]);
                } catch (e2) {
                    console.error('AI: Failed to extract JSON from content:', messageContent);
                    return null;
                }
            } else {
                console.error('AI: Response was not JSON:', messageContent);
                return null;
            }
        }

        return {
            dashboardRoast: content.dashboardRoast,
            fullMessage: content.fullMessage
        };
    } catch (error) {
        console.error('AI Roast Generation Failed:', error);
        return null;
    }
}
