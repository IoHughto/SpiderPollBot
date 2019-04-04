let data = {
    attendees: []
};

let pollInfo = {
    title: undefined,
    yes: undefined,
    no: undefined
};

function getTitle() {
    return "*" + pollInfo.title + "*";
}

function initializeData() {
    data = {
        attendees: []
    };
}

function getDefaultTitle() {
    const today = new Date();
    if (today.getDay() === 1) {
        return "Quarters?"
    } else if (today.getDay() === 4) {
        return "Deuce?";
    }
    return "MYSTERY TRIVIA?!";
    
}

function initializeHeaders(argData) {
    let title = getDefaultTitle();
    let yes = "Yay!";
    let no = "Aw...";
    if(argData !== undefined) {
        let arguments = argData.split(/ +/);
        if(arguments.length === 3) {
            title = arguments[0];
            yes = arguments[1];
            no = arguments[2];
        } else if(arguments.length === 2) {
            yes = arguments[0];
            no = arguments[1];
        }
    }
    pollInfo = {
        title: title,
        yes: yes,
        no: no
    }
}

function removeUser(user) {
    for(let i=0; i<data.attendees.length; i++) {
        if(data.attendees[i].id === user) {
            if(data.attendees[i].going === false) {
                if(data.attendees[i].pluses === 0) {
                    data.attendees.splice(i, 1);
                } else {
                    data.attendees[i].going = undefined;
                }
            } else {
                data.attendees[i].going = false;
            }
            return;
        }
    }
    data.attendees.push({
        id: user,
        going: false,
        pluses: 0
    });
}

function addUser(user) {
    for(let i=0; i<data.attendees.length; i++) {
        if(data.attendees[i].id === user) {
            if(data.attendees[i].going === true) {
                data.attendees.splice(i,1);
            } else {
                data.attendees[i].going = true;
            }
            return;
        }
    }
    data.attendees.push({
        id: user,
        going: true,
        pluses: 0
    });
}

function plusUser(user) {
    for(let i=0; i<data.attendees.length; i++) {
        if(data.attendees[i].id === user) {
            data.attendees[i].pluses++;
            return;
        }
    }
    data.attendees.push({
        id: user,
        pluses: 1
    });
}

function minusUser(user) {
    for(let i=0; i<data.attendees.length; i++) {
        if(data.attendees[i].id === user) {
            if(data.attendees[i].pluses > 0) {
                data.attendees[i].pluses--;
            }
            return;
        }
    }
}

function deleteMessage() {
    data.delete = true;
}

function storeNewInfo(message) {
    let user = message.user;
    let action = message.actions[0].value;
    if(action === 'yes') {
        addUser(user);
    } else if(action === 'no') {
        removeUser(user);
    } else if(action === 'plus') {
        plusUser(user);
    } else if(action === 'minus') {
        minusUser(user);
    } else if(action === 'delete') {
        deleteMessage();
    }
}

function seeInfo() {
    console.log(data);
}

function getSummary() {
    let going = ", ";
    let notGoing = ", ";
    for(let i=0; i < data.attendees.length; i++) {
        const user = data.attendees[i];
        const userString = '<@' + user.id + '>';
        if(user.going === true) {
            going += ", " + userString;
        }
        for(let j=0; j<user.pluses; j++) {
            going += ", " + userString + "'s +" + (j+1);
        }
        if(user.going === false) {
            notGoing += ", " + userString;
        }
    }
    return ":thumbsup: " + pollInfo.yes + " "+going.substring(3)+"\n:thumbsdown: " + pollInfo.no + " "+notGoing.substring(3);
}

module.exports = function(controller) {

    controller.hears(['^poll (.*)','^poll'], 'direct_message,direct_mention', function(bot, message) {
        if (message.match[0]) {
            initializeData();
            initializeHeaders(message.match[1]);
            const content = {
                text: getTitle(),
                attachments: [
                    {
                        text: getSummary()
                    },
                    {
                        text: "",
                        callback_id: '123',
                        attachment_type: 'default',
                        actions: [
                            {
                                "name":"yes",
                                "text": ":thumbsup:",
                                "value": "yes",
                                "type": "button",
                            },
                            {
                                "name":"no",
                                "text": ":thumbsdown:",
                                "value": "no",
                                "type": "button",
                            },
                            {
                                name: "plus",
                                text: ":heavy_plus_sign:",
                                value: "plus",
                                type: "button"
                            },
                            {
                                name: "minus",
                                text: ":heavy_minus_sign:",
                                value: "minus",
                                type: "button"
                            },
                            {
                                name: "delete",
                                text: "Delete poll",
                                value: "delete",
                                type: "button",
                                style: "danger",
                                confirm: {
                                    title: "Are you sure you want to delete this poll?",
                                    text: "This can't be undone",
                                    ok_text: "Yes",
                                    dismiss_text: "No"
                                }
                            }
                        ]
                    }
                ]
            };
            bot.reply(message,content);
        }
    });

    // receive an interactive message, and reply with a message that will replace the original
    controller.on('interactive_message_callback', function(bot, message) {
        storeNewInfo(message);
        let content = {
            text: message.original_message.text,
            attachments:
                [
                    {
                        text: getSummary()
                    },
                    message.original_message.attachments[1]
                ]
        };
        if(data.delete === true) {
            bot.api.chat.delete({
                token: bot.config.bot.token,
                channel: message.channel,
                ts: message.message_ts
            }, function(err,response) {
                console.log(err);
                console.log(response);
            });
        } else {
            bot.replyInteractive(message, content);
        }
    });
}