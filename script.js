
const peer = new Peer(''+Math.random().toString(36).substr(2, 5), {
    host: location.hostname,
    debug: 1,
    path: './'
});

var recvId = document.getElementById("receiver-id");



peer.on('open', function () {
    if (peer.id === null) {
        console.log('Received null id from peer open');
        peer.id = lastPeerId;
    } else {
        lastPeerId = peer.id;
    }

    console.log('ID: ' + peer.id);
    recvId.innerHTML = "My ID: " + peer.id;
    status.innerHTML = "Awaiting connection...";
});



let conn;
function connectPeers() {
    conn = peer.connect(code);
}

peer.on('connection', function(connection){
    conn = connection;
});

const callBtn = document.querySelector('.call-btn');

callBtn.addEventListener('click', function(){
    getStreamCode();
    connectPeers();
    const call = peer.call(code, window.localStream); // A

    call.on('stream', function(stream) { // B
        window.remoteAudio.srcObject = stream; // C
        window.remoteAudio.autoplay = true; // D
        window.peerStream = stream; //E
        showConnectedContent(); //F    });
    })
})


peer.on('call', function(call) {
    const answerCall = confirm("Do you want to answer?")
 
    if(answerCall){
       call.answer(window.localStream) // A
       showConnectedContent(); // B
       call.on('stream', function(stream) { // C
          window.remoteAudio.srcObject = stream;
          window.remoteAudio.autoplay = true;
          window.peerStream = stream;
       });
    } else {
       console.log("call denied"); // D
    }
 });
 

 const hangUpBtn = document.querySelector('.hangup-btn');
hangUpBtn.addEventListener('click', function (){
    conn.close();
    showCallContent();
})


conn.on('close', function (){
    showCallContent();
})
