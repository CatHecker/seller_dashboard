import { type ChangeEvent } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

interface SearchProps {
  setSearchTerm: (value: string) => void;
  searchTerm: string
} 

export function SearchField({
  setSearchTerm, searchTerm
}: SearchProps) {


  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement, Element>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <TextField
      size="small"
      fullWidth
      variant="outlined"
      placeholder="Найти объявление..."
      value={searchTerm}
      onChange={handleChange}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon />
            </InputAdornment>
          ),
        },
      }}
      sx={{
        bgcolor: "#F6F6F8",
        borderRadius: 3,
        "& .MuiOutlinedInput-root": {
          "& fieldset": {
            border: "none",
          },
          "&.Mui-focused fieldset": {
            border: "1px solid #ccc",
            borderRadius: 3,
          },
        },
      }}
    />
  );
}