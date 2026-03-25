import { useItemsQuery } from '../hooks/useAds'
import {
  Box,
  Button,
  ButtonGroup,
  Divider,
  Grid,
  IconButton,
  Pagination,
  Switch,
  Typography,
} from '@mui/material'
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined'
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined'
import { useState } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { SearchField } from '../widgets/SearchField'
import type { ItemSortColumn, SortDirection } from '../../shared/types/types'
import type { Category } from '../services/api'
import { CategoryFilter } from '../widgets/CategoryFilter'
import { SortFilter } from '../widgets/SortFilter'
import { AdCard } from '../widgets/AdCard'

export default function AdsList() {
  const [needsRevision, setNeedsRevision] = useState<boolean>(false)
  const [sort, setSort] = useState<{
    sortBy: ItemSortColumn
    sortOrder: SortDirection
  }>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const handleNeedsRevisionChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setNeedsRevision(event.target.checked)
  }
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const { data, isLoading, error } = useItemsQuery({
    q: debouncedSearchTerm,
    limit: 10,
    skip: (page - 1) * 10,
    sortColumn: sort.sortBy,
    sortDirection: sort.sortOrder,
    categories: selectedCategories,
    needsRevision,
  })

  const totalPages = data?.total ?? 1

  const resetFilters = () => {
    setSelectedCategories([])
    setNeedsRevision(false)
  }

  if (error) return <div>Ошибка: {error.message}</div>

  return (
    <Box sx={{ p: '1.5em 2.5em', bgcolor: '#F7F5F8' }}>
      <Typography variant="h6" sx={{ fontWeight: '500' }}>
        Мои объявления
      </Typography>
      <Typography sx={{ color: '#848388' }}>
        {data?.total || 0} объявления
      </Typography>

      <Box
        sx={{
          height: 40,
          mt: 3,
          gap: 2,
          borderRadius: 3,
          p: 1.5,
          width: '100%',
          display: 'flex',
          bgcolor: '#FFFFFF',
          alignItems: 'center',
        }}
      >
        <SearchField setSearchTerm={setSearchTerm} searchTerm={searchTerm} />
        <ButtonGroup sx={{ borderRadius: 3, bgcolor: '#F4F4F6' }}>
          <IconButton sx={{ borderRadius: 10 }}>
            <GridViewOutlinedIcon />
          </IconButton>
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              height: 30,
              my: 'auto',
              borderColor: 'white',
              borderRightWidth: 3,
            }}
          />
          <IconButton>
            <FormatListBulletedOutlinedIcon />
          </IconButton>
        </ButtonGroup>
        <SortFilter sort={sort} setSort={setSort} />
      </Box>

      <Box
        sx={{
          display: 'flex',
          mt: 2,
          gap: 3,
        }}
      >
        {/* Фильтры */}
        <Box width={'256px'}>
          <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 2 }}>
            <Typography fontSize="16px" variant="h5" sx={{ fontWeight: 500 }}>
              Фильтры
            </Typography>
            <CategoryFilter
              selectedCategories={selectedCategories}
              onChange={setSelectedCategories}
            />
            <Divider />
            <Typography
              sx={{
                display: 'flex',
                fontSize: '16px',
                mt: 2,
                fontWeight: 'bold',
                alignItems: 'center',
              }}
            >
              Только требующие доработок{' '}
              <Switch
                checked={needsRevision}
                onChange={handleNeedsRevisionChange}
                sx={{
                  width: 50,
                  height: 26,
                  padding: 0,
                  ml: 3,
                  '& .MuiSwitch-thumb': {
                    boxSizing: 'border-box',
                    width: 21,
                    height: 21,
                    m: '-7px -5px',
                    p: 0,
                  },
                  '& .MuiSwitch-track': {
                    borderRadius: 13,
                    backgroundColor: '#E9E9EA',
                    opacity: 1,
                  },
                }}
              />
            </Typography>
          </Box>

          <Button
            fullWidth
            sx={{
              fontSize: 14,
              fontWeight: 400,
              bgcolor: 'white',
              mt: 2,
              borderRadius: 2,
              color: '#848388',
              '&': {
                textTransform: 'none',
              },
            }}
            onClick={resetFilters}
          >
            Сбросить фильтры
          </Button>
        </Box>
        <Box>
          <Grid container spacing={3} sx={{ width: '100%', margin: 0 }}>
            {isLoading
              ? 'Загрузка'
              : data?.items.map((ad, index) => {
                  return (
                    <Grid
                      size={
                        data?.total - (page - 1) * 10 >= 5
                          ? { xs: 12, sm: 6, md: 4, lg: 2.4 }
                          : 'auto'
                      }
                      key={index}
                    >
                      <AdCard ad={ad} />
                    </Grid>
                  )
                })}
          </Grid>
          {totalPages > 1 && (
            <Pagination
              sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
              count={Math.ceil(totalPages / 10)}
              page={page}
              onChange={handlePageChange}
              variant="outlined"
              shape="rounded"
              color="primary"
            />
          )}
        </Box>
      </Box>
    </Box>
  )
}
