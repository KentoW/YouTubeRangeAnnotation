// background
var db = new Dexie("yta_database");
db.version(1).stores({annotation: 'id, title, data', label_setting: "id, num_labels, labels", on_off: "id, status"});
db.open();

db.label_setting.where('id').equals(1).first().then((r) => {
    if (r == undefined) {
        init_database();
        chrome.browserAction.setBadgeText({ text: "ON" });
    } else {
        db.on_off.where('id').equals(1).first().then((s) => {
            if (s.status == "on") {
                chrome.browserAction.setBadgeText({ text: "ON" });
            } else {
                chrome.browserAction.setBadgeText({ text: "OFF" });
            }
        });
    }
});

function init_database() {
    db.label_setting.put({
        id: 1, 
        num_labels: 4, 
        labels: ["Label 1", "Label 2", "Label 3", "Label 4", "Label 5", "Label 6", "Label 7", "Label 8", "Label 9", "Label 10"]
    })
    db.on_off.put({
        id: 1, 
        status: "on"
    })
}

// background to Youtube
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        if (tab.url.startsWith("https://www.youtube.com/watch")) {
            chrome.tabs.sendMessage(tabId, {type: 'getDoc'}, function (doc) {
                //console.log(doc);
            });
        }
    }
    return true;
});



// YouTube to Background
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    //console.log(msg);
    if ((msg.from === 'content') && (msg.subject === 'saveData')) {
        let youtubeId = msg.data.youtube_id;
        let title = msg.data.title;
        let anno_data = msg.data.data;
        let edited = false;
        for (let i in anno_data) {
            if (anno_data[i].length > 0) {
                edited = true;
                break;
            }
        }
        if (edited == true) {
            db.annotation.where('id').equals(youtubeId).first().then((s) => {
                db.annotation.put({
                    id: youtubeId, 
                    title: title, 
                    data: anno_data
                })
            });
        } else {
            db.annotation.delete(youtubeId);
        }
    } else if ((msg.from === 'content') && (msg.subject === 'loadData')) {
        db.annotation.where('id').equals(msg.youtube_id).first().then((s) => {
            if(s == undefined) {
                sendResponse({data: {}});
            } else {
                sendResponse({data: s.data});
            }
        });
    } else if ((msg.from === 'content') && (msg.subject === 'showVideos')) {
        db.annotation.toArray().then(function(annotations){
            if (annotations == undefined) {
                sendResponse({data: []});
            } else {
                sendResponse({data: annotations});
            }
        });
    } else if ((msg.from === 'content') && (msg.subject === 'check_extension')) {
        db.on_off.where('id').equals(1).first().then((s) => {
            if (s.status == "on") {
                db.label_setting.where('id').equals(1).first().then((r) => {
                    let num = r.num_labels;
                    let labels = r.labels;
                    sendResponse({res: "true", num_labels: num, labels: labels});
                });
            } else {
                sendResponse({res: "false"});
            }
        });
    }
    else if ((msg.from === 'popup') && (msg.subject === 'switch_on_off')) {
        db.on_off.where('id').equals(1).first().then((s) => {
            if (s.status == "on") {
                db.on_off.put({
                    id: 1, 
                    status: "off"
                })
                chrome.browserAction.setBadgeText({ text: "OFF" });
            } else {
                db.on_off.put({
                    id: 1, 
                    status: "on"
                })
                chrome.browserAction.setBadgeText({ text: "ON" });
            }
        });
    }
    return true;
});
