process.loadEnvFile('../config/.env');
const db = require('../config/db.js')

const getPoses = async (req, res) => {
    try{
    const posesCollection = db.collection(process.env.POSE_COLLECTION_NAME);
    const fetchedPoseData = await posesCollection.find({}).toArray();
    console.log("Poses are fetchd from the data");
    res.status(200).json(fetchedPoseData);
    }
    catch (err){
        res.json({error: "Error occured while fetching poses"})
    }
}

const getMissions = (req, res) => {
    try {
        const missionsCollection = db.collection(process.env.MISSION_COLLECTION_NAME);
        const fetchedMissions = missionsCollection.find({}).toArray();
        console.log("Missions are fetched successfully");
        res.status(200).json(fetchedMissions);
    }
    catch (err){
        res.status(500).json({error: "Error occured while fetching missions"});
    }
}

module.exports = {
    getPoses,
    getMissions,
}