module.exports = (req, res) => {
  res.status(200).json({
    message: 'Serverless function is working!',
    timestamp: new Date().toISOString()
  });
};
