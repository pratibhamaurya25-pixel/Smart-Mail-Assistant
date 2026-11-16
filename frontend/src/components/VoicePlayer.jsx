import { useEffect, useRef, useState } from "react";

export function useVoiceAssistant() {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState("idle");
  const [currentMessageId, setCurrentMessageId] = useState("");
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const utteranceRef = useRef(null);
  const generationRef = useRef(0);
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function";

  useEffect(() => {
    if (!supported) return undefined;

    const synthesis = window.speechSynthesis;
    const updateVoices = () => setVoices(synthesis.getVoices());
    updateVoices();
    synthesis.addEventListener("voiceschanged", updateVoices);

    return () => synthesis.removeEventListener("voiceschanged", updateVoices);
  }, [supported]);

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  function stop() {
    generationRef.current += 1;
    if (supported) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setStatus("idle");
    setCurrentMessageId("");
    setError("");
  }

  function play(message) {
    const text = `${message.subject || ""}. ${message.message || ""}`.trim();
    if (!supported) {
      setError("Speech playback is not available in this browser.");
      return;
    }

    const synthesis = window.speechSynthesis;
    generationRef.current += 1;
    const generation = generationRef.current;
    synthesis.cancel();
    utteranceRef.current = null;
    setStatus("idle");
    setCurrentMessageId("");
    setError("");

    if (!text || text === ".") {
      setError("This message has no text to read.");
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.volume = muted ? 0 : 1;
    const voice = voices.find((candidate) => candidate.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      if (generation === generationRef.current) setStatus("speaking");
    };
    utterance.onend = () => {
      if (generation !== generationRef.current) return;
      utteranceRef.current = null;
      setStatus("idle");
      setCurrentMessageId("");
    };
    utterance.onerror = (event) => {
      if (generation !== generationRef.current) return;
      utteranceRef.current = null;
      setStatus("idle");
      setCurrentMessageId("");
      setError(`Speech playback failed${event.error ? `: ${event.error}` : "."}`);
    };

    utteranceRef.current = utterance;
    setCurrentMessageId(message._id || "compose");
    setStatus("speaking");
    try {
      synthesis.speak(utterance);
    } catch (speechError) {
      utteranceRef.current = null;
      setStatus("idle");
      setCurrentMessageId("");
      setError(
        speechError instanceof Error
          ? `Speech playback failed: ${speechError.message}`
          : "Speech playback failed."
      );
    }
  }

  function pause() {
    if (!supported || status !== "speaking") return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }

  function resume() {
    if (!supported || status !== "paused" || muted) return;
    window.speechSynthesis.resume();
    setStatus("speaking");
  }

  function toggleMute() {
    if (!supported) return;
    const nextMuted = !muted;
    if (utteranceRef.current) utteranceRef.current.volume = nextMuted ? 0 : 1;
    setMuted(nextMuted);
  }

  return {
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    status,
    currentMessageId,
    muted,
    error,
    supported,
    play,
    pause,
    resume,
    stop,
    toggleMute,
  };
}

export default function VoicePlayer({
  message,
  playerId,
  voiceAssistant,
}) {
  const {
    voices,
    selectedVoice,
    setSelectedVoice,
    rate,
    setRate,
    status,
    currentMessageId,
    muted,
    error,
    supported,
    play,
    pause,
    resume,
    stop,
    toggleMute,
  } = voiceAssistant;
  const textAvailable = Boolean(
    `${message.subject || ""}${message.message || ""}`.trim()
  );
  const isCurrentMessage =
    currentMessageId === (message._id || "compose") && status !== "idle";

  return (
    <section className="voice-player" aria-label={`Voice player: ${message.subject || "message"}`}>
      <div className="voice-player-heading">
        <div>
          <p className="voice-player-label">
            {isCurrentMessage ? "CURRENTLY READING" : "READ MESSAGE ALOUD"}
          </p>
          <h3>{message.subject || "Untitled message"}</h3>
        </div>
        {isCurrentMessage && (
          <span className="voice-status" role="status">
            {muted ? "Muted" : status === "paused" ? "Paused" : "Speaking"}
          </span>
        )}
      </div>
      <p className="voice-message-preview">{message.message || "No message content."}</p>

      {supported && (
        <div className="voice-settings">
          {voices.length > 1 && (
            <label htmlFor={`${playerId}-voice`}>
              Voice
              <select
                id={`${playerId}-voice`}
                value={selectedVoice}
                onChange={(event) => setSelectedVoice(event.target.value)}
              >
                <option value="">Browser default</option>
                {voices.map((voice) => (
                  <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </label>
          )}
          <label htmlFor={`${playerId}-rate`} className="speech-rate">
            Speed <span>{rate.toFixed(1)}×</span>
            <input
              id={`${playerId}-rate`}
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(event) => setRate(Number(event.target.value))}
            />
          </label>
        </div>
      )}

      <div className="voice-controls">
        <button
          type="button"
          onClick={() => play(message)}
          disabled={!supported || !textAvailable}
        >
          Play
        </button>
        <button
          className="voice-secondary-button"
          type="button"
          onClick={pause}
          disabled={!isCurrentMessage || status !== "speaking" || muted}
        >
          Pause
        </button>
        <button
          className="voice-secondary-button"
          type="button"
          onClick={resume}
          disabled={!isCurrentMessage || status !== "paused" || muted}
        >
          Resume
        </button>
        <button
          className="voice-secondary-button"
          type="button"
          onClick={stop}
          disabled={!isCurrentMessage}
        >
          Stop
        </button>
        <button
          className="voice-secondary-button"
          type="button"
          onClick={toggleMute}
          disabled={!supported}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
      </div>

      {!supported && (
        <p className="voice-feedback" role="status">
          Speech playback is not available in this browser.
        </p>
      )}
      {supported && !textAvailable && (
        <p className="voice-feedback" role="status">There is no text in this message to read.</p>
      )}
      {error && <p className="voice-feedback error" role="alert">{error}</p>}
    </section>
  );
}
