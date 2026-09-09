import "./DogAssistant.css";

export default function DogAssistant() {
  return (
    <div className="dog-assistant">
  <video
  autoPlay
  loop
  muted
  playsInline
  preload="auto"
>
  <source src="/assets/dog/dog-assistant.webm" type="video/webm" />
  <source src="/assets/dog/dog-assistant-alpha.mov" type="video/quicktime" />
</video>
</div>
  );
}
