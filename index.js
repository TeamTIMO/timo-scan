const config = require('./config.json')
const mqtt = require('mqtt')
var client = mqtt.connect(config.mqtt.host)
const { StreamCamera, Codec } = require('pi-camera-connect')
const QRCode = require('qrcode-reader')
var qr = new QRCode()

const runApp = async function () {
  const streamCamera = new StreamCamera({
    codec: Codec.MJPEG
  })
  await streamCamera.startCapture()

  setInterval(async function () {
    const image = await streamCamera.takeImage()

    const value = await new Promise((resolve, reject) => {
      qr.callback = (err, v) => err != null ? reject(err) : resolve(v)
      qr.decode(image.bitmap)
    })
    let json = {}
  
    if (value.result.includes('://')) {
      let splitted = value.result.split('://')
      json.type = splitted[0].toLowerCase()
      json.content = splitted[1]
    } else {
      json.type = 'text'
      json.content = value.result
    }

    client.publish(config.mqtt.topic, json)
  }, 300)

  await streamCamera.stopCapture()
}

client.on('connect', function () {
  runApp()
})
