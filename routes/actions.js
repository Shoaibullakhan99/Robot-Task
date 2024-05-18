process.loadEnvFile('../config/.env');
const db = require('../config/db.js');
const fetchedPoses = require('../utilities/pose.js');

const missionsCollection = db.collection(process.env.MISSION_COLLECTION_NAME);

const setMissionQueue = async (req, res) => {
    try {
        const queueData = req.body.mission;
        console.log(`Recieved queue data`);
        try {
            await missionsCollection.insertOne({queueData})
            console.log(`Inserted Mission queue`);
            res.status(200).json('Queue is inserted successfully into database');
        } catch (err) {
            res.status(500).json({error: 'Error while saving queues to database'})
        }
    } catch (err) {
        res.status(500).json({error: 'Error recieving queue data'})
    }
}


const activateMission = async (req, res) => {
    try{
        const missionId = req.body.missionId;
        console.log(`Recieved Mission Id Successfully`);
        try {
            const activeMissionArray = await missionsCollection.find({ "_id": new OBjectId(missionId) }).toArray();
            const poseIds = activeMissionArray[0].queueData.queue;
            const poses = fetchedPoses(poseIds);
            
        } catch (err) {
            res.status(500).json({error : `Error fetching poses for the mission ID`});
        }
    } catch (err){
        res.status(500).json({error: `Error while recieving mission ID ${err}`});
    }
}

module.exports = {
    setMissionQueue,
    activateMission,
}
