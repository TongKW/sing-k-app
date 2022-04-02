import { React, useState } from "react";
import { Box } from "@mui/material";
import Icon from "../../component/elements/Icon";
import EllipsisText from "react-ellipsis-text";
import { Input, Button } from "@mui/material";

export default function SongManagementPanel(props) {
  return (
    <Box sx={{ height: "100%" }}>
      <Box sx={{ height: "5%" }}></Box>
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
    <Box sx={{ height: "90%" }}>
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
  const [fileInputRef, setFileInputRef] = useState({});
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
        length="20"
        onClick={props.handleStartSong}
        style={{ cursor: "pointer" }}
      />
      <Icon
        icon="/images/pause.png"
        alt="pause"
        length="20"
        onClick={props.handleStopSong}
        style={{ cursor: "pointer" }}
      />
      <label htmlFor="upload-song">
        <input
          id="upload-song"
          name="upload-song"
          type="file"
          onInput={props.handleAddSong}
          style={{
            display: "none",
          }}
          ref={(ref) => {
            setFileInputRef(ref);
          }}
        />
        <Icon
          icon="/images/plus.png"
          alt="plus"
          length="20"
          style={{ cursor: "pointer" }}
        />
      </label>
      <Icon
        icon="/images/minus.png"
        alt="minus"
        length="20"
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
              icon="/images/up-chevron.png"
              alt="move_up"
              length="20"
              onClick={() => props.handleMoveSong(props.index, props.index - 1)}
              style={{ cursor: "pointer" }}
            />

            <Icon
              icon="/images/down-chevron.png"
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
