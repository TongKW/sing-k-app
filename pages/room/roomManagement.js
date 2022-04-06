import { React } from "react";
import Icon from "../../component/elements/Icon";
import { styled } from "@mui/material/styles";
import { Box, Avatar } from "@mui/material";
//import { userDataBase } from "./mockup";

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
        otherUsersList={props.otherUsersList}
        currentRoomType={props.currentRoomType}
        roomCreatorId={props.roomCreatorId}
      />
      <RoomFunctionKeys
        isMuted={props.isMuted}
        isRoomCreator={props.isRoomCreator}
        currentRoomType={props.currentRoomType}
        handleMuteUnmute={props.handleMuteUnmute}
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
        fontSize: "30px",
        color: "#FFFFFB",
      }}
      style={{ backgroundColor: "#376E6F", justifyContent: "center",}}
    >
      <h1>Room ID: {props.roomId}</h1>
    </Box>
  );
}

function OtherUserList(props) {
  return (
    <div
      id="userlist"
      className="scrollbar"
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

        return (
          <User
            key={index}
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
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex start",
        padding: "5px"
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          width: "30%"
        }}
      >
        <UserAvatar src={props.userAvatar} mx="auto" />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          fontSize: "25px",
          width: "60%"
        }}
      >
        <h1>{props.username}</h1>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "10%"
        }}
      >
        <OtherMutedIcon
          otherIsMuted={props.otherIsMuted}
          isRoomCreator={props.isRoomCreator}
          currentRoomType={props.currentRoomType}
        />
      </Box>
      <audio autoPlay={true} className="hidden" id={`audio-${props.userId}`}>
        <source type="audio/ogg" />
      </audio>
    </Box>
  );
}

function OtherMutedIcon(props) {
  if (props.currentRoomType === "streaming" && props.otherIsRoomCreator) {
    if (props.otherIsMuted)
      return (
        <Icon
          icon="/images/mute-microphone.png"
          alt="mute_icon"
          length="50"
        />
      );
    else
      return (
        <Icon icon="/images/others-microphone.png" alt="mic_icon" length="75" />
      );
  } else if (props.currentRoomType === "streaming" && !props.otherIsRoomCreator)
    return <div>Nothing</div>;
  else if (props.currentRoomType === "private" && props.otherIsMuted)
    return (
      <Icon
        icon="/images/mute-microphone.png"
        alt="mute_icon"
        length="25"
      />
    );
  else
    return (
      <Icon icon="/images/microphone.png" alt="mic_icon" length="25" />
    );
}

function RoomFunctionKeys(props) {
  return (
    <Box
      sx={{
        background: "#323846",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        height: "5%",
      }}
    >
      <Mute
        isMuted={props.isMuted}
        isRoomCreator={props.isRoomCreator}
        currentRoomType={props.currentRoomType}
        handleMuteUnmute={props.handleMuteUnmute}
      />
    </Box>
  );
}

function Mute(props) {
  if (
    props.currentRoomType === "streaming" &&
    props.isRoomCreator &&
    !props.isMuted
  ) {
    return (
      <Icon
        icon="/images/microphone.png"
        alt="mute_icon"
        length="30"
        onClick={props.handleMuteUnmute}
        style={{ cursor: "pointer"}}
      />
    );
  } else if (
    props.currentRoomType === "streaming" &&
    props.isRoomCreator &&
    props.isMuted
  ) {
    return (
      <Icon
        icon="/images/mute-microphone.png"
        alt="unmute_icon"
        length="30"
        onClick={props.handleMuteUnmute}
        style={{ cursor: "pointer"}}
      />
    );
  } else if (props.currentRoomType === "streaming" && !props.isRoomCreator) {
    return <div className="flex">Nothing</div>;   
  } else if (props.currentRoomType === "private" && !props.isMuted) {
    return (
      <Icon
        icon="/images/microphone.png"
        alt="mute_icon"
        length="30"
        onClick={props.handleMuteUnmute}
        style={{ cursor: "pointer" }}
      />
    );
  } else if (props.currentRoomType === "private" && props.isMuted) {
    return (
      <Icon
        icon="/images/mute-microphone.png"
        alt="unmute_icon"
        length="30"
        onClick={props.handleMuteUnmute}
        style={{ cursor: "pointer"}}
      />
    );
  }
}
