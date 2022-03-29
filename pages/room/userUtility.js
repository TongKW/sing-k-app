import { React, useRef, useEffect, useState } from "react";
import { Box, TextField, Slider } from "@mui/material";
import { styled } from "@mui/material/styles";
import Icon from "../../component/elements/Icon";
import { connectFirestoreEmulator } from "firebase/firestore";
import { formatTime } from "../../utils/date";
import EllipsisText from "react-ellipsis-text";
import dynamic from "next/dynamic";
const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function UserUtilityPanel(props) {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <AudioPane
        isMuted={props.isMuted}
        echo={props.echo}
        volume={props.volume}
        handleEcho={props.handleEcho}
        handleVolume={props.handleVolume}
      />
      <CommentArea
        commentList={props.commentList}
        handleAddComment={props.handleAddComment}
      />
    </Box>
  );
}

function AudioPane(props) {
  return (
    <Box
      className="bg-gray-700"
      style={{
        width: "100%",
        height: "35%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          width: "100%",
          height: "80%",
        }}
      >
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-around",
            height: "80%",
            width: "10%",
          }}
        >
          <h1>Echo</h1>
          <h1>Volume</h1>
        </Box>
        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-around",
            height: "80%",
            width: "80%",
          }}
        >
          <Slider
            onChange={props.handleEcho}
            value={props.echo}
            valueLabelDisplay="auto"
            sx={{
              width: "90%",
              color: "gray",
            }}
          />
          <Slider
            valueLabelDisplay="auto"
            onChange={props.handleVolume}
            value={props.volume}
            sx={{
              width: "90%",
              color: "gray",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

function CommentArea(props) {
  return (
    <Box
      className="bg-indigo-900"
      style={{
        width: "100%",
        height: "65%",
      }}
    >
      <MessageArea commentList={props.commentList} />
      <InputArea handleAddComment={props.handleAddComment} />
    </Box>
  );
}

function MessageArea(props) {
  //auto scroll till bottom
  const messageArea = useRef();
  useEffect(() => {
    messageArea.current.scrollTop = messageArea.current.scrollHeight;
  }, [props.commentList]);
  return (
    <Box
      className="py-4 px-2 scrollbar"
      sx={{
        height: "85%",
        "overflow-y": "auto",
        "overflow-x": "hidden",
      }}
      ref={messageArea}
    >
      {props.commentList.map((comment, index) => {
        if (comment.isSystem) return <SystemMessage text={comment.text} />;
        else
          return (
            <UserComment
              key={index}
              userName={comment.userName}
              time={comment.time}
              text={comment.text}
            />
          );
      })}
    </Box>
  );
}

function SystemMessage(props) {
  return (
    <Box
      className="my-1"
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItem: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "rgba(127,127,127,0.5)",
          borderRadius: "50px",
          padding: "2px 5px 2px 5px",
          color: "rgba(127,127,127)",
        }}
      >
        {props.text}
      </div>
    </Box>
  );
}

function UserComment(props) {
  const time = new Date(props.time);
  return (
    <Box
      className="my-1"
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
      }}
    >
      <Box
        className="mr-2"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItem: "flex-start",
        }}
      >
        <div>[{formatTime(time)}]</div>
      </Box>

      <Box
        className="mr-2"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItem: "flex-start",
        }}
      >
        <EllipsisText text={props.userName + ": "} length={"25"} />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <p style={{ "overflow-wrap": "anywhere" }}>{props.text}</p>
      </Box>
    </Box>
  );
}

function InputArea(props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [text, setText] = useState("");
  const handleUpdateText = (event) => {
    setText(event.target.value);
  };
  const submitText = () => {
    props.handleAddComment(text);
    setText("");
  };
  function onEmojiClick(event, emoji) {
    setText(text + emoji.emoji);
  }
  return (
    <Box
      sx={{
        height: "15%",
        background: "green",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: "80%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <InputBox text={text} onChange={handleUpdateText} submit={submitText} />
        <Icon
          icon="/images/emoji.png"
          length="30"
          onClick={() => {
            setModalOpen(!modalOpen);
          }}
        />
        {modalOpen && (
          <Box
            sx={{
              position: "absolute",
              bottom: "10%",
              right: { xs: "10%", md: "15%" },
            }}
          >
            <Picker onEmojiClick={onEmojiClick} />
          </Box>
        )}
        <Icon
          icon="/images/right-arrow.png"
          alt="send"
          length="30"
          onClick={submitText}
          style={{ cursor: "pointer" }}
        />
      </Box>
    </Box>
  );
}

function InputBox(props) {
  const inputArea = useRef();
  useEffect(() => {
    inputArea.current.focus();
    document.addEventListener("keyup", handleKeyPress);
    return () => {
      document.removeEventListener("keyup", handleKeyPress);
    };
  }, [props.text]);
  const handleKeyPress = (event) => {
    if (event.key == "Enter" && !event.shiftKey) {
      props.submit();
    }
  };
  return (
    <textarea
      ref={inputArea}
      value={props.text}
      onChange={props.onChange}
      type="textarea"
      className="
            hidden-scrollbar
            form-control
            block
            w-full
            px-3
            py-1.5
            text-base
            font-normal
            text-gray-700
            bg-white bg-clip-padding
            border border-solid border-gray-300
            rounded
            transition
            ease-in-out
            m-0
            focus:text-gray-700 focus:bg-white focus:border-black-600 focus:outline-none
          "
      placeholder="Type something..."
      style={{
        "overflow-y": "scroll",
        color: "black",
        height: "80%",
        width: "80%",
        cols: "100",
        resize: "none",
      }}
    />
  );
}