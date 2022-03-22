function UserUtilityPanel() {
  return (
    <div className="flex-column" style={{ width: "100%" }}>
      <AudioPane />
      <CommentBox />
    </div>
  );
}

function AudioPane() {
  const [volume, setVolume] = useState();
  return <div style={{ background: "green", width: "100%" }}>Audiopane</div>;
}

function CommentBox() {
  return <div style={{ background: "orange", width: "100%" }}>CommentBox</div>;
}


