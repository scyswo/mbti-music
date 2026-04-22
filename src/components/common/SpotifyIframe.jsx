export default function SpotifyIframe({ trackId, title }) {
  if (!trackId) return null;
  const id = trackId.replace('spotify:track:', '');
  return (
    <iframe
      src={`https://open.spotify.com/embed/track/${id}?utm_source=generator&theme=0`}
      width="100%" height="80" frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      style={{ borderRadius: '14px', display: 'block' }}
      title={title}
    />
  );
}
