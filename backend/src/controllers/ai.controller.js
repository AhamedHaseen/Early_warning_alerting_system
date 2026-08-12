import { generateRecommendations, chatWithTutor, summarizeNotes, generateQuiz } from '../services/ai.service.js';

export const getRecommendations = async (req, res) => {
  try {
    const { stats } = req.body;
    if (!stats) return res.status(400).json({ error: 'Stats are required' });
    
    const recommendations = await generateRecommendations(stats);
    res.json({ status: 'success', recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleTutorChat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Messages array is required' });
    
    const reply = await chatWithTutor(messages);
    res.json({ status: 'success', reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleSummarize = async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ error: 'Notes are required' });
    
    const summary = await summarizeNotes(notes);
    res.json({ status: 'success', summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const handleQuizGeneration = async (req, res) => {
  try {
    const { topic, count } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic is required' });
    
    const quiz = await generateQuiz(topic, count || 5);
    res.json({ status: 'success', quiz });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
