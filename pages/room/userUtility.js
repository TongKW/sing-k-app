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
      style={{ background: "#FFFFFF" }}
    >
      <AudioPane
        isMuted={props.isMuted}
        volume={props.volume}
        handleEcho={props.handleEcho}
        handleVolume={props.handleVolume}
      />
      <CommentArea
        emojiRef={props.emojiRef}
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
        height: "10%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "#376E6F",
        borderRadius: "0px 0px 10px 10px",
        borderLeft: "solid 5px white",
        borderRight: "solid 5px white",
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
            fontSize: "2vmin",
          }}
        >
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
            valueLabelDisplay="auto"
            onChange={props.handleVolume}
            value={props.volume}
            sx={{
              width: "90%",
              color: "#CCCCCC",
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
        height: "90%",
        background: "#FFFFFF",
      }}
    >
      <MessageArea
        commentList={props.commentList}
        length={props.commentList ? props.commentList.length : 0}
      />
      <InputArea
        emojiRef={props.emojiRef}
        handleAddComment={props.handleAddComment}
      />
    </Box>
  );
}

function MessageArea(props) {
  const messageBoxRef = useRef(null);
  //auto scroll till bottom
  useEffect(() => {
    messageBoxRef.current?.scrollIntoView();
  }, [props.length]);
  return (
    <Box
      id="chat-message-area"
      className="py-4 px-2 scrollbar"
      sx={{
        display: "flex",
        height: "85%",
        overflowY: "auto",
        overflowX: "hidden",
        flexDirection: "column",
      }}
    >

      {props.commentList ? (
        props.commentList.map((comment, index) => {
          if (comment.isSystem)
            return <SystemMessage key={index} text={comment.text} />;
          else
            return (
              <UserComment
                key={index}
                username={comment.username}
                time={comment.time}
                text={comment.text}
              />
            );
        })
      ) : (
        <div />
      )}
      <div ref={messageBoxRef} />
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
          color: "#000000",
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
        color: "#000000",
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
        <EllipsisText text={props.username + ": "} length={25} />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
        }}
      >
        <p style={{ overflowWrap: "anywhere" }}>{props.text}</p>
      </Box>
    </Box>
  );
}

function InputArea(props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [text, setText] = useState("");
  useEffect(() => {
    if (modalOpen) {
    }
  });
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
  function handleRemoveModal(event) {
    if (modalOpen) {
      console.log(event.clientX, event.clientY);
      const element = props.emojiRef.current.getBoundingClientRect();
      const emojiTopLeftX = element.x;
      const emojiTopLeftY = element.y;
      const emojiWidth = element.width;
      const emojiHeight = element.height;
      const emojiBottomRightX = emojiTopLeftX + emojiWidth;
      const emojiBottomRightY = emojiTopLeftY + emojiHeight;
      const inBoundCondition =
        emojiTopLeftX <= event.clientX &&
        event.clientX <= emojiBottomRightX &&
        emojiTopLeftY <= event.clientY &&
        event.clientY <= emojiBottomRightY;
      console.log(inBoundCondition);
      if (!inBoundCondition) {
        setModalOpen(false);
      }
    }
  }
  useEffect(() => {
    window.addEventListener("mouseup", handleRemoveModal);
    return () => window.removeEventListener("mouseup", handleRemoveModal);
  });
  return (
    <Box
      sx={{
        height: "15%",
        background: "#376E6F",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        borderRadius: "10px",
        margin: "0px 5px 0px 5px",
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
        <Box
          ref={props.emojiRef}
          sx={{
            position: "absolute",
            bottom: "16%",
            right: { xs: "18%", md: "20%", xl: "24%" },
            display: modalOpen ? "block" : "none",
          }}
        >
          <Picker onEmojiClick={onEmojiClick} />
        </Box>
        <Icon
          icon="/images/send-message.png"
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
        overflowY: "scroll",
        color: "black",
        height: "80%",
        width: "80%",
        cols: "100",
        resize: "none",
      }}
    />
  );
}
