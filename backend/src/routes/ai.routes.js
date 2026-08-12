import express from 'express';
import { getRecommendations, handleTutorChat, handleSummarize, handleQuizGeneration } from '../controllers/ai.controller.js';

const router = express.Router();

router.post('/recommendations', getRecommendations);
router.post('/chat', handleTutorChat);
router.post('/summarize', handleSummarize);
router.post('/quiz', handleQuizGeneration);

export default router;
