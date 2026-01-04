/**
 * Netlify Function: Google Cloud Vision API Proxy
 * Recognizes handwritten Chinese text from canvas images
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

        // Call Google Cloud Vision API
        const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

        const requestBody = {
            requests: [{
                image: {
                    content: image // base64 encoded image (without data:image/png;base64, prefix)
                },
                features: [{
                    type: 'DOCUMENT_TEXT_DETECTION',
                    maxResults: 5
                }],
                imageContext: {
                    languageHints: ['zh-Hans', 'zh-Hant'] // Simplified and Traditional Chinese
                }
            }]
        };

        const response = await fetch(visionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Vision API error:', data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: data.error?.message || 'Vision API error' })
            };
        }

        // Extract recognized text
        const textAnnotations = data.responses?.[0]?.textAnnotations || [];
        const fullText = textAnnotations[0]?.description || '';

        // Get individual text blocks as alternatives
        const alternatives = textAnnotations.slice(1, 6).map(a => a.description);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                text: fullText.trim().replace(/\s+/g, ''), // Remove whitespace
                alternatives: alternatives.filter(Boolean),
                raw: textAnnotations.slice(0, 10) // For debugging
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
