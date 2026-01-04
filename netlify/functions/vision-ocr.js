/**
 * Netlify Function: Qwen-VL OCR for Handwriting Recognition
 * Returns top 5 possible interpretations of handwritten Chinese
 * 
 * Environment variable required: DASHSCOPE_API_KEY
 */

exports.handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
        console.error('DASHSCOPE_API_KEY not configured');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'DashScope API key not configured' })
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

        // Call Qwen-VL via DashScope OpenAI-compatible API
        const dashscopeUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

        const requestBody = {
            model: "qwen-vl-max",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `你是一个中文手写识别专家。请仔细观察这张手写中文图片，给出你认为最可能的5个识别结果。

请只返回一个JSON数组，包含5个最可能的中文词语或短语，按可能性从高到低排序。不要任何解释，只返回JSON数组。

返回格式示例：
["天气预报", "天氣预報", "大气预报", "天气须报", "天气预极"]`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/png;base64,${image}`
                            }
                        }
                    ]
                }
            ],
            temperature: 0.1,
            max_tokens: 200
        };

        const response = await fetch(dashscopeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Qwen API error:', data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error?.message || 'Qwen API error', details: data })
            };
        }

        // Extract the text response
        const textResponse = data.choices?.[0]?.message?.content || '[]';
        console.log('Qwen raw response:', textResponse);

        // Parse the JSON array from response
        let candidates = [];
        try {
            // Extract JSON array from response (handle markdown code blocks)
            const jsonMatch = textResponse.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                candidates = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse Qwen response:', e);
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
