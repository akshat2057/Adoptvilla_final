import "./DogAssistant.css";

export default function DogAssistant() {
  return (
    <div className="dog-assistant">
      <video
        src="/assets/dog/dog-assistant.webm"
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
}