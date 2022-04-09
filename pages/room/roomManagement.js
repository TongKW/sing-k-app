import { React, useEffect } from "react";
import Icon from "../../component/elements/Icon";
import { styled } from "@mui/material/styles";
import { Box, Avatar } from "@mui/material";
import Button from "../../component/elements/button";

const UserAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => ["src"].includes(prop),
})(({ src, theme }) => ({
  width: theme.spacing(10),
  height: theme.spacing(10),
  border: `3px solid ${theme.palette.background.paper}`,
  src: src,
}));

export default function RoomMangementPanel(props) {
  return (
    <Box sx={{ height: "100%" }} style={{ borderRadius: "25px" }}>
      <RoomId roomId={props.roomId} />
      <OtherUserList
        peerConnections={props.peerConnections}
        otherUsersList={props.otherUsersList}
        currentRoomType={props.currentRoomType}
        roomCreatorId={props.roomCreatorId}
      />
      <RoomFunctionKeys
        isMuted={props.isMuted}
        isRoomCreator={props.isRoomCreator}
        currentRoomType={props.currentRoomType}
        handleMuteUnmute={props.handleMuteUnmute}
        closeHandler={props.closeHandler}
      />
    </Box>
  );
}

function RoomId(props) {
  return (
    <Box
      sx={{
        display: "flex",
        height: "5%",
        fontSize: "3vmin",
        color: "#FFFFFB",
      }}
      style={{ backgroundColor: "#376E6F" }}
    >
      <h1>Room ID: {props.roomId}</h1>
    </Box>
  );
}

function OtherUserList(props) {
  return (
    <div
      id="userlist"
      className="px-2 scrollbar"
      style={{
        background: "#323846",
        height: "90%",
        overflowY: "auto",
      }}
    >
      {Object.keys(props.otherUsersList).map((userId, index) => {
        //TODO: get user data from userId

        const username = props.otherUsersList[userId].username;
        const userAvatar = props.otherUsersList[userId].avatar;
        const otherIsMuted = props.otherUsersList[userId].isMuted;
        const isRoomCreator = userId === props.roomCreatorId;
        const currentRoomType = props.currentRoomType;
        console.log(username, otherIsMuted);

        return (
          <User
            key={index}
            peerConnections={props.peerConnections}
            userId={userId}
            username={username}
            userAvatar={userAvatar}
            otherIsMuted={otherIsMuted}
            isRoomCreator={isRoomCreator}
            currentRoomType={currentRoomType}
          />
        );
      })}
    </div>
  );
}

function User(props) {
  useEffect(() => {
    Object.keys(props.peerConnections.current).map((userId) => {
      if (!props.peerConnections.current.hasOwnProperty(userId)) return;
      if (!props.peerConnections.current[userId].hasOwnProperty("audioStream"))
        return;
      const audioElem = document.getElementById(`audio-${userId}`);
      if (props.peerConnections.current[userId].isMuted) {
        audioElem.srcObject = null;
      } else {
        audioElem.srcObject = props.peerConnections.current[userId].audioStream;
      }
    });
  }, [props.peerConnections]);
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex start",
        padding: "5px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          width: "30%",
        }}
      >
        <UserAvatar src={props.userAvatar} mx="auto" />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          fontSize: "3vmin",
          width: "60%",
        }}
      >
        <h1>{props.username}</h1>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "10%",
        }}
      >
        <OtherMutedIcon isMuted={props.otherIsMuted} />
      </Box>
      <audio autoPlay={true} className="hidden" id={`audio-${props.userId}`}>
        <source type="audio/ogg" />
      </audio>
    </Box>
  );
}

function OtherMutedIcon(props) {
  return (
    <>
      {props.isMuted ? (
        <Icon icon="/images/mute-microphone.png" alt="mute_icon" length="25" />
      ) : (
        <Icon icon="/images/microphone.png" alt="mic_icon" length="25" />
      )}
    </>
  );
}

function RoomFunctionKeys(props) {
  return (
    <Box
      sx={{
        background: "#323846",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        height: "5%",
      }}
    >
      <Mute
        isMuted={props.isMuted}
        isRoomCreator={props.isRoomCreator}
        currentRoomType={props.currentRoomType}
        handleMuteUnmute={props.handleMuteUnmute}
      />
      <Box sx={{ display: "flex" }}>
        <Icon
          onClick={props.closeHandler}
          length="30"
          icon="/images/leave_icon.png"
          style={{ cursor: "pointer" }}
        >
          {" "}
          Close{" "}
        </Icon>
      </Box>
    </Box>
  );
}

function Mute(props) {
  const usableUser =
    props.currentRoomType === "private" ||
    (props.currentRoomType === "streaming" && props.isRoomCreator);
  return (
    <Icon
      icon={
        props.isMuted ? "/images/mute-microphone.png" : "/images/microphone.png"
      }
      alt={props.isMuted ? "mute_microphone" : "microphone"}
      length="30"
      onClick={usableUser ? props.handleMuteUnmute : () => {}}
      style={{ cursor: usableUser ? "pointer" : "not-allowed" }}
    />
  );
}
