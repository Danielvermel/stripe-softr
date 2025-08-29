export default function handler(req, res) {
    res.status(200).json({ 
      message: 'Healthcare Marketplace API is working!',
      timestamp: new Date().toISOString()
    });
  }
  