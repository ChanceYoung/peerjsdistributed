const peer = new Peer(
    '' +
        Math.floor(Math.random() * 2 ** 18)
            .toString(36)
            .padStart(4, 0),
    {
        host: location.hostname,
        debug: 1,
        path: './',
    }
)

window.peer = peer

function getLocalStream() {
    navigator.mediaDevices
        .getUserMedia({ video: false, audio: true })
        .then((stream) => {
            window.localStream = stream // A
            window.localAudio.srcObject = stream // B
            window.localAudio.autoplay = true // C
        })
        .catch((err) => {
            console.log('u got an error:' + err)
        })
}

getLocalStream()
