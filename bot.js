
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var fs = require('fs');
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
var map = new Object();
var buttonMap = new Map();
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

function setVar(args, channelID) 
{
    var key = args[1];
    var value = args[2];           
    args = args.splice(1);
     bot.sendMessage({
         to: channelID,
         message: 'Key sent: '+key+". Value sent: "+value+"."
     });
    //  map[key] = value;
    buttonMap.set(key, value);
}

function playAudio(voiceChannelID)
{
    bot.joinVoiceChannel(voiceChannelID, function(error, events){
        if (error) return console.error(error); // if you cant join

        bot.getAudioContext(voiceChannelID, function(error, stream) {
            if (error) return console.error(error);

            fs.createReadStream('botTest.mp3').pipe(stream, {end: false});

            stream.on('done', function(){
                bot.leaveVoiceChannel(voiceChannelID);
            });
        });
    });
}

function testAudio(args, voiceChannelID)
{
    var key = args[1];

    bot.joinVoiceChannel(voiceChannelID, function(error, events){
        if (error) return console.error(error); // if you cant join

        bot.getAudioContext(voiceChannelID, function(error, stream) {
            if (error) return console.error(error);

            fs.createReadStream(buttonMap.get(key)).pipe(stream, {end: false});

            stream.on('done', function(){
                bot.leaveVoiceChannel(voiceChannelID);
            });
        });
    });
}

function listInfo(args, channelID)
{
    var param = args[1];

    if (param == "buttons")
    {
        var keyIterator = buttonMap.keys();
        var counter = 0;
        while (counter < buttonMap.size)
        {
            var currentKey = keyIterator.next().value;
            bot.sendMessage({
                to: channelID,
                message: 'Button: '+currentKey+" Value: "+buttonMap.get(currentKey)+""
            });
            counter ++;
        }

    }

}

function stopAudio(voiceChannelID)
{
    bot.leaveVoiceChannel(voiceChannelID);
}
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    console.log(userID);
    console.log(user);
    var serverID = bot.channels[channelID].guild_id;
    var voiceChannelID = bot.servers[serverID].members[userID].voice_channel_id;

    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        switch(cmd) 
        {
            case 'set': setVar(args, channelID); break;
            case 'play': playAudio(voiceChannelID); break;
            case 'stop': stopAudio(voiceChannelID); break;
            case 'test': testAudio(args, voiceChannelID); break;
            case 'list': listInfo(args, channelID); break;
        }
     }
});