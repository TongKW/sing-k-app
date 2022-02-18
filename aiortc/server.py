import asyncio, json, os, cv2
from aiohttp import web
from aiortc import (MediaStreamTrack, RTCPeerConnection, RTCSessionDescription, VideoStreamTrack)
from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder, MediaRelay

ROOT = os.path.dirname(__file__)

##### attribute #####
relay = MediaRelay()
video_source = None
pcs = []


class VideoTransformTrack(MediaStreamTrack):
    kind = "video"

    def __init__(self, track, transform):
        super().__init__()  # don't forget this!
        self.track = track
        self.transform = transform

    async def recv(self):
        frame = await self.track.recv()
        return frame
    

class LocalVideoStream(VideoStreamTrack):
    def __init__(self):
        super().__init__()
        self.track = video_source

    async def recv(self):
        frame = await self.track.recv()
        return frame

async def index(request):
    content = open(os.path.join(ROOT, 'index.html'), 'r').read()
    return web.Response(content_type='text/html', text=content)

async def streamer_index(request):
    content = open(os.path.join(ROOT, 'streamer.html'), 'r').read()
    return web.Response(content_type='text/html', text=content)

async def javascript(request):
    content = open(os.path.join(ROOT, 'client.js'), 'r').read()
    return web.Response(content_type='application/javascript', text=content)

async def streamer_javascript(request):
    content = open(os.path.join(ROOT, "streamer.js"), "r").read()
    return web.Response(content_type="application/javascript", text=content)



async def streamer_offer(request):
    params = await request.json()
    print(params)
    print(params["is_client"])
    offer = RTCSessionDescription(
        sdp=params['sdp'],
        type=params['type'])

    pc = RTCPeerConnection()
    pcs.append(pc)
    
    
    @pc.on("datachannel")
    def on_datachannel(channel):
        @channel.on("message")
        def on_message(message):
            if isinstance(message, str) and message.startswith("ping"):
                channel.send("pong" + message[4:])

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        print("Connection state is %s", pc.connectionState)
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)
    

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)
            
    @pc.on("track")
    def on_track(track):
        global video_source
        video_source = VideoTransformTrack(relay.subscribe(track), transform=params["video_transform"])
        pc.addTrack(
            VideoTransformTrack(
                relay.subscribe(track), transform=params["video_transform"]
            )
        )

        @track.on("ended")
        async def on_ended():
            print("Track %s ended", track.kind)
            await recorder.stop()

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return web.Response(
        content_type='application/json',
        text=json.dumps({
            'sdp': pc.localDescription.sdp,
            'type': pc.localDescription.type
        }))

async def audience_offer(request):
    params = await request.json()
    offer = RTCSessionDescription(
        sdp=params['sdp'],
        type=params['type'])

    pc = RTCPeerConnection()
    pcs.append(pc)

    pc.addTrack(video_source)
        
    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.Response(
        content_type='application/json',
        text=json.dumps({
            'sdp': pc.localDescription.sdp,
            'type': pc.localDescription.type
        }))


async def on_shutdown(app):
    # close peer connections
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)

if __name__ == '__main__':
    app = web.Application()
    app.on_shutdown.append(on_shutdown)
    app.router.add_get('/', index)
    app.router.add_get('/client.js', javascript)
    app.router.add_post('/offer', audience_offer)
    app.router.add_get('/streamer', streamer_index)
    app.router.add_get('/streamer.js', streamer_javascript)
    app.router.add_post('/streamer_offer', streamer_offer)
    
    
    web.run_app(app)