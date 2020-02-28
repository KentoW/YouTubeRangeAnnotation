
/* 初期化 */
if (window.localStorage.getItem("num_labels") != null){
    draw_popup();
}

/* draw label fields */
function draw_popup() {
    var num = parseInt(window.localStorage.getItem("num_labels"));
    $("#num_label_k").text("# of label:" + String(num))
    $("#num_label_v").val(num);

    $("#num_label_name").empty();
    var labels = JSON.parse(window.localStorage.getItem("labels"));
    for (let i=0; i<Number(window.localStorage.getItem("num_labels")); i++) {
        let $item = $("<div/>").addClass("num_label_item");
        let label_name = labels[i];
        $("<div/>").addClass("num_label_item_k").text("Label " + String(i+1)).appendTo($item);
        $("<input/>").addClass("num_label_item_v").attr("label_id", i).attr("type", "text").attr("placeholder", "Type label name").val(label_name).appendTo($item);
        $item.appendTo("#num_label_name");
    }
}


/* download data */
$(document).on("click", "#download", function(){
    write_file();
});

function write_file() {
    let annotations = JSON.parse(window.localStorage.getItem("annotations"));
    let labels = JSON.parse(window.localStorage.getItem("labels"));
    var num = parseInt(window.localStorage.getItem("num_labels"));
    let output = {}
    if (Object.keys(annotations).length > 0) {
        for (let youtube_id in annotations) {
            let has_value = false;
            let dict = {"@title": annotations[youtube_id][1]};
            for (let i=0; i<num; i++) {
                let label_name = labels[i];
                dict[label_name] = [];
                for (let j in annotations[youtube_id][0][i]) {
                    has_value = true;
                    dict[label_name].push(annotations[youtube_id][0][i][j]);
                }
            }
            if (has_value = true) {
                output[youtube_id] = dict;
            }
        }
    }
    let resultJson = JSON.stringify(output);
    let downLoadLink = document.createElement("a");
    downLoadLink.download = "YTRA_result.json";
    downLoadLink.href = URL.createObjectURL(new Blob([resultJson], {type: "text.plain"}));
    downLoadLink.dataset.downloadurl = ["text/plain", downLoadLink.download, downLoadLink.href].join(":");
    downLoadLink.click();
}


/* change num of label */
$(document).on("change", "#num_label_v", function(){
    var num = $(this).val();
    window.localStorage.setItem("num_labels", num);
    draw_popup();
});

/* change label names */
$(document).on("change", ".num_label_item_v", function(){
    var labels = JSON.parse(window.localStorage.getItem("labels"));
    var label_id = parseInt($(this).attr("label_id"));
    labels[label_id] = $(this).val();
    window.localStorage.setItem("labels", JSON.stringify(labels));
});



/* ON OFF */
$(document).on("click", "#on_off", function(){
    if (window.localStorage.getItem("yta") == "true"){
        window.localStorage.setItem("yta", "false");
        chrome.runtime.sendMessage({
            from:    'popup', 
            subject: 'extension_off' 
        });
        window.close();
    }else{
        window.localStorage.setItem("yta", "true");
        chrome.runtime.sendMessage({
            from:    'popup', 
            subject: 'extension_on' 
        });
        window.close();
    }
}); 
