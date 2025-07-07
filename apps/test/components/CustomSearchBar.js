import { IconButton, TextField } from "@mui/material";
import React, { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";

const CustomSearchBar = ({onSubmit}) => {
  const [val, setVal] = useState();
  const handleSearch = () => {
    //console.log('handleSearch')
    if(onSubmit) onSubmit({value: val})
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  //console.log(val);
  return (
    <TextField
      onChange={(e) => {
        setVal(e.target.value);
      }}
      variant="outlined"
      placeholder="Search"
      onKeyDown={onKeyDown}
      fullWidth
      InputProps={{
        endAdornment: (
          <IconButton onClick={handleSearch}>
            <SearchIcon />
          </IconButton>
        ),
      }}
    />
  );
};

export default CustomSearchBar;
