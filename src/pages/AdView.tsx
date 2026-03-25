import React from 'react'
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  Alert,
  AlertTitle,
  Stack,
  Skeleton,
} from '@mui/material'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import {
  type Item,
  type AutoItemParams,
  type RealEstateItemParams,
  type ElectronicsItemParams,
} from '../../shared/types/types'
import { useNavigate, useParams } from 'react-router-dom'
import { useItemQuery } from '../hooks/useAds'
import placeholder from '../assets/cover.png'

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ---------------------------------------------------------------------------
// Label → Value row inside characteristics table
// ---------------------------------------------------------------------------

interface CharRowProps {
  label: string
  value: React.ReactNode
}

function CharRow({ label, value }: CharRowProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        alignItems: 'baseline',
        py: 0.75,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Missing-fields alert
// ---------------------------------------------------------------------------

function getMissingFields(item: Item): string[] {
  const missing: string[] = []

  if (!item.description) missing.push('Описание')

  if (item.category === 'auto') {
    const p = item.params as AutoItemParams
    if (!p.brand) missing.push('Марка')
    if (!p.model) missing.push('Модель')
    if (!p.yearOfManufacture) missing.push('Год выпуска')
    if (!p.transmission) missing.push('Коробка передач')
    if (p.mileage === undefined) missing.push('Пробег')
    if (p.enginePower === undefined) missing.push('Мощность двигателя')
  } else if (item.category === 'real_estate') {
    const p = item.params as RealEstateItemParams
    if (!p.type) missing.push('Тип недвижимости')
    if (!p.address) missing.push('Адрес')
    if (p.area === undefined) missing.push('Площадь')
    if (p.floor === undefined) missing.push('Этаж')
  } else if (item.category === 'electronics') {
    const p = item.params as ElectronicsItemParams
    if (!p.type) missing.push('Тип')
    if (!p.brand) missing.push('Бренд')
    if (!p.model) missing.push('Модель')
    if (!p.condition) missing.push('Состояние')
    if (!p.color) missing.push('Цвет')
  }

  return missing
}

// ---------------------------------------------------------------------------
// Category-specific characteristics
// ---------------------------------------------------------------------------

function AutoCharacteristics({ params }: { params: AutoItemParams }) {
  const transmissionLabel =
    params.transmission === 'automatic'
      ? 'Автоматическая'
      : params.transmission === 'manual'
        ? 'Механическая'
        : undefined

  return (
    <>
      {params.brand && <CharRow label="Марка" value={params.brand} />}
      {params.model && <CharRow label="Модель" value={params.model} />}
      {params.yearOfManufacture !== undefined && (
        <CharRow label="Год выпуска" value={params.yearOfManufacture} />
      )}
      {transmissionLabel && (
        <CharRow label="Коробка передач" value={transmissionLabel} />
      )}
      {params.mileage !== undefined && (
        <CharRow
          label="Пробег"
          value={`${params.mileage.toLocaleString('ru-RU')} км`}
        />
      )}
      {params.enginePower !== undefined && (
        <CharRow
          label="Мощность двигателя"
          value={`${params.enginePower} л.с.`}
        />
      )}
    </>
  )
}

function RealEstateCharacteristics({
  params,
}: {
  params: RealEstateItemParams
}) {
  const typeLabel =
    params.type === 'flat'
      ? 'Квартира'
      : params.type === 'house'
        ? 'Дом'
        : params.type === 'room'
          ? 'Комната'
          : undefined

  return (
    <>
      {typeLabel && <CharRow label="Тип" value={typeLabel} />}
      {params.address && <CharRow label="Адрес" value={params.address} />}
      {params.area !== undefined && (
        <CharRow label="Площадь" value={`${params.area} м²`} />
      )}
      {params.floor !== undefined && (
        <CharRow label="Этаж" value={params.floor} />
      )}
    </>
  )
}

function ElectronicsCharacteristics({
  params,
}: {
  params: ElectronicsItemParams
}) {
  const typeLabel =
    params.type === 'phone'
      ? 'Телефон'
      : params.type === 'laptop'
        ? 'Ноутбук'
        : params.type === 'misc'
          ? 'Другое'
          : undefined

  const conditionLabel =
    params.condition === 'new'
      ? 'Новое'
      : params.condition === 'used'
        ? 'Б/у'
        : undefined

  return (
    <>
      {typeLabel && <CharRow label="Тип" value={typeLabel} />}
      {params.brand && <CharRow label="Бренд" value={params.brand} />}
      {params.model && <CharRow label="Модель" value={params.model} />}
      {conditionLabel && <CharRow label="Состояние" value={conditionLabel} />}
      {params.color && <CharRow label="Цвет" value={params.color} />}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: item, isLoading, error } = useItemQuery(id)

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 1080, mx: 'auto', p: 3 }}>
        <Skeleton variant="text" width={300} height={48} />
        <Skeleton variant="text" width={120} height={40} sx={{ mt: 1 }} />
        <Divider sx={{ my: 2 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 3,
            mt: 2,
          }}
        >
          <Skeleton
            variant="rectangular"
            height={340}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={340}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      </Box>
    )
  }

  if (error || !item) {
    return (
      <Box sx={{ maxWidth: 1080, mx: 'auto', p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Ошибка загрузки</AlertTitle>
          Не удалось загрузить данные объявления. Попробуйте обновить страницу.
        </Alert>
      </Box>
    )
  }

  const missingFields = getMissingFields(item)

  return (
    <Box sx={{ maxWidth: 1080, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 1,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {item.title}
          </Typography>
          <Button
            variant="contained"
            size="medium"
            endIcon={<EditOutlinedIcon />}
            onClick={() => navigate(`/ads/${item.id}/edit`)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Редактировать
          </Button>
        </Box>

        <Box sx={{ textAlign: 'right', flexShrink: 0, ml: 3 }}>
          <Typography variant="h4" fontWeight={700}>
            {item.price} ₽
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Опубликовано: {formatDate(item.createdAt)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Отредактировано: {formatDate(item.updatedAt)}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <img src={placeholder} width={480} />

        <Box>
          {missingFields.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                bgcolor: '#F9F1E6',
                border: '1px solid',
                borderColor: '#F5DEB3',
                borderRadius: 2,
                p: 2,
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#FFA940',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.25,
                  }}
                >
                  <Typography
                    sx={{
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    !
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={700} gutterBottom>
                    Требуются доработки
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    У объявления не заполнены поля:
                  </Typography>
                  <Stack component="ul" spacing={0.25} sx={{ m: 0, pl: 0 }}>
                    {missingFields.map((field) => (
                      <Box
                        component="li"
                        key={field}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            bgcolor: '#000000D9',
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2">{field}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Paper>
          )}

          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            Характеристики
          </Typography>

          <Box>
            {item.category === 'auto' && (
              <AutoCharacteristics params={item.params as AutoItemParams} />
            )}
            {item.category === 'real_estate' && (
              <RealEstateCharacteristics
                params={item.params as RealEstateItemParams}
              />
            )}
            {item.category === 'electronics' && (
              <ElectronicsCharacteristics
                params={item.params as ElectronicsItemParams}
              />
            )}
          </Box>
        </Box>
      </Box>

      {item.description && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Описание
          </Typography>
          <Typography
            variant="body1"
            color="text.primary"
            sx={{ whiteSpace: 'pre-line' }}
          >
            {item.description}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
