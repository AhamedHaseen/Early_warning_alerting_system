import { sendScheduleNotification } from '../services/email.service.js';

export const triggerScheduleEmail = async (req, res) => {
  try {
    const payload = req.body;
    
    // Basic validation
    if (!payload || !payload.batch_id || !payload.module_name || !payload.specific_date) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required schedule payload fields (batch_id, module_name, specific_date)'
      });
    }

    const result = await sendScheduleNotification(payload);

    if (result.success) {
      return res.status(200).json({
        status: 'success',
        message: result.message
      });
    } else {
      return res.status(200).json({
        status: 'skipped',
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error in triggerScheduleEmail:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while sending emails',
      error: error.message
    });
  }
};
