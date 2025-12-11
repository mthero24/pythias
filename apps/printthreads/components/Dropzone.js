import { Add } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
const Dropzone = ({ children, onUpload }) => {
  const onDrop = useCallback((acceptedFiles) => {
    let file = acceptedFiles[0];
    if (file && onUpload) {
      onUpload(file);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
      <Box  sx={{ padding: 2, height:'100%', width:'100%', display:'flex', justifyContent:'center', alignItems:'center', transition:'all 0.3s', flexDirection:'column', cursor:'pointer',
      '&:hover': { // CSS for showing the Box on hover
        opacity: 0.6
      },
      
      }} {...getRootProps()}>
        <Add fontSize="large" />
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag &#39;n&#39; drop some files here, or click to select files</p>
        )}
        {children}
      </Box>
  );
};

export default Dropzone;
