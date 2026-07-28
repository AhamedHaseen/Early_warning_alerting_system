export const checkHealth = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running normally',
    timestamp: new Date().toISOString()
  });
};
