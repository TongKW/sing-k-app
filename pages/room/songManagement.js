/**
 * Render a panel for user to see the existing song list while having the following functions
 * 1. Play the song
 * 2. Pause the song
 * 3. Add a song
 * 4. Delete a song
 * 5. Change the sequence of playing the songs
 */

import { React, useState } from "react";
import { Box, Typography } from "@mui/material";
import Icon from "../../component/elements/Icon";
import EllipsisText from "react-ellipsis-text";
import { Input, Button } from "@mui/material";

/**
 * Render the song management panel, allowing user to see a song list with functions to control the songs
 * @param {list of string} allSongList - Showing all song list in web connection
 * @param {string} props.currentRoomType - Room Type: either Streaming or Private
 * @param {bool} props.isRoomCreator - True if the current user Id === User Id of the room creator
 * @param {function} props.handleMoveSong - A function to handle the sequence of playing the songs
 * @param {function} props.sendMsgAll - A function to send message to all other users in that room
 * @param {string} props.username - Username of the current user
 * @param {function} props.handleStartSong - A function to start playing a song
 * @param {function} props.handleStopSong - A function to pause a song
 * @param {function} props.handleAddSong - A function to add a song
 * @param {function} props.handleDeleteSong - A function to delete a song
 * @returns {object} - Two react components: SongListPanel, SongFunctionKeys
 */
export default function SongManagementPanel(props) {
  return (
    <Box
      sx={{
        height: "100%",
        background: "#323846",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          backgroundColor: "#376E6F",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontSize: { xs: "12px", md: "14px" } }}>
          Song List
        </Typography>
      </Box>
      <SongListPanel
        allSongList={props.allSongList}
        currentRoomType={props.currentRoomType}
        isRoomCreator={props.isRoomCreator}
        handleMoveSong={props.handleMoveSong}
        sendMsgAll={props.sendMsgAll}
        username={props.username}
      />
      <SongFunctionKeys
        handleStartSong={props.handleStartSong}
        handleStopSong={props.handleStopSong}
        handleAddSong={props.handleAddSong}
        handleDeleteSong={props.handleDeleteSong}
        isRoomCreator={props.isRoomCreator}
        currentRoomType={props.currentRoomType}
        sendMsgAll={props.sendMsgAll}
        username={props.username}
        allowPlaySong={props.allowPlaySong}
      />
    </Box>
  );
}

/**
 * Render a list of songs, allowing users to change the sequence of playing the songs
 * @param {string} props.currentRoomType - Room Type: either Streaming or Private
 * @param {bool} props.isRoomCreator - True if the current user Id === User Id of the room creator
 * @param {function} props.handleMoveSong - A function to handle the sequence of playing the songs
 * @param {function} props.sendMsgAll - A function to send message to all other users in that room
 * @param {string} props.username - Username of the current user
 * @returns {object} - A list of all songs uploaded by users in the room
 */
function SongListPanel(props) {
  return (
    <Box
      className="px-2 scrollbar"
      sx={{ height: "100%", overflowY: "auto" }}
      style={{ testAlign: "flex-start" }}
    >
      {props.allSongList ? (
        props.allSongList.map((song, index) => (
          <Song
            key={index}
            index={index}
            songName={song}
            currentRoomType={props.currentRoomType}
            isRoomCreator={props.isRoomCreator}
            handleMoveSong={props.handleMoveSong}
            sendMsgAll={props.sendMsgAll}
            username={props.username}
          />
        ))
      ) : (
        <div />
      )}
    </Box>
  );
}

/**
 * Render four function keys for user to start, pause, add or delete a song
 * @param {string} props.currentRoomType - Room Type: either Streaming or Private
 * @param {bool} props.isRoomCreator - True if the current user Id === User Id of the room creator
 * @param {function} props.sendMsgAll - A function to send message to all other users in that room
 * @param {string} props.username - Username of the current user
 * @param {function} props.handleStartSong - A function to start playing a song
 * @param {function} props.handleStopSong - A function to pause a song
 * @param {function} props.handleAddSong - A function to add a song
 * @param {function} props.handleDeleteSong - A function to delete a song
 * @returns - Four buttons for user to manage the songs
 */
