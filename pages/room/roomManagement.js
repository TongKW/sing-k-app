/**
 * Reder a panel for users to do the following functions
 * 1. See other participants in the meeting
 * 2. Mute/Unmute themselves
 * 3. Leave the room
 */
import { React, useEffect } from "react";
import Icon from "../../component/elements/Icon";
import { styled } from "@mui/material/styles";
import { Box, Avatar, Typography } from "@mui/material";
import Button from "../../component/elements/button";

/**
 * Define the UI for Avatar of the user
 */
const UserAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => ["src"].includes(prop),
})(({ src, theme }) => ({
  width: theme.spacing(5),
  height: theme.spacing(5),
  border: `2px solid ${theme.palette.background.paper}`,
  src: src,
}));

/**
 * Reder the Room Management Panel, allowing users to see other users, mute/unmute and leave the room
 * @param {string} props.roomId - Room ID
 * @param {string} props.peerConnections
 * @param {string} props.currentRoomType - Room Type: either Streaming or Private
 * @param {string} props.roomCreatorId - User Id of the room creator
 * @param {bool} props.isMuted - True if the user is muted, otherwise False
 * @param {bool} props.isRoomCreator - True if the current user Id === User Id of the room creator
 * @param {function} props.handleMuteUnmute - Function to allow user to mute/unmute
 * @param {function} props.closeHandler - Function to allow user to leave the room
 * @returns {object} - Three react components: RoomId, OtherUserList and RoomFunctionKeys
 */
export default function RoomMangementPanel(props) {
  return (
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      style={{ borderRadius: "25px" }}
    >
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

/**
 * A component showing the room ID
 * @param {string} props.roomId - Room ID
 * @returns {object}
 */
function RoomId(props) {
  return (
    <Box
      sx={{
        display: "flex",
        color: "#FFFFFB",
        pl: 1,
        backgroundColor: "#376E6F",
      }}
    >
      <Typography sx={{ fontSize: { xs: "12px", md: "14px" } }}>
        Room ID: {props.roomId}
      </Typography>
    </Box>
  );
}

/**
 * A component showing all the users in the same room
 * @param {string} props.roomId - Room ID
 * @param {string} props.peerConnections
 * @param {string} props.currentRoomType - Room Type: either Streaming or Private
 * @param {string} props.roomCreatorId - User Id of the room creator
 * @returns {object}
 */
function OtherUserList(props) {
  return (
    <div
      id="userlist"
      className="px-2 scrollbar"
      style={{
        background: "#323846",
        height: "100%",
        overflowY: "auto",
      }}
    >
      {props.otherUsersList ? (
        Object.keys(props.otherUsersList).map((userId, index) => {
          const username = props.otherUsersList[userId].username;
          const userAvatar = props.otherUsersList[userId].avatar;
          const otherIsMuted = props.otherUsersList[userId].isMuted;
          const isRoomCreator = userId === props.roomCreatorId;
          const currentRoomType = props.currentRoomType;
          // //console.log(username, otherIsMuted);

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
        })
      ) : (
        <div />
      )}
    </div>
  );
}

/**
 * A component showing all the user information in the room, including an avatar, username and mute status
 * @param {string} props.roomId - Room ID
 * @param {string} props.peerConnections
 * @param {string} props.currentRoomType - Room Type: either Streaming or Private
 * @param {string} props.roomCreatorId - User Id of the room creator
 * @returns {object}
 */
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
        alignItems: "center",
        justifyContent: "space-between",
        pl: 1,
        my: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <UserAvatar src={props.userAvatar} />
        <Box pl={1} />
        <Typography sx={{ fontSize: { xs: "12px", md: "15px" } }}>
          {props.username}
        </Typography>
      </Box>

      <Box mr={1} pt={1}>
        <OtherMutedIcon isMuted={props.otherIsMuted} />
      </Box>
      <audio autoPlay={true} className="hidden" id={`audio-${props.userId}`}>
        <source type="audio/ogg" />
      </audio>
    </Box>
  );
}

/**
 * Show an icon for mute status
 * @param {bool} props.isMuted - True if the user is muted, otherwise False
 * @returns {object}
 */
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

/**
 * Show the mute button and the leave button for users
 * @param {bool} props.isMuted - True if the user is muted, otherwise False
 * @param {bool} props.isRoomCreator - True if the current user Id === User Id of the room creator
 * @param {string} props.currentRoomType - Room Type: either Streaming or Private
 * @param {function} props.handleMuteUnmute - Function to allow user to mute/unmute
 * @param {function} props.closeHandler - Function to allow user to leave the room
 * @returns {object}
 */
function RoomFunctionKeys(props) {
  return (
    <Box
      sx={{
        background: "#323846",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        mb: 1,
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

/**
 * Show the mute button and the leave button for users
 * @param {bool} props.isMuted - True if the user is muted, otherwise False
 * @param {bool} props.isRoomCreator - True if the current user Id === User Id of the room creator
 * @param {function} props.handleMuteUnmute - Function to allow user to mute/unmute
 * @param {string} props.currentRoomType - Room Type: either Streaming or Private
 * @returns {object}
 */
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
