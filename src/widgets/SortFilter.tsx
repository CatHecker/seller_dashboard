import { MenuItem, Select, type SelectChangeEvent } from '@mui/material'
import type { ItemSortColumn, SortDirection } from '../../shared/types/types'

type SortType = {
  sortBy: ItemSortColumn
  sortOrder: SortDirection
}

interface SortFilterProps {
  sort: SortType
  setSort: (sort: SortType) => void
}

export const SortFilter = ({ sort, setSort }: SortFilterProps) => {
  const handleSortChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value
    const [sortBy, sortOrder] = value.split('_') as [
      ItemSortColumn,
      SortDirection,
    ]
    setSort({ sortBy, sortOrder })
  }

  return (
    <Select
      size="small"
      sx={{
        bgcolor: '#F4F4F6',
        borderRadius: 3,
        p: 0,
        m: 0,
        '& fieldset': {
          border: 'none',
        },
        '&.Mui-focused fieldset': {
          border: '1px solid #ccc',
          borderRadius: 3,
        },
      }}
      value={`${sort.sortBy}_${sort.sortOrder}`}
      onChange={handleSortChange}
    >
      <MenuItem value="createdAt_desc">По новизне (сначала новые)</MenuItem>
      <MenuItem value="createdAt_asc">По новизне (сначала старые)</MenuItem>
      <MenuItem value="title_asc">По названию (А → Я)</MenuItem>
      <MenuItem value="title_desc">По названию (Я → А)</MenuItem>
    </Select>
  )
}
