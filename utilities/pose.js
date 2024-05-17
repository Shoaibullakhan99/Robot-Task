process.loadEnvFile('../config/.env')
const db = require('../config/db.js');
const posesCollection = db.collection(process.env.POSE_COLLECTION_NAME);

async function findPoseForPoseId (poseIds) {
    const positionsInMission = poseIds.length;
    const poses = []
    for (const poseId of poseIds) {
        const fetchedPose = await posesCollection.find({ _id: poseId}).toArray();
        
        for(let i = 0; i < fetchedPose.lenght; i++){
            if(fetchedPose[i]){
                poses.push([
                    fetchedPose[i].amclData.pose.pose.position,
                    fetchedPose[i].amclData.pose.pose.orientation,
                ]);
            }
        }
    }
    if (positionsInMission == poses.length) return poses;
}   

export default findPoseForPoseId;