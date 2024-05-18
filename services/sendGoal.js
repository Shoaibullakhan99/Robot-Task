const { freemem } = require('os')
const {actionClient, ros} = require('../services/rosservice.js')


async function sendGoal () {

    var pose = new ROSLIB.Pose({
        position: positionVec,
        orientation: orientation,
    })

    var goal = new ROSLIB.Goal({
        actionClient: actionClient,
        goalMessage: {
            target_pose : {
                header: {
                    frame_id: "map",
                },
                pose: pose,
            },
        },
    });

    goal.on('feddback', function(feedback) {
        console.log('feedback:' +feedback.status.status);
    });

    goal.send()
}