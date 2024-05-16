const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());

const { MongoClient, ObjectId} = require("mongodb");
const url = "mongodb://localhost:27017";
const dbNamePose = "amcl_data";

const rosnodejs = require('rosnodejs');
const ROSLIB = require('roslib');

const ros = new ROSLIB.Ros({
  url: "ws://192.168.0.214:9090",
});

const actionClient = new ROSLIB.ActionClient({
  ros: ros,
  serverName: "/move_base",
  actionName: "geometry_msgs/PoseWithCovarianceStamped",
});


app.use(express.json());


let client;
let collection_pose;
let collection_mission;
let collectionActiveMission;
let collectionPoseAxis;
let poseIds;
let missionExecutionQueue = [];
let index = 0;


// This code connects to a MongoDB database, sets up a server to listen on port 8080,
// and logs a success message if the connection is established.
(async () => {
  try {
    client = new MongoClient(url);
    await client.connect();
    console.log("Connected successfully to MongoDb server");
    const db = client.db(dbNamePose);
    collection_pose = db.collection("Pose_data");
    app.listen(8080, () => {
      console.log("Server running on port 8080");
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
})();

// This code defines a route  for fetching pose data from a MongoDB database.
// It retrieves the data, sends it to the front end as a JSON response, and logs a message.
// If there's an error, it logs an error message and sends a 500 status code as a response.
app.get("/api/data", async (req, res) => {
  try {
    const fetchedPoseData = await collection_pose.find({}).toArray();
    res.json(fetchedPoseData);
    console.log("Sent pose data to front End ");
  } catch (error) {
    console.error("Error fetching Pose data From the DataBase :", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// This code defines a route  for fetching mission data from a MongoDB database.
// It connects to the database, retrieves the mission data, sends it to the front end as a JSON response,
// and logs a message.
app.get("/api/missionData", async(req, res) =>{
  try{
    const db = client.db(dbNamePose);
    collection_mission = db.collection("Missions");
    const fetchedMissionData = await collection_mission.find({}).toArray();
    res.json(fetchedMissionData);
    console.log("Sent Mission Data to Front end");
  }catch (error){
    console.error("Error fetching mission data from the DataBase :", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// This code defines a route for handling POST requests related to active missions.
// It expects a mission ID in the request body, retrieves the corresponding active mission from the database,
// logs the active mission data, and processes pose IDs associated with it.
app.post("/api/activeMission", async (req, res) => {
  try{
    const missionData = req.body.missionId;
    console.log(`Active mission :${missionData}`);

    try {
      const db = client.db(dbNamePose);
      collectionActiveMission = db.collection("Missions");
      const activeMissionCursor = await collectionActiveMission.find({ "_id": new ObjectId(missionData) });
      const activeMissions = await activeMissionCursor.toArray();
      console.log(activeMissions);
      poseIds = activeMissions[0].queueData.queue;
    } catch (error) {
      console.error(error);
    }
    await processPoseIds();
  } catch (error) {
    console.error("Error receiving queue data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// This code defines a route ("/api/send") to handle POST requests for sending mission data.
// It expects a mission object in the request body, saves the mission data to the database,
// and then iterates through each item in the mission queue to retrieve additional data.
app.post("/api/send", async (req, res) => {
  try {
    const queueData = req.body.mission;
    console.log("Received queue data:", queueData);
    // saving missions on db
    try {
      const db = client.db(dbNamePose);
      collection_mission = db.collection("Missions");
      await collection_mission.insertOne({ queueData });
      console.log("Saved mission data on db");
    } catch (error) {
      console.error(error);
    }
    // end
    for (const item of queueData.queue) {
      const search_data = await collection_pose.find({ _id: item }).toArray();
      console.log(search_data);
    }
    res.status(200).json({ message: "Queue data received successfully" });
  } catch (error) {
    console.error("Error receiving queue data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// send data to robot

// This asynchronous function, `processPoseIds`, retrieves pose data from a MongoDB database
// based on the provided pose IDs. It makes a mission execution queue with pose position
// and orientation data.

async function processPoseIds() {
  try {
    const db = client.db(dbNamePose);
    collectionPoseAxis = db.collection("Pose_data");
    

    for (const poseid of poseIds) {
      
      const searchPoseid = await collectionPoseAxis
        .find({ _id: poseid })
        .toArray();

      for (let i = 0; i < searchPoseid.length; i++) {
        if (searchPoseid[i]) {
          missionExecutionQueue.push([
            searchPoseid[i].amclData.pose.pose.position,
            searchPoseid[i].amclData.pose.pose.orientation,
          ]);
        }
      }
    }
    console.log("hi");
    console.log(missionExecutionQueue);
    await sendGoal();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

// Function to send a goal

async function sendGoal() {
  console.log("hello");
  if (index < missionExecutionQueue.length) {
      var positionVec = new ROSLIB.Vector3(null);
      var orientation = new ROSLIB.Quaternion({
          x: missionExecutionQueue[index][1].x,
          y: missionExecutionQueue[index][1].y,
          z: missionExecutionQueue[index][1].z,
          w: missionExecutionQueue[index][1].w
      });

      positionVec.x = missionExecutionQueue[index][0].x;
      positionVec.y = missionExecutionQueue[index][0].y;

      var pose = new ROSLIB.Pose({
          position: positionVec,
          orientation: orientation,
      });

      var goal = new ROSLIB.Goal({
          actionClient: actionClient,
          goalMessage: {
              target_pose: {
                  header: {
                      frame_id: "map",
                  },
                  pose: pose,
              },
          },
      });

      goal.on('feedback', function(feedback) {
          console.log('Feedback: ' + feedback.status.status);
      });

      
      goal.send();
  } else {
      console.log("Mission Execution Complete");
      missionExecutionQueue = [];
  }
}

var move_baseListener = new ROSLIB.Topic({
  ros: ros,
  name: '/move_base/result',
  messageType: 'move_base_msgs/MoveBaseActionResult'
});

move_baseListener.subscribe(function(actionResult) {
  
  console.log('Received message on ' + move_baseListener.name + 'status: ' + actionResult.status.status);
  console.log("The goal has been reached");

  index++;
  sendGoal(); 
});