var lastPeerId = null
var peer = null // own peer object
var conn = null
var myIdInput = document.getElementById('my-id')
var recvIdInput = document.getElementById('receiver-id')
var statusInput = document.getElementById('status')
var message = document.getElementById('message')

var sendMessageBox = document.getElementById('sendMessageBox')
var sendButton = document.getElementById('sendButton')
var clearMsgsButton = document.getElementById('clearMsgsButton')
var connectButton = document.getElementById('connect-button')
var cueString = '<span class="cueMsg">Cue: </span>'

function initialize() {
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer('' + Math.random().toString(36).substr(2, 5), {
        host: location.hostname,
        debug: 2,
        path: './',
    })

    peer.on('open', function () {
        if (peer.id === null) {
            console.log('Received null id from peer open')
            peer.id = lastPeerId
        } else {
            lastPeerId = peer.id
        }

        console.log('ID: ' + peer.id)
        myIdInput.innerHTML = 'My ID: ' + peer.id
        statusInput.innerHTML = 'Awaiting connection...'
    })

    peer.on('connection', function (c) {
        // Allow only a single connection
        // if (conn && conn.open) {
        //     c.on('open', function() {
        //         c.send("Already connected to another client");
        //         setTimeout(function() { c.close(); }, 500);
        //     });
        //     return;
        // }

        conn = c
        console.log('Connected to: ' + conn.peer)
        statusInput.innerHTML = 'Connected to: ' + conn.peer
        ready() // Start listening for data
    })

    peer.on('disconnected', function () {
        statusInput.innerHTML = 'Connection lost. Please reconnect'
        console.log('Connection lost. Please reconnect')

        // Workaround for peer.reconnect deleting previous id
        peer.id = lastPeerId
        peer._lastServerId = lastPeerId
        peer.reconnect()
    })
    peer.on('close', function () {
        conn = null
        statusInput.innerHTML = 'Connection destroyed. Please refresh'
        console.log('Connection destroyed')
    })
    peer.on('error', function (err) {
        console.log(err)
        alert('' + err)
    })
}

function join() {
    // Close old connection
    if (conn) {
        conn.close()
    }

    // Create connection to destination peer specified in the input field
    conn = peer.connect(recvIdInput.value, {
        reliable: true,
    })

    conn.on('open', function () {
        statusInput.innerHTML = 'Connected to: ' + conn.peer
        console.log('Connected to: ' + conn.peer)
        recvIdInput.value = ''

        // Check URL params for comamnds that should be sent immediately
        var command = getUrlParam('command')
        if (command) conn.send(command)
    })

    // Handle incoming data (messages only since this is the signal sender)
    conn.on('data', function (data) {
        addMessage(`<span class=\"peerMsg\">${conn.peer}:</span> ${data}`)
    })

    conn.on('close', function () {
        statusInput.innerHTML = 'Connection closed'
    })
}

function ready() {
    conn.on('data', function (data) {
        console.log('Data recieved')
        addMessage(`<span class=\"peerMsg\"> ${conn.peer}: </span> ${data}`)
    })

    conn.on('close', function () {
        statusInput.innerHTML = 'Connection reset<br>Awaiting connection...'
        conn = null
    })
}

function signal(sigName) {
    if (conn && conn.open) {
        conn.send(sigName)
        console.log(sigName + ' signal sent')
        addMessage(cueString + sigName)
    } else {
        console.log('Connection is closed')
    }
}

function addMessage(msg) {
    var now = new Date()
    var h = now.getHours()
    var m = addZero(now.getMinutes())
    var s = addZero(now.getSeconds())

    if (h > 12) h -= 12
    else if (h === 0) h = 12

    function addZero(t) {
        if (t < 10) t = '0' + t
        return t
    }

    message.innerHTML =
        message.innerHTML +
        '<br><span class="msg-time">' +
        h +
        ':' +
        m +
        ':' +
        s +
        '</span>  -  ' +
        msg
}

function clearMessages() {
    message.innerHTML = ''
}

// Listen for enter in message box
sendMessageBox.addEventListener('keypress', function (e) {
    var event = e || window.event
    var char = event.which || event.keyCode
    if (char == '13') sendButton.click()
})

// Send message
sendButton.addEventListener('click', function () {
    if (conn && conn.open) {
        var msg = sendMessageBox.value
        sendMessageBox.value = ''
        conn.send(msg)
        console.log('Sent: ' + msg)
        addMessage('<span class="selfMsg">Self: </span> ' + msg)
    } else {
        console.log('Connection is closed')
    }
})

// Clear messages box
clearMsgsButton.addEventListener('click', clearMessages)

// Start peer connection on click
connectButton.addEventListener('click', join)

initialize()
