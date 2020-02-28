// バックグラウンド


// 拡張のON OFF
if (window.localStorage.getItem("yta") == null){
    chrome.browserAction.setBadgeText({ text: "ON" });
    init();
}else if (window.localStorage.getItem("yta") == "true"){
    chrome.browserAction.setBadgeText({ text: "ON" });
}else if (window.localStorage.getItem("yta") == "false"){
    chrome.browserAction.setBadgeText({ text: "OFF" });
}

/* 初期化 */
function init() {
    window.localStorage.setItem("num_labels", 4);
    window.localStorage.setItem("labels", JSON.stringify(["Label 1", "Label 2", "Label 3", "Label 4", "Label 5", "Label 6", "Label 7", "Label 8", "Label 9", "Label 10"]));
    window.localStorage.setItem("annotations", JSON.stringify({}));     // [youtube ID] = [data, title]
}


// バックグラウンドから画面への指示
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, {type: 'getDoc'}, function (doc) {
            console.log(doc);
        });
    }
    return true;
});


// 画面からのメッセージに対する返答
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    console.log(msg);

    if ((msg.from === 'content') && (msg.subject === 'saveData')) {

        /* この処理重そう */
        let annotations = JSON.parse(window.localStorage.getItem("annotations"));
        let youtubeId = msg.data.youtube_id;
        let title = msg.data.title;
        let anno_data = msg.data.data;
        annotations[youtubeId] = [anno_data, title];
        window.localStorage.setItem("annotations", JSON.stringify(annotations));
    } else if ((msg.from === 'content') && (msg.subject === 'loadData')) {
        let annotations = JSON.parse(window.localStorage.getItem("annotations"));
        if (annotations[msg.youtube_id]) {
            sendResponse({data: annotations[msg.youtube_id][0]});
        } else {
            sendResponse({data: {}});
        }
    } else if ((msg.from === 'content') && (msg.subject === 'showVideos')) {
        let videos = JSON.parse(window.localStorage.getItem("annotations"));
        let ids = [];
        for (let i in videos) {
            ids.push([i, videos[i][1]]);
        }
        if (ids.length > 0) {
            sendResponse({ids: ids});
        } else {
            sendResponse({ids: []});
        }
    } else if ((msg.from === 'content') && (msg.subject === 'check_extension')) {
        if (window.localStorage.getItem("yta") == "false"){
            sendResponse({res: "false"});
        }else{
            var num = parseInt(window.localStorage.getItem("num_labels"));
            var labels = JSON.parse(window.localStorage.getItem("labels"));
            sendResponse({res: "true", num_labels: num, labels: labels});
        }
    }
    else if ((msg.from === 'popup') && (msg.subject === 'extension_off')) {
        chrome.browserAction.setBadgeText({ text: "OFF" });
    }
    else if ((msg.from === 'popup') && (msg.subject === 'extension_on')) {
        chrome.browserAction.setBadgeText({ text: "ON" });
    }
    return true;
});



