"use-strict";

const checkMSG = require('../checkMSG');

module.exports = function(RED) {
    function NatsStreamingPublishNode(config) {
        RED.nodes.createNode(this,config);
        let node = this;
        this.server = RED.nodes.getNode(config.server);

        // connect to nats streaming server
        let stan = require('node-nats-streaming')
            .connect(this.server.cluster, config.clientID, { url:'nats://' + this.server.server + ':' + this.server.port });

        // on input send message
        node.on('input', function(msg) {
            let message;
            let channel;
            
            //checks if msg has configurations and sets them
            if(checkMSG(msg.payload)) {
                message = msg.payload;
            } else {
                message = config.message;
            }

            if(checkMSG(msg.channel)) {
                channel = msg.channel;
            } else {
                channel = config.channel;
            }

            node.log(channel);
            node.log(message);
            stan.publish(channel, message, function(err, guid){
                if(err) {
                node.log('publish failed: ' + err);
                node.err('problem while publishing message', msg)
                } else {
                node.log('published message with guid: ' + guid);
                }
            });
        });

        // on node close the nats stream connection is also closed
        node.on('close', function() {
            stan.close();
        });

    }
    RED.nodes.registerType("nats-streaming-publish",NatsStreamingPublishNode);
}