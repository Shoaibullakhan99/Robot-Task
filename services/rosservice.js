const rosnodejs = require('rosnodejs');
const ROSLIB = require('roslib');

process.loadEnvFile('../config/.env');

const ros = new ROSLIB.Ros({
    url: process.env.ROS_URL
})

const actionClient = new ROSLIB.ActionClient({
    ros: ros,
    serverName: process.env.SERVER_NAME,
    actionName: process.env.ACTION_NAME,
})

module.exports = {ros, actionClient}