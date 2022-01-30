 var lastPeerId = null;
 var peer = null; // own peer object
 var myIdInput = document.getElementById("my-id");
 var recvIdInput = document.getElementById("receiver-id");
 var statusInput = document.getElementById("status");
 var message = document.getElementById("message");

 var sendMessageBox = document.getElementById("sendMessageBox");
 var idBox = document.getElementById("idBox");
 var sendButton = document.getElementById("sendButton");
 var clearMsgsButton = document.getElementById("clearMsgsButton");
 var connectButton = document.getElementById("connect-button");
 var cueString = "<span class=\"cueMsg\">Cue: </span>";

var connectionList = {};

function initialize() {
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer(''+Math.random().toString(36).substr(2, 5), {
        host: location.hostname,
        debug: 2,
        path: './'
    });

    peer.on('open', function () {
        if (peer.id === null) {
            console.log('Received null id from peer open');
            peer.id = lastPeerId;
        } else {
            lastPeerId = peer.id;
        }
    
        console.log('ID: ' + peer.id);
        myIdInput.innerHTML = "My ID: " + peer.id;
        // statusInput.innerHTML = "Awaiting connection...";
    });
    
    peer.on('connection', function (c) {
        ready(c) // Start listening for data
    });

    peer.on('disconnected', function () {
        statusInput.innerHTML = "Connection lost. Please reconnect";
        console.log('Connection lost. Please reconnect');

        // Workaround for peer.reconnect deleting previous id
        peer.id = lastPeerId;
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });
    peer.on('close', function() {
        conn = null;
        statusInput.innerHTML = "Connection destroyed. Please refresh";
        console.log('Connection destroyed');
    });
    peer.on('error', function (err) {
        console.log(err);
    });
};


function join() {

    // Create connection to destination peer specified in the input field
    var conn = peer.connect(recvIdInput.value, {
        reliable: true
    });

    conn.on('open', function () {
        statusInput.innerHTML = statusInput.innerHTML + "<br></br> Connected to: " + conn.peer;
        recvIdInput.value = "";
        connectionList[conn.peer] = conn;
    });

    // Handle incoming data (messages only since this is the signal sender)
    conn.on('data', function (data) {
        //q7okd: fto: dki34-sdf
        if(data.includes('fto:')){
            var forwardTo = data.split('fto: ')[1].split('-')[0].trim();
            var messageToForward = data.split('fto: ')[1].split('-')[1];
            console.log(`forward to inside: ${forwardTo} ${messageToForward}`);

            // console.log(connectionList.values);

            for(var key in connectionList) {
                console.log(key);
                if(key == forwardTo){
                    connectionList[key].send(messageToForward + ' os:' + conn.peer);
                    console.log("Sending message to: " + key);
                }
            }
        }

        addMessage(`<span class=\"peerMsg\">${conn.peer}:</span> ${data}`);
    });

    conn.on('close', function () {
        statusInput.innerHTML = statusInput.innerHTML + `<br></br> Connection closed with ${conn.peer}`;
    });

};

function ready(conn) {
    conn.on('open', function() {
        const answerRequest = confirm(`Do you want to connect with ${conn.peer}?`) // A

        if(answerRequest){ 
            conn.send('Friend request accepted'); // B
            console.log("Connected to: " + conn.peer);
            statusInput.innerHTML = statusInput.innerHTML +  "<br></br>  Connected to: " + conn.peer;
            connectionList[conn.peer] = conn;
        } else {
            conn.send('Friend request rejected'); // C
            conn.close();
            console.log("call denied"); // E
        }

    })
    conn.on('data', function (data) {
        console.log(`recived from ${conn.peer}`, data);
        //q7okd: forward to: dki34 sdf
        if(data.includes('fto:')){
            var forwardTo = data.split('fto:')[1].split(' ')[0];
            var messageToForward = data.split('fto:')[1].split(' ')[1];
            console.log(`forward to inside: ${forwardTo} ${messageToForward}`);

            console.log(connectionList.values);

            for(var key in connectionList) {
                var value = connectionList[key];
                if(key === forwardTo){
                    value.send(forwardTo, messageToForward);
                    console.log("Sending message to: " + key);
                }
            }
        }
        addMessage(`<span class=\"peerMsg\"> ${conn.peer}: </span> ${data}`);
    });

    conn.on('close', function () {
        statusInput.innerHTML = statusInput.innerHTML + `<br></br> Connection closed with ${conn.peer}`;
        conn = null;
    });
}


function addMessage(msg) {
    var now = new Date();
    var h = now.getHours();
    var m = addZero(now.getMinutes());
    var s = addZero(now.getSeconds());

    if (h > 12)
        h -= 12;
    else if (h === 0)
        h = 12;

    function addZero(t) {
        if (t < 10)
            t = "0" + t;
        return t;
    };

    message.innerHTML = message.innerHTML + "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " +  msg;
};

function clearMessages() {
    message.innerHTML = "";
};

// Listen for enter in message box
sendMessageBox.addEventListener('keypress', function (e) {
    var event = e || window.event;
    var char = event.which || event.keyCode;
    if (char == '13')
        sendButton.click();
});

// Send message
sendButton.addEventListener('click', function () {
    if (connectionList) {
        var msg = sendMessageBox.value;
        sendMessageBox.value = "";

        // console.log("sending messages to " + [...connectionList].join(' '));
        // connectionList.values(c => c.send(msg))
        if(idBox.value === ""){
            for(var key in connectionList) {
                var value = connectionList[key];
                value.send(msg);
                console.log("Sending message to: " + key);
            }
        } else {
            var id = idBox.value;
            connectionList[id].send(msg);
            console.log("Sending message to: " + id);
        }
        // conn.send(msg);
        console.log("Sent: " + msg);
        addMessage("<span class=\"selfMsg\">Self: </span> " + msg);
    } else {
        console.log('Connection is closed');
    }
});

// Clear messages box
clearMsgsButton.addEventListener('click', clearMessages);

// Start peer connection on click
connectButton.addEventListener('click', join);



initialize();
