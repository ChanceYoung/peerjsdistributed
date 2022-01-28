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
var addpeeridButton = document.getElementById('add-button')
var connectButton = document.getElementById('connect-button')
var cueString = '<span class="cueMsg">Cue: </span>'
var connectedtome = []

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
        let indx = connectedtome.indexOf(c)
        if (indx === -1) connectedtome.push(c)
        console.log(connectedtome)
        indx = connectedtome.indexOf(c)
        console.log('Connected to: ' + connectedtome[indx].peer)
        statusInput.innerHTML =
            '<br/>' +
            statusInput.innerHTML +
            'Connected to: ' +
            connectedtome[indx].peer +
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

let groupconnections = []

const managepeerlist = () => {
    let indx = groupconnections.indexOf(recvIdInput.value)
    if (indx === -1) groupconnections.push(recvIdInput.value)
    recvIdInput.value = ''
    console.log(groupconnections)
}

function join() {
    // Close old connection
    if (conn) {
        conn.close()
    }

    // Create connection to destination peer specified in the input field
    groupconnections.forEach((id) => {
        let indx = connectedtome.findIndex(
            (id, index) => connectedtome[index].peer === id
        )
        if (indx === -1)
            connectedtome.push(peer.connect(id, { reliable: true }))
    })
    console.log(connectedtome)
    // conn = peer.connect(recvIdInput.value, {
    //     reliable: true,
    // })
    connectedtome.forEach((conn) => {
        conn.on('open', function () {
            statusInput.innerHTML =
                statusInput.innerHTML + 'Connected to: ' + conn.peer
            console.log('Connected to: ' + conn.peer)
        })

        // Handle incoming data (messages only since this is the signal sender)
        conn.on('data', function (data) {
            addMessage(`<span class=\"peerMsg\">${conn.peer}:</span> ${data}`)
        })

        conn.on('close', function () {
            statusInput.innerHTML = 'Connection closed'
        })
    })
}

function ready() {
    connectedtome.forEach((conn) => {
        conn.on('data', function (data) {
            console.log('Data recieved')
            addMessage(`<span class=\"peerMsg\"> ${conn.peer}: </span> ${data}`)
        })

        conn.on('close', function () {
            statusInput.innerHTML = 'Connection reset<br>Awaiting connection...'
            conn = null
        })
    })
}

// function signal(sigName) {
//     if (conn && conn.open) {
//         conn.send(sigName)
//         console.log(sigName + ' signal sent')
//         addMessage(cueString + sigName)
//     } else {
//         console.log('Connection is closed')
//     }
// }

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
    if (connectedtome.length >= 1) {
        var msg = sendMessageBox.value
        sendMessageBox.value = ''
        connectedtome.forEach((c) => c.send(msg))
        console.log('Sent: ' + msg)
        addMessage('<span class="selfMsg">Self: </span> ' + msg)
    } else {
        console.log('Connection is closed')
    }
})

// Clear messages box
clearMsgsButton.addEventListener('click', clearMessages)

addpeeridButton.addEventListener('click', managepeerlist)
// Start peer connection on click
connectButton.addEventListener('click', join)

initialize()
