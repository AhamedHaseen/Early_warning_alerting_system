import express from 'express';
import { triggerScheduleEmail } from '../controllers/email.controller.js';

const router = express.Router();

router.post('/notify-schedule', triggerScheduleEmail);

export default router;
