// backend/controllers/aiController.js

exports.generateCakeImage = async (req, res) => {
    try {
        const { stages, coverage, color, topping, filling, customDescription } = req.body;

        // Construct a professional prompt for the AI
        let prompt = `A professional high-end luxury custom cake, `;

        // Simplify the prompt to avoid triggering filters or errors on the AI service
        const baseTheme = customDescription || `${color} cake with ${filling}`;
        const finalPrompt = encodeURIComponent(`${baseTheme} luxury professional food photography, 8k, elegant`);
        const imageUrl = `https://image.pollinations.ai/prompt/${finalPrompt}?seed=${Math.floor(Math.random() * 1000000)}&nologo=true&width=1024&height=1024`;

        console.log('AI Prompt Generated:', prompt);

        // Return the URL. The client will load it.
        res.json({ imageUrl, prompt });

    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ message: 'Erreur lors de la génération IA.' });
    }
};