function SongFunctionKeys(props) {
  const usableUser =
    props.currentRoomType === "private" ||
    (props.currentRoomType === "streaming" && props.isRoomCreator);
  // const [fileInputRef, setFileInputRef] = useState({});
  if (usableUser) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          padding: "20px 0px 0px 0px",
          mb: 1,
        }}
      >
        <Icon
          icon="/images/play.png"
          alt="play"
          length="25"
          onClick={() => {
            if (!props.allowPlaySong) return;
            props.handleStartSong();
            props.sendMsgAll({
              type: "songAction",
              action: "start",
            });
            props.sendMsgAll({
              username: props.username,
              type: "system",
              message: `${props.username} has started the song.`,
            });
          }}
          style={{ cursor: props.allowPlaySong ? "pointer" : "not-allowed" }}
        />
        <Icon
          icon="/images/pause.png"
          alt="pause"
          length="25"
          onClick={() => {
            props.handleStopSong();
            props.sendMsgAll({
              type: "songAction",
              action: "stop",
            });
            props.sendMsgAll({
              username: props.username,
              type: "system",
              message: `${props.username} has stopped the song.`,
            });
          }}
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
          />
          <Icon
            icon="/images/plus.png"
            alt="plus"
            length="25"
            style={{ cursor: "pointer" }}
          />
        </label>
        <Icon
          icon="/images/minus.png"
          alt="minus"
          length="25"
          onClick={() => {
            props.handleDeleteSong();
            props.sendMsgAll({
              type: "songAction",
              action: "delete",
            });
            props.sendMsgAll({
              username: props.username,
              type: "system",
              message: `${props.username} has deleted the song.`,
            });
          }}
          style={{ cursor: "pointer" }}
        />
      </Box>
    );
  } else if (!usableUser) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-around",
          padding: "20px 0px 0px 0px",
          height: "10%",
        }}
      >
        <Icon
          icon="/images/play.png"
          alt="play"
          length="25"
          style={{ cursor: "not-allowed" }}
        />
        <Icon
          icon="/images/pause.png"
          alt="pause"
          length="25"
          style={{ cursor: "not-allowed" }}
        />
        <Icon
          icon="/images/plus.png"
          alt="plus"
          length="25"
          style={{ cursor: "not-allowed" }}
        />
        <Icon
          icon="/images/minus.png"
          alt="minus"
          length="25"
          style={{ cursor: "not-allowed" }}
        />
      </Box>
    );
  }
}

/**
 * Render a song, having its name and two function keys for user to change the sequence
 * @param {string} props.index - The index of a song
 * @param {string} props.songName - The name of a song
 * @param {string} props.currentRoomType - Room Type: either Streaming or Private
 * @param {bool} props.isRoomCreator - True if the current user Id === User Id of the room creator
 * @param {function} props.handleMoveSong - A function to handle the sequence of playing the songs
 * @param {function} props.sendMsgAll - A function to send message to all other users in that room
 * @param {string} props.username - Username of the current user
 * @returns {object} - A list of all songs uploaded by users in the room
 */
function Song(props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: "1.5vmin",
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
              onClick={() => {
                props.handleMoveSong(props.index, props.index - 1);
                props.sendMsgAll({
                  type: "songAction",
                  action: "move",
                  prevIndex: props.index,
                  currentIndex: props.index - 1,
                });
                props.sendMsgAll({
                  username: props.username,
                  type: "system",
                  message: `${props.username} has moved the song.`,
                });
              }}
              style={{ cursor: "pointer" }}
            />

            <Icon
              icon="/images/scroll-down.png"
              alt="move_down"
              length="20"
              onClick={() => {
                props.handleMoveSong(props.index, props.index + 1);
                props.sendMsgAll({
                  type: "songAction",
                  action: "move",
                  prevIndex: props.index,
                  currentIndex: props.index + 1,
                });
                props.sendMsgAll({
                  username: props.username,
                  type: "system",
                  message: `${props.username} has moved the song.`,
                });
              }}
              style={{ cursor: "pointer" }}
            />
          </>
        )}
      </Box>
    </Box>
  );
}
