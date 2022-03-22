import React, { useState, useEffect } from 'react';
import HomePage from '../component/wrapper/HomePage';
import { useRouter } from 'next/router'
import firebase from 'firebase/compat/app';
import { firebaseConfig } from '../firebase/config';
import { getFirestore, collection } from 'firebase/firestore';
import { Box, Typography, Avatar, styled, Dialog, DialogTitle, DialogContent, Button } from '@mui/material';
import { FormInputBlock } from "../component/elements/form-input";
import PeopleIcon from '@mui/icons-material/People';
import generateRoomId from '../utils/room/generate-id';

export default function Home() {
	const [ username, setUsername ] = useState('');

	useEffect(() => {
		setUsername(localStorage.getItem('username'));
	}, []);
	return (
		<HomePage>
			<div className="flex-1 p-10 text-2xl font-bold">
				Welcome back, {username}!
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', my: 5 }}>
          <CreateRoomButton />
          <JoinRoomButton />
        </Box>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						px: 3,
						py: 1,
						border: 1,
						borderRadius: 2
					}}
				>
					<Box>Current streaming room: 4</Box>
					<Box mt={2} />
					<CurrentStreamRoom
						id="test"
						image="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9pBh-vAxx703zgbQBqOUEREnogEa23F_xFw&usqp=CAU"
						hostname="abc"
						audience="3"
					/>
				</Box>
			</div>
		</HomePage>
	);
}

const UserAvatar = styled(Avatar, {
	shouldForwardProp: (prop) => [ 'src' ].includes(prop)
})(({ src, theme }) => ({
	width: theme.spacing(6),
	height: theme.spacing(6),
	border: `3px solid ${theme.palette.background.paper}`,
	src: src
}));

function CreateRoomButton() {
	const [ open, setOpen ] = useState(false);
  const router = useRouter()

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

  const createRoom = async () => {
    const roomid = await generateRoomId();
  
    router.push('/room/'+roomid);
  };

	return (
    <>
		<button
			className="w-full h-20 bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 mx-10 text-xs rounded focus:outline-none focus:shadow-outline"
			type="button" onClick={handleClickOpen}
		>
			<font size="3">Create room</font>
		</button>
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Choose Type: </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around'}}>
          <button
            className="w-30 h-20 bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 mx-5 text-xs rounded focus:outline-none focus:shadow-outline"
            type="button" onClick={createRoom}
          >
            <font size="3">Stream room</font>
          </button>
          <button
            className="w-30 h-20 bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 mx-5 text-xs rounded focus:outline-none focus:shadow-outline"
            type="button" onClick={createRoom}
          >
            <font size="3">Private room</font>
          </button>
        </Box>
      </DialogContent>
    </Dialog>
    </>
	);
}

function JoinRoomButton() {
	const [ open, setOpen ] = useState(false);
  const [roomid, setRoomid] = useState();
  const [roomidError, setRoomidError] = useState();

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	return (
    <>
		<button
      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 mx-10 text-xs rounded focus:outline-none focus:shadow-outline"
      type="button" onClick={handleClickOpen}
    >
      <font size="3">Join room</font>
    </button>
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Enter Room ID: </DialogTitle>
      <DialogContent>
        <form>
          <FormInputBlock category="Room ID" value={roomid} onChange={setRoomid} warning={roomidError} />
          <Box sx={{display: 'flex', flexDirection: 'row-reverse'}}>
            <button 
              className="bg-indigo-700 hover:bg-indigo-800 text-white py-2 px-4 text-xs rounded focus:outline-none focus:shadow-outline" 
              type="button"
            >
            Confirm 
            </button>
          </Box>
        </form>
      </DialogContent>
    </Dialog>
    </>
	);
}

function CurrentStreamRoom(props) {

  const router = useRouter();

  const handleJoinRoom = () => {
    router.push('/room/'+props.id);
  };

  const StyledButton = styled(Button)({
    textTransform: 'none',
  });

	return (
    <StyledButton width="100%" textTransform="none" onClick={handleJoinRoom}>
		<Box
			sx={{
        width: "100%",
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				pl: 1,
				backgroundColor: '#ffffff',
				borderRadius: 2,
				my: 1
			}} 
		>
      
			<Typography color="#000000" textAlign="left">Room ID: {props.id}</Typography>
			<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
					<UserAvatar src={props.image} />
					<Typography color="#000000">{props.hostname}</Typography>
				</Box>
				<Box mr={1} color="#000000">
					<Typography>
						<PeopleIcon /> {props.audience}
					</Typography>
				</Box>
			</Box>
		</Box>
    </StyledButton>
	);
}
