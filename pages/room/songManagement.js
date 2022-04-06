import { React, useState } from "react";
import { Box } from "@mui/material";
import Icon from "../../component/elements/Icon";
import EllipsisText from "react-ellipsis-text";
import { Input, Button } from "@mui/material";

export default function SongManagementPanel(props) {
  return (
    <Box sx={{ height: "100%", background: "#323846" }}>
      <Box
        sx={{
          display: "flex",
          height: "5%",
          fontSize: "30px",
        }}
        style={{
          backgroundColor: "#376E6F",
          justifyContent: "center",
        }}
      >
        <h1>Song List</h1>
      </Box>
      <SongListPanel
        allSongList={props.allSongList}
        currentRoomType={props.currentRoomType}
        isRoomCreator={props.isRoomCreator}
        handleMoveSong={props.handleMoveSong}
      />
      <SongFunctionKeys
        handleStartSong={props.handleStartSong}
        handleStopSong={props.handleStopSong}
        handleAddSong={props.handleAddSong}
        handleDeleteSong={props.handleDeleteSong}
        isRoomCreator={props.isRoomCreator}
        currentRoomType={props.currentRoomType}
      />
    </Box>
  );
}

function SongListPanel(props) {
  return (
    <Box sx={{ height: "90%" }} style={{ testAlign: "flex-start" }}>
      {props.allSongList.map((song, index) => (
        <Song
          key={index}
          index={index}
          songName={song}
          currentRoomType={props.currentRoomType}
          isRoomCreator={props.isRoomCreator}
          handleMoveSong={props.handleMoveSong}
        />
      ))}
    </Box>
  );
}

function SongFunctionKeys(props) {
  // const [fileInputRef, setFileInputRef] = useState({});
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-around",
        height: "5%",
      }}
    >
      <Icon
        icon="/images/play.png"
        alt="play"
        length="25"
        onClick={props.handleStartSong}
        style={{ cursor: "pointer" }}
      />
      <Icon
        icon="/images/pause.png"
        alt="pause"
        length="25"
        onClick={props.handleStopSong}
        style={{ cursor: "pointer" }}
      />
      <Icon
        icon="/images/plus.png"
        alt="plus"
        length="25"
        onClick={props.handleAddSong}
        style={{ cursor: "pointer" }}
      />
      <Icon
        icon="/images/minus.png"
        alt="minus"
        length="25"
        onClick={props.handleDeleteSong}
        style={{ cursor: "pointer" }}
      />
    </Box>
  );
}

function Song(props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: "20px",
        padding: "10px",
      }}
    >
      <EllipsisText text={props.songName} length={25} />
      <Box
        sx={{
          display: "flex",
        }}
      >
        {((props.currentRoomType === "streaming" && props.isRoomCreator) ||
          props.currentRoomType === "private") && (
          <>
            <Icon
              icon="/images/scroll-up.png"
              alt="move_up"
              length="20"
              onClick={() => props.handleMoveSong(props.index, props.index - 1)}
              style={{ cursor: "pointer" }}
            />

            <Icon
              icon="/images/scroll-down.png"
              alt="move_down"
              length="20"
              onClick={() => props.handleMoveSong(props.index, props.index + 1)}
              style={{ cursor: "pointer" }}
            />
          </>
        )}
      </Box>
    </Box>
  );
}
