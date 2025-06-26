"use client"
import {Box, Typography, Snackbar, IconButton} from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import {useState, Fragment} from "react"

export const NoteSnackBar = ({notes, open, setOpen})=>{
    const [state, setState] = useState({
    vertical: 'top',
    horizontal: 'center',
  });
  const { vertical, horizontal } = state;
  const handleClose = () => {
    setOpen(false);
  };
   const action = (
    <Fragment>
      
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );
  console.log(notes)
  return (
    <Box sx={{ width: "50%" }}>
      <Snackbar
        anchorOrigin={{ vertical, horizontal }}
        open={open}
        onClose={handleClose}
        message={
            <Box>
                {notes && notes.map(note=>(
                    <Typography key={note._id}>{`${new Date(note.date).toLocaleDateString("en-US")} ${note.userName? note.userName: ""} - ${note.note}`}</Typography>
                ))}
            </Box>
        }
        key={vertical + horizontal}
        action={action}
      />
    </Box>
  );
}