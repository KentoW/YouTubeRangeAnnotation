var db = new Dexie("yta_database");
db.version(1).stores({annotation: 'id, title, data', label_setting: "id, num_labels, labels", on_off: "id, status"});
db.open();
db.label_setting.where('id').equals(1).first().then((r) => {
    draw_popup();
});

/* draw label fields */
function draw_popup() {
    db.label_setting.where('id').equals(1).first().then((r) => {
        let num = r.num_labels;
        let labels = r.labels;
        $("#num_label_k").text("# of label:" + String(num));
        $("#num_label_v").val(num);
        $("#num_label_name").empty();
        for (let i=0; i<num; i++) {
            let $item = $("<div/>").addClass("num_label_item");
            let label_name = labels[i];
            $("<div/>").addClass("num_label_item_k").text("Label " + String(i+1)).appendTo($item);
            $("<input/>").addClass("num_label_item_v").attr("label_id", i).attr("type", "text").attr("placeholder", "Type label name").val(label_name).appendTo($item);
            $item.appendTo("#num_label_name");
        }
    });
}

/* download data */
$(document).on("click", "#download", function(){
    write_file();
});

function write_file() {
    db.label_setting.where('id').equals(1).first().then((r) => {
        /* download label data */
        let labels = r.labels;
        let num = r.num_labels;
        let labelJson = JSON.stringify(labels.slice(0, num));
        let downLoadLink = document.createElement("a");
        downLoadLink.download = "YTRA_label.jsonl";
        downLoadLink.href = URL.createObjectURL(new Blob([labelJson], {type: "text.plain"}));
        downLoadLink.dataset.downloadurl = ["text/plain", downLoadLink.download, downLoadLink.href].join(":");
        downLoadLink.click();
        /* download annotation data */
        db.annotation.toArray().then(function(annotations){
            let output = [];
            for (let d in annotations) {
                output.push(JSON.stringify(annotations[d]));
            }
            let resultJson = output.join("\n");
            let downLoadLink = document.createElement("a");
            downLoadLink.download = "YTRA_data.jsonl";
            downLoadLink.href = URL.createObjectURL(new Blob([resultJson], {type: "text.plain"}));
            downLoadLink.dataset.downloadurl = ["text/plain", downLoadLink.download, downLoadLink.href].join(":");
            downLoadLink.click();
        })
    });
}

/* change num of label */
$(document).on("change", "#num_label_v", function(){
    var num = $(this).val();
    db.label_setting.where('id').equals(1).first().then((r) => {
        db.label_setting.put({
            id: 1, 
            num_labels: num, 
            labels: r.labels
        })
        draw_popup();
    });
});

/* change label names */
$(document).on("change", ".num_label_item_v", function(){
    db.label_setting.where('id').equals(1).first().then((r) => {
        let labels = r.labels;
        var label_id = parseInt($(this).attr("label_id"));
        labels[label_id] = $(this).val();
        db.label_setting.put({
            id: 1, 
            num_labels: r.num_labels, 
            labels: labels
        })
    });
});

/* toggle ON-OFF */
$(document).on("click", "#on_off", function(){
    chrome.runtime.sendMessage({
        from:    'popup', 
        subject: 'switch_on_off' 
    });
}); 
