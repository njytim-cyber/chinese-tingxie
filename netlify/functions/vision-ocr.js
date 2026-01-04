/**
 * Netlify Function: Gemini Vision API for Handwriting Recognition
 * Returns top 5 possible interpretations of handwritten Chinese
 * 
 * Environment variable required: GOOGLE_CLOUD_API_KEY
 */

exports.handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
        console.error('GOOGLE_CLOUD_API_KEY not configured');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key not configured' })
        };
    }

    try {
        const { image } = JSON.parse(event.body);

        if (!image) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No image provided' })
            };
        }

        // Call Gemini API for handwriting recognition
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: `You are a Chinese handwriting recognition expert. Look at this handwritten Chinese text and provide your top 5 best guesses for what was written. The handwriting may be imperfect.

Return ONLY a JSON array with exactly 5 Chinese phrases/words that could match this handwriting, ordered from most likely to least likely. No explanations, just the JSON array.

Example response format:
["天气预报", "天氣预報", "大气预报", "天气须报", "天气预极"]`
                    },
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: image
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 200
            }
        };

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API error:', data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error?.message || 'Gemini API error' })
            };
        }

        // Extract the text response
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        console.log('Gemini raw response:', textResponse);

        // Parse the JSON array from response
        let candidates = [];
        try {
            // Extract JSON array from response (handle markdown code blocks)
            const jsonMatch = textResponse.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                candidates = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse Gemini response:', e);
            // Try to extract Chinese characters as fallback
            const chineseMatch = textResponse.match(/[\u4e00-\u9fff]+/g);
            if (chineseMatch) {
                candidates = chineseMatch.slice(0, 5);
            }
        }

        // Ensure we have at least something
        if (!Array.isArray(candidates) || candidates.length === 0) {
            candidates = ['(无法识别)'];
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                text: candidates[0] || '',
                alternatives: candidates.slice(1, 5),
                candidates: candidates.slice(0, 5)
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
