import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import api from '../../api/client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function LiveClassPage() {
  const { id } = useParams();
  const { accessToken, user } = useSelector((s) => s.auth);
  const [joinInfo, setJoinInfo] = useState(null);
  const [error, setError] = useState('');
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const localVideoRef = useRef(null);
  const peersRef = useRef({});
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteContainerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function setup() {
      try {
        const { data } = await api.get(`/live-classes/${id}/join`);
        if (cancelled) return;
        setJoinInfo(data.data);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const socket = io(SOCKET_URL, {
          auth: { token: accessToken },
          transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => setConnectionStatus('connected'));
        socket.on('disconnect', () => setConnectionStatus('disconnected'));
        socket.on('connect_error', (err) => setConnectionStatus(`error: ${err.message}`));

        socket.emit('live:join', { roomId: data.data.roomId }, async (ack) => {
          if (!ack?.ok) {
            setError(ack?.error || 'Failed to join room');
            return;
          }
          setParticipants(ack.participants || []);
          for (const p of ack.participants || []) {
            if (p.socketId !== socket.id) {
              await createPeer(p.socketId, true, data.data.iceServers, data.data.roomId);
            }
          }
        });

        socket.on('live:participant-joined', async (p) => {
          setParticipants((prev) => [...prev.filter((x) => x.socketId !== p.socketId), p]);
          await createPeer(p.socketId, false, data.data.iceServers, data.data.roomId);
        });

        socket.on('live:participant-left', ({ socketId }) => {
          setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
          if (peersRef.current[socketId]) {
            peersRef.current[socketId].close();
            delete peersRef.current[socketId];
          }
          const el = document.getElementById(`remote-${socketId}`);
          el?.remove();
        });

        socket.on('webrtc:signal', async ({ from, signal }) => {
          let pc = peersRef.current[from];
          if (!pc) {
            pc = await createPeer(from, false, data.data.iceServers, data.data.roomId);
          }
          if (signal.type === 'offer') {
            await pc.setRemoteDescription(signal);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc:signal', {
              roomId: data.data.roomId,
              targetSocketId: from,
              signal: answer,
            });
          } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(signal);
          } else if (signal.candidate) {
            try {
              await pc.addIceCandidate(signal);
            } catch {
              /* ignore late candidates */
            }
          }
        });

        socket.on('live:chat', (msg) => {
          setMessages((prev) => [...prev, msg]);
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Unable to join live class');
      }
    }

    setup();

    return () => {
      cancelled = true;
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (socketRef.current && joinInfo?.roomId) {
        socketRef.current.emit('live:leave', { roomId: joinInfo.roomId });
      }
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, accessToken]);

  async function createPeer(remoteSocketId, initiator, iceServers, roomId) {
    if (peersRef.current[remoteSocketId]) return peersRef.current[remoteSocketId];

    const pc = new RTCPeerConnection({ iceServers: iceServers || [{ urls: 'stun:stun.l.google.com:19302' }] });
    peersRef.current[remoteSocketId] = pc;

    localStreamRef.current?.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc:signal', {
          roomId,
          targetSocketId: remoteSocketId,
          signal: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      let wrapper = document.getElementById(`remote-${remoteSocketId}`);
      if (!wrapper && remoteContainerRef.current) {
        wrapper = document.createElement('div');
        wrapper.id = `remote-${remoteSocketId}`;
        wrapper.className = 'live-tile';
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.srcObject = event.streams[0];
        const label = document.createElement('div');
        label.className = 'label-chip';
        label.textContent = 'Participant';
        wrapper.appendChild(video);
        wrapper.appendChild(label);
        remoteContainerRef.current.appendChild(wrapper);
      }
    };

    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit('webrtc:signal', {
        roomId,
        targetSocketId: remoteSocketId,
        signal: offer,
      });
    }

    return pc;
  }

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioEnabled(track.enabled);
      socketRef.current?.emit('live:media-state', {
        roomId: joinInfo.roomId,
        audio: track.enabled,
        video: videoEnabled,
      });
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoEnabled(track.enabled);
      socketRef.current?.emit('live:media-state', {
        roomId: joinInfo.roomId,
        audio: audioEnabled,
        video: track.enabled,
      });
    }
  };

  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socketRef.current?.emit('live:chat', { roomId: joinInfo.roomId, message: chatInput.trim() });
    setChatInput('');
  };

  const leave = () => {
    socketRef.current?.emit('live:leave', { roomId: joinInfo?.roomId });
    window.history.back();
  };

  if (error) return <div className="container page alert alert-error">{error}</div>;
  if (!joinInfo) return <div className="container page empty">Joining live class…</div>;

  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <h1>{joinInfo.liveClass.title}</h1>
          <p className="muted">
            {joinInfo.liveClass.course?.title} · Role: {joinInfo.role} · Status: {connectionStatus}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" type="button" onClick={toggleAudio}>
            {audioEnabled ? 'Mute' : 'Unmute'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={toggleVideo}>
            {videoEnabled ? 'Stop camera' : 'Start camera'}
          </button>
          <button className="btn btn-danger" type="button" onClick={leave}>
            Leave
          </button>
        </div>
      </div>

      <div className="live-grid">
        <div>
          <div className="live-videos" ref={remoteContainerRef}>
            <div className="live-tile">
              <video ref={localVideoRef} autoPlay muted playsInline />
              <div className="label-chip">You ({user?.name})</div>
            </div>
          </div>
          <div className="card" style={{ marginTop: '1rem' }}>
            <h3>Participants ({participants.length})</h3>
            <ul>
              {participants.map((p) => (
                <li key={p.socketId}>{p.name} · {p.role}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="card chat-box">
          <h3>Live chat</h3>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div className="chat-item" key={`${m.at}-${i}`}>
                <strong>{m.from}:</strong> {m.message}
              </div>
            ))}
            {!messages.length && <p className="muted">No messages yet.</p>}
          </div>
          <form onSubmit={sendChat} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message"
            />
            <button className="btn btn-primary" type="submit">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
