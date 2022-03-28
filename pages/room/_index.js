import React, { useState, useEffect } from "react";
import HomePage from "../../component/wrapper/HomePage";
import Button from "../../component/elements/button";
import {
  Box,
  Badge,
  Avatar,
  LinearProgress,
  Typography,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EMTAvatar from "./mockup";
import log from "../../utils/logger";
import { Room } from "./[id]";

const UserAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => ["src"].includes(prop),
})(({ src, theme }) => ({
  width: theme.spacing(8),
  height: theme.spacing(8),
  border: `4px solid ${theme.palette.background.paper}`,
  src: src,
}));

export default function Page() {
  return <Room />;
}

// export default function Room() {
//   return (
//     <HomePage href="room">
//       <div
//         className="flex-1 p-10 text-2xl font-bold"
//         style={{ width: "100%", height: "900px" }}
//       >
//         <Try_room />
//       </div>
//     </HomePage>
//   );
// }

// function Try_room() {
//   return (
//     <div className="flex flex-row" style={{ width: "100%", height: "100%" }}>
//       <div className="basis-1/4 flex flex-column">
//         <RoomManagement />
//       </div>
//       <div className="basis-1/2 flex flex-row">
//         <InteractionPane />
//       </div>
//       <div className="basis-1/4 flex flex-column">
//         <SongList />
//       </div>
//     </div>
//   );
// }

// function RoomManagement() {
//   function RoomId() {
//     const [roomId, setRoomId] = useState();
//     return (
//       <div
//         id="roomId"
//         className=""
//         style={{ background: "#34eb98", height: "5%" }}
//       >
//         <h1>Room ID: {roomId}</h1>
//       </div>
//     );
//   }
//   function Userlist() {
//     function AudienceProfile() {
//       function UserData() {
//         const [username, setUsername] = useState();
//         const [avatar, setAvatar] = useState();
//         useEffect(() => {
//           setUsername("EMT");
//           setAvatar(EMTAvatar);
//         }, []);
//         return (
//           <div className="flex ">
//             <UserAvatar src={avatar} />
//             <h1>{username}</h1>
//           </div>
//         );
//       }
//       return (
//         <div className="flex space-between">
//           <UserData />
//           <Mute />
//         </div>
//       );
//     }
//     return (
//       <div
//         id="userlist"
//         className=""
//         style={{ background: "#34ebe5", height: "90%" }}
//       >
//         <h1>Userlist</h1>
//         <AudienceProfile />
//       </div>
//     );
//   }
//   function FunctionKeys() {
//     function MuteAll() {
//       function muteAll() {
//         console.log("mute_all_success");
//       }
//       return (
//         <div onClick={muteAll}>
//           <Button text="Mute All" />
//         </div>
//       );
//     }
//     return (
//       <div
//         className="flex place-content-around align-items-center"
//         style={{ background: "#eb34cf", height: "5%" }}
//       >
//         <Mute />
//         <MuteAll />
//       </div>
//     );
//   }
//   return (
//     <div style={{ background: "red", width: "100%", height: "100%" }}>
//       <RoomId />
//       <Userlist />
//       <FunctionKeys />
//     </div>
//   );
// }

// function InteractionPane() {
//   return (
//     <div className="flex-column" style={{ width: "100%" }}>
//       <AudioPane />
//       <CommentBox />
//     </div>
//   );
// }

// function AudioPane() {
//   const [volume, setVolume] = useState();
//   function Edo() {}
//   function CallBack() {}
//   return <div style={{ background: "green", width: "100%" }}>Audiopane</div>;
// }

// function CommentBox() {
//   function Comments() {}
//   function Textfield() {}
//   return <div style={{ background: "orange", width: "100%" }}>CommentBox</div>;
// }

// function SongList() {
//   function Song() {
//     const [songName, setSongName] = useState();
//     const [singerName, setSingerName] = useState();
//     let audio;
//   }
//   return <div style={{ background: "blue", width: "100%" }}>SongList</div>;
// }

// function Mute() {
//   function mute() {
//     console.log("mute_success");
//   }
//   return (
//     <div onClick={mute}>
//       <Button text="Mute" />
//     </div>
//   );
// }
