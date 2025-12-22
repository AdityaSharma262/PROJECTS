// In-memory storage for demo predictions
const demoPredictions = [];

const MatchPrediction = require('../models/MatchPrediction');

const createPrediction = async (req, res) => {
  try {
    // Extract wallet, matchId, team from body
    const { wallet, matchId, team } = req.body;

    // Validate missing fields
    if (!wallet) {
      return res.status(400).json({ message: 'Wallet is required' });
    }
    if (!matchId) {
      return res.status(400).json({ message: 'Match ID is required' });
    }
    if (!team) {
      return res.status(400).json({ message: 'Team is required' });
    }

    // Check if MongoDB is available
    if (!global.dbConnected) {
      // For demo purposes, store prediction in memory
      const newPrediction = {
        _id: 'demo-' + Date.now(),
        wallet,
        matchId,
        team,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Check for duplicate in demo mode
      const isDuplicate = demoPredictions.some(p => 
        p.wallet === wallet && p.matchId === matchId
      );
      
      if (isDuplicate) {
        return res.status(400).json({ message: 'Prediction already exists' });
      }
      
      demoPredictions.push(newPrediction);
      
      // Return JSON success response
      return res.status(201).json({
        message: 'Prediction created successfully (demo mode)',
        data: newPrediction
      });
    }

    // Save prediction to MongoDB
    const prediction = new MatchPrediction({
      wallet,
      matchId,
      team
    });

    const savedPrediction = await prediction.save();

    // Return JSON success response
    return res.status(201).json({
      message: 'Prediction created successfully',
      data: savedPrediction
    });
  } catch (error) {
    console.error('Error creating prediction:', error);
    // If duplicate key error occurs, return 400 with message "Prediction already exists"
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Prediction already exists' });
    }

    // Handle other errors
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllPredictions = async (req, res) => {
  try {
    // Check if MongoDB is available
    if (!global.dbConnected) {
      // Return demo predictions
      return res.status(200).json({
        message: 'Retrieved predictions (demo mode)',
        data: demoPredictions
      });
    }

    // Get all predictions from MongoDB
    const predictions = await MatchPrediction.find({}).sort({ createdAt: -1 });
    
    return res.status(200).json({
      message: 'Retrieved all predictions',
      data: predictions
    });
  } catch (error) {
    console.error('Error retrieving predictions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createPrediction,
  getAllPredictions
};