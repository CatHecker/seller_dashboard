import { Link } from 'react-router-dom'
import type { Item } from '../../shared/types/types'
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  Typography,
} from '@mui/material'
import cover from './cover.png'
import { CATEGORIES } from '../constants'

interface AdCardProps {
  ad: Item & { needsRevision: boolean }
}

export const AdCard = ({ ad }: AdCardProps) => {
  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: 'white',
        height: '100%',
      }}
    >
      <CardActionArea
        sx={{
          height: '100%',
        }}
        component={Link}
        to={`/ads/${ad.id}`}
      >
        <CardMedia
          component="img"
          height={200}
          image={cover}
          alt="Placeholder"
        />
        <CardContent>
          <Chip
            size="small"
            sx={{
              mt: -3.5,
              position: 'absolute',
              bgcolor: 'white',
              border: '1px solid #D9D9D9',
              borderRadius: 2,
            }}
            label={
              CATEGORIES.find((category) => category.value === ad.category)
                ?.label
            }
          />
          <Typography
            variant="h5"
            sx={{
              mt: 1,
              fontWeright: 400,
              fontSize: 16,
              textDecoration: 'none',
            }}
          >
            {ad.title}
          </Typography>
          <Typography
            sx={{
              mt: 1,
              fontWeight: 'bold',
              color: '#00000073',
            }}
          >
            {ad.price} ₽
          </Typography>
          {ad.needsRevision && (
            <Chip
              icon={
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#FAAD14',
                    display: 'inline-block',
                  }}
                />
              }
              sx={{
                pl: 1,
                mt: 1,
                bgcolor: '#F9F1E6',
                fontSize: 14,
                color: '#FAAD14',
                fontWeight: 400,
                borderRadius: 2,
              }}
              label="Требует доработок"
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  )
}
