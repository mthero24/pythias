import React from "react";
import { IoIosCloseCircle } from "react-icons/io";
import {
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Grid,
    Container,
    Modal,
    Box,
    Stack,
    Typography,
    Button,
    TextField,
  } from "@mui/material";
const ModalCloseButton = ({ onClick }) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        right: 4,
        top: 4,
        position: "absolute",
        cursor: "pointer",
      }}
    >
      <IoIosCloseCircle color={"#212121"} size={24} />
    </Box>
  );
};

export default ModalCloseButton;
