import HLSPlayer from "./components/HSLPlayer";

export default function VideoPage() {
  return (
    <div>
      <h1>HLS Video Player</h1>
      <HLSPlayer clientId="client1" />
    </div>
  );
}
