import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import type { Category } from '../services/api'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { CATEGORIES } from '../constants'

interface CategoryFilterProps {
  selectedCategories: Category[]
  onChange: (categories: Category[]) => void
}

export function CategoryFilter({
  selectedCategories,
  onChange,
}: CategoryFilterProps) {
  const handleToggle = (category: Category) => {
    const newSelected = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category]
    onChange(newSelected)
  }

  return (
    <Accordion
      defaultExpanded
      sx={{
        '&': {
          boxShadow: 'none',
        },
      }}
    >
      <AccordionSummary
        sx={{
          '&': {
            p: 0,
          },
        }}
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography component="span">Категория</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <FormGroup>
          {CATEGORIES.map(({ value, label }) => (
            <FormControlLabel
              key={value}
              control={
                <Checkbox
                  checked={selectedCategories.includes(value)}
                  onChange={() => handleToggle(value)}
                />
              }
              label={label}
            />
          ))}
        </FormGroup>
      </AccordionDetails>
    </Accordion>
  )
}
