import React, { useState, useRef } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { styled } from "@mui/material/styles";

interface TraceSearchBarProps {
  onSearch: (value: string) => void;
}


const CustomTextField = styled(TextField)({
  '& label': {
    color: '#00d6ba', // Initial label color
  },
  '& label.Mui-focused': {
    color: '#00d6ba', // Label color when text field is focused
  },
  '& .MuiInput-underline:after': {
    borderBottomColor: '#00d6ba',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#00d6ba',
    },
    '&:hover fieldset': {
      borderColor: '#00d6ba',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#00d6ba', // Border color when text field is focused
    },
    '& input': {
      color: '#FFFFFF', // Input text color
    },
  },
});


function TraceSearchBar({ onSearch }: TraceSearchBarProps) {
  const [searchText, setSearchText] = useState<string>("");
  const debounceTimer = useRef<number | null>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchText(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch(value);
    }, 300) as unknown as number; // Cast to number for browser environment
  };

  return (
    <CustomTextField
      label="Search"
      variant="outlined"
      fullWidth
      value={searchText}
      onChange={handleSearchChange}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon style={{ color: '#FFFFFF' }} />
          </InputAdornment>
        ),
      }}
    />
  );
}

export default TraceSearchBar;
