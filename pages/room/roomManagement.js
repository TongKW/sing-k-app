import { React } from "react";
import Icon from "../../component/elements/Icon";
import { styled } from "@mui/material/styles";
import { Box, Avatar } from "@mui/material";
import { userDataBase } from "./mockup";

const UserAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => ["src"].includes(prop),
})(({ src, theme }) => ({
  width: theme.spacing(8),
  height: theme.spacing(8),
  border: `4px solid ${theme.palette.background.paper}`,
  src: src,
}));

export default function RoomMangementPanel(props) {
  return (
    <Box sx={{ height: "100%" }}>
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
    <Box sx={{ display: "flex", height: "5%" }}>
      <h1>Room ID: {props.roomId}</h1>
    </Box>
  );
}

function OtherUserList(props) {
  return (
    <div
      id="userlist"
      className=""
      style={{ background: "#ccc", height: "90%" }}
    >
      {Object.keys(props.otherUsersList).map((userId, index) => {
        //TODO: get user data from userId

        const username = userDataBase[userId].username;
        const userAvatar = userDataBase[userId].avatar;
        const otherIsMuted = props.otherUsersList[userId].isMuted;
        const isRoomCreator = userId === props.roomCreatorId;
        const currentRoomType = props.currentRoomType;

        return (
          <User
            key={index}
            userName={username}
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
        justifyContent: "space-between",
      }}
    >
      <UserData userAvatar={props.userAvatar} userName={props.userName} />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <OtherMutedIcon
          otherIsMuted={props.otherIsMuted}
          isRoomCreator={props.isRoomCreator}
          currentRoomType={props.currentRoomType}
        />
      </Box>
    </Box>
  );
}

function UserData(props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <UserAvatar src={props.userAvatar} mx="auto" />
      <h1>{props.userName}</h1>
    </Box>
  );
}

function OtherMutedIcon(props) {
  if (props.currentRoomType === "streaming" && props.otherIsRoomCreator) {
    if (props.otherIsMuted)
      return (
        <Icon
          icon="/images/others-mute-microphone.png"
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
        icon="/images/others-mute-microphone.png"
        alt="mute_icon"
        length="25"
      />
    );
  else
    return (
      <Icon icon="/images/others-microphone.png" alt="mic_icon" length="25" />
    );
}

function RoomFunctionKeys(props) {
  return (
    <Box
      sx={{
        background: "#ccc",
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
        length="25"
        onClick={props.handleMuteUnmute}
        style={{ cursor: "pointer" }}
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
        length="25"
        onClick={props.handleMuteUnmute}
        style={{ cursor: "pointer" }}
      />
    );
  } else if (props.currentRoomType === "streaming" && !props.isRoomCreator) {
    return <div className="flex">Nothing</div>;
  } else if (props.currentRoomType === "private" && !props.isMuted) {
    return (
      <Icon
        icon="/images/microphone.png"
        alt="mute_icon"
        length="25"
        onClick={props.handleMuteUnmute}
        style={{ cursor: "pointer" }}
      />
    );
  } else if (props.currentRoomType === "private" && props.isMuted) {
    return (
      <Icon
        icon="/images/mute-microphone.png"
        alt="unmute_icon"
        length="25"
        onClick={props.handleMuteUnmute}
        style={{ cursor: "pointer" }}
      />
    );
  }
}
