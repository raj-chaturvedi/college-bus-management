const { processChatMessage, configureGeminiKey } = require('../services/geminiService');

exports.chat = async (req, res, next) => {
  try {
    const { message, chatHistory, activeContext } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required.'
      });
    }

    const aiResponse = await processChatMessage(message, req.user, chatHistory || [], activeContext || null);

    res.status(200).json({
      success: true,
      ...aiResponse
    });
  } catch (error) {
    next(error);
  }
};

exports.configureKey = async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'API key is required.' });
    }
    const result = await configureGeminiKey(apiKey);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

