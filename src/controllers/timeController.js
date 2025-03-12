// controllers/timeController.js

exports.getCurrentTime = (req, res) => {
    const currentTime = new Date().toISOString();
    res.json({ currentTime });
};