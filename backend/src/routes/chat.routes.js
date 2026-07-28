import express from 'express';
import { handleChatMessage } from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/', handleChatMessage);

export default router;
