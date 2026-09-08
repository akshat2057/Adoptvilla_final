export default function Loader() {
  return (
    <div className="loader-container">
      <video
        src="/loader/loader.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="loader-video"
      />
    </div>
  );
}