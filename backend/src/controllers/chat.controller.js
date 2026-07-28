import { agentExecutor } from '../services/chatbot.service.js';

export const handleChatMessage = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ status: 'error', message: 'Message is required' });
    }

    // Convert frontend history to langchain history format
    const chatHistory = (history || []).map(msg => {
      return [msg.role === 'user' ? 'human' : 'ai', msg.content];
    });
    chatHistory.push(['human', message]);

    const result = await agentExecutor.invoke({
      messages: chatHistory,
    });

    const finalMessage = result.messages[result.messages.length - 1];

    res.status(200).json({
      status: 'success',
      data: {
        reply: finalMessage.content,
      }
    });

  } catch (error) {
    console.error('Chatbot Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process chat message'
    });
  }
};
