import React, { useEffect, useState, type FormEvent } from 'react'
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  Stack,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  FormHelperText,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import type {
  AutoItemParams,
  RealEstateItemParams,
  ElectronicsItemParams,
} from '../../shared/types/types'
import type { Category, ItemUpdatePayload } from '../services/api'
import { CATEGORIES } from '../constants'
import { useNavigate, useParams } from 'react-router-dom'
import { useItemQuery, useUpdateItemMutation } from '../hooks/useAds'
import { z } from 'zod'
import { generateDescription, suggestPrice } from '../../server/gigachat-client'

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const AutoTransmissionSchema = z.enum(['automatic', 'manual'])

const AutoItemParamsSchema = z.strictObject({
  brand: z.string().min(1, 'Марка обязательна'),
  model: z.string().min(1, 'Модель обязательна'),
  yearOfManufacture: z.number().int().positive('Год должен быть положительным'),
  transmission: AutoTransmissionSchema,
  mileage: z.number().positive('Пробег должен быть положительным'),
  enginePower: z.number().int().positive('Мощность должна быть положительной'),
})

const RealEstateTypeSchema = z.enum(['flat', 'house', 'room'])

const RealEstateItemParamsSchema = z.strictObject({
  type: RealEstateTypeSchema,
  address: z.string().min(1, 'Адрес обязателен'),
  area: z.number().positive('Площадь должна быть положительной'),
  floor: z.number().int().positive('Этаж должен быть положительным'),
})

const ElectronicsTypeSchema = z.enum(['phone', 'laptop', 'misc'])
const ElectronicsConditionSchema = z.enum(['new', 'used'])

const ElectronicsItemParamsSchema = z.strictObject({
  type: ElectronicsTypeSchema,
  brand: z.string().min(1, 'Бренд обязателен'),
  model: z.string().min(1, 'Модель обязательна'),
  condition: ElectronicsConditionSchema,
  color: z.string().min(1, 'Цвет обязателен'),
})

const ItemUpdateSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  price: z.number().min(1, 'Цена должна быть больше 0'),
  category: z.string(),
  description: z.string().optional(),
  params: z.any(),
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ELECTRONICS_TYPES = [
  { value: 'phone', label: 'Телефон' },
  { value: 'laptop', label: 'Ноутбук' },
  { value: 'misc', label: 'Другое' },
]

const REAL_ESTATE_TYPES = [
  { value: 'flat', label: 'Квартира' },
  { value: 'house', label: 'Дом' },
  { value: 'room', label: 'Комната' },
]

const TRANSMISSIONS = [
  { value: 'automatic', label: 'Автоматическая' },
  { value: 'manual', label: 'Механическая' },
]

const CONDITIONS = [
  { value: 'new', label: 'Новое' },
  { value: 'used', label: 'Б/у' },
]

// ---------------------------------------------------------------------------
// Styled Components / Sub-components
// ---------------------------------------------------------------------------

const Label = ({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) => (
  <Typography
    variant="subtitle2"
    fontWeight={600}
    sx={{ mb: 1, display: 'flex', alignItems: 'center' }}
  >
    {required && (
      <Box component="span" sx={{ color: 'error.main', mr: 0.5 }}>
        *
      </Box>
    )}
    {children}
  </Typography>
)

const SuggestionButton = ({
  icon,
  label,
  onClick,
  loading,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  loading?: boolean
}) => (
  <Button
    variant="text"
    size="small"
    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : icon}
    onClick={onClick}
    disabled={loading}
    sx={{
      textTransform: 'none',
      color: '#D9974B',
      bgcolor: '#FFF8F0',
      px: 1.5,
      py: 0.5,
      borderRadius: 2,
      '&:hover': { bgcolor: '#FEEFD9' },
      fontSize: '0.8125rem',
    }}
  >
    {label}
  </Button>
)

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function AdEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { mutate: onSave, isPending: isSaving } = useUpdateItemMutation()
  const { data: initialData, isLoading, error } = useItemQuery(id!)

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isFetchingPrice, setIsFetchingPrice] = useState(false)
  const [openDescriptionDialog, setOpenDescriptionDialog] = useState(false)
  const [suggestedDescription, setSuggestedDescription] = useState('')
  const [openPriceDialog, setOpenPriceDialog] = useState(false)
  const [suggestedPriceValue, setSuggestedPriceValue] = useState<number | null>(
    null,
  )

  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'error',
  )

  const [form, setForm] = useState<ItemUpdatePayload>({
    title: '',
    price: 0,
    category: 'electronics',
    description: '',
    params: {},
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        price: initialData.price || 0,
        category: initialData.category || 'electronics',
        description: initialData.description || '',
        params: initialData.params || {},
      })
    }
  }, [initialData])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !initialData) {
    return (
      <Box sx={{ maxWidth: 1080, mx: 'auto', p: 3 }}>
        <Alert severity="error">
          <AlertTitle>Ошибка загрузки</AlertTitle>
          Не удалось загрузить данные объявления. Попробуйте обновить страницу.
        </Alert>
      </Box>
    )
  }

  const handleCategoryChange = (newCategory: Category) => {
    setForm((prev) => ({
      ...prev,
      category: newCategory,
      params: {},
    }))
    setErrors({})
  }

  const updateParam = (key: string, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      params: { ...prev.params, [key]: value },
    }))
    if (errors[`params.${key}`]) {
      const newErrors = { ...errors }
      delete newErrors[`params.${key}`]
      setErrors(newErrors)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    // Validate main fields
    const mainResult = ItemUpdateSchema.safeParse(form)
    if (!mainResult.success) {
      mainResult.error.errors.forEach((err) => {
        newErrors[err.path[0] as string] = err.message
      })
    }

    // Validate category params
    let paramsResult
    if (form.category === 'auto') {
      paramsResult = AutoItemParamsSchema.safeParse(form.params)
    } else if (form.category === 'real_estate') {
      paramsResult = RealEstateItemParamsSchema.safeParse(form.params)
    } else if (form.category === 'electronics') {
      paramsResult = ElectronicsItemParamsSchema.safeParse(form.params)
    }

    if (paramsResult && !paramsResult.success) {
      console.log(paramsResult)
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSave(
        {
          id: id!,
          data: form,
        },
        {
          onSuccess: () => {
            setSnackbarMessage('Объявление успешно сохранено')
            setSnackbarSeverity('success')
            setSnackbarOpen(true)
            setTimeout(() => navigate('/ads/' + id), 1500)
          },
          onError: (err: any) => {
            setSnackbarMessage(err.message || 'Ошибка при сохранении')
            setSnackbarSeverity('error')
            setSnackbarOpen(true)
          },
        },
      )
    } else {
      setSnackbarMessage('Пожалуйста, исправьте ошибки в форме')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const handleGenerateDescription = async () => {
    setIsGeneratingDescription(true)
    try {
      const descriptionData = {
        title: form.title,
        category: form.category,
        characteristics: form.params,
        currentDescription: form.description,
      }
      const generated = await generateDescription(descriptionData)
      setSuggestedDescription(generated)
      setOpenDescriptionDialog(true)
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Ошибка при генерации описания.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  const handleSuggestPrice = async () => {
    setIsFetchingPrice(true)
    try {
      const priceData = {
        title: form.title,
        category: form.category,
        characteristics: form.params,
      }
      const suggested = await suggestPrice(priceData)
      setSuggestedPriceValue(suggested)
      setOpenPriceDialog(true)
    } catch (error: any) {
      setSnackbarMessage(error.message || 'Ошибка при получении рыночной цены.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    } finally {
      setIsFetchingPrice(false)
    }
  }

  const applySuggestedDescription = () => {
    setForm((prev) => ({ ...prev, description: suggestedDescription }))
    setOpenDescriptionDialog(false)
  }

  const applySuggestedPrice = () => {
    if (suggestedPriceValue !== null) {
      setForm((prev) => ({ ...prev, price: suggestedPriceValue }))
    }
    setOpenPriceDialog(false)
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 800, mx: 'auto', p: 4 }}
    >
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>
        Редактирование объявления
      </Typography>

      <Stack spacing={4}>
        {/* Category */}
        <Box>
          <Label>Категория</Label>
          <FormControl fullWidth size="small">
            <Select
              value={form.category}
              onChange={(e) => handleCategoryChange(e.target.value as Category)}
              sx={{ borderRadius: 2, bgcolor: 'white' }}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Title */}
        <Box>
          <Label required>Название</Label>
          <TextField
            fullWidth
            size="small"
            placeholder="MacBook Pro 16"
            value={form.title}
            error={!!errors.title}
            helperText={errors.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            slotProps={{
              input: {
                endAdornment: form.title && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setForm({ ...form, title: '' })}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              },
            }}
          />
        </Box>

        {/* Price */}
        <Box>
          <Label required>Цена</Label>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              sx={{
                flexGrow: 1,
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
              size="small"
              type="number"
              value={form.price}
              error={!!errors.price}
              helperText={errors.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
              slotProps={{
                input: {
                  endAdornment: form.price !== 0 && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setForm({ ...form, price: 0 })}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 },
                },
              }}
            />
            <SuggestionButton
              onClick={handleSuggestPrice}
              icon={<LightbulbOutlinedIcon fontSize="small" />}
              label="Узнать рыночную цену"
              loading={isFetchingPrice}
            />
          </Box>
        </Box>

        {/* Dynamic Characteristics */}
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Характеристики
          </Typography>

          <Stack spacing={2.5}>
            {/* --- Electronics Fields --- */}
            {form.category === 'electronics' && (
              <>
                <Box>
                  <Label>Тип</Label>
                  <FormControl
                    fullWidth
                    size="small"
                    error={!!errors['params.type']}
                  >
                    <Select
                      value={(form.params as ElectronicsItemParams).type || ''}
                      onChange={(e) => updateParam('type', e.target.value)}
                      displayEmpty
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="" disabled>
                        Выберите тип
                      </MenuItem>
                      {ELECTRONICS_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors['params.type'] && (
                      <FormHelperText>{errors['params.type']}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
                <Box>
                  <Label>Бренд</Label>
                  <TextField
                    fullWidth
                    size="small"
                    value={(form.params as ElectronicsItemParams).brand || ''}
                    error={!!errors['params.brand']}
                    helperText={errors['params.brand']}
                    onChange={(e) => updateParam('brand', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
                <Box>
                  <Label>Модель</Label>
                  <TextField
                    fullWidth
                    size="small"
                    value={(form.params as ElectronicsItemParams).model || ''}
                    error={!!errors['params.model']}
                    helperText={errors['params.model']}
                    onChange={(e) => updateParam('model', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
                <Box>
                  <Label>Цвет</Label>
                  <TextField
                    fullWidth
                    size="small"
                    value={(form.params as ElectronicsItemParams).color || ''}
                    error={!!errors['params.color']}
                    helperText={errors['params.color']}
                    onChange={(e) => updateParam('color', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
                <Box>
                  <Label>Состояние</Label>
                  <FormControl
                    fullWidth
                    size="small"
                    error={!!errors['params.condition']}
                  >
                    <Select
                      value={
                        (form.params as ElectronicsItemParams).condition || ''
                      }
                      onChange={(e) => updateParam('condition', e.target.value)}
                      displayEmpty
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="" disabled>
                        Выберите состояние
                      </MenuItem>
                      {CONDITIONS.map((c) => (
                        <MenuItem key={c.value} value={c.value}>
                          {c.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors['params.condition'] && (
                      <FormHelperText>
                        {errors['params.condition']}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Box>
              </>
            )}

            {/* --- Auto Fields --- */}
            {form.category === 'auto' && (
              <>
                <Box>
                  <Label>Марка</Label>
                  <TextField
                    fullWidth
                    size="small"
                    value={(form.params as AutoItemParams).brand || ''}
                    error={!!errors['params.brand']}
                    helperText={errors['params.brand']}
                    onChange={(e) => updateParam('brand', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
                <Box>
                  <Label>Модель</Label>
                  <TextField
                    fullWidth
                    size="small"
                    value={(form.params as AutoItemParams).model || ''}
                    error={!!errors['params.model']}
                    helperText={errors['params.model']}
                    onChange={(e) => updateParam('model', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
                <Box>
                  <Label>Год выпуска</Label>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={
                      (form.params as AutoItemParams).yearOfManufacture || ''
                    }
                    error={!!errors['params.yearOfManufacture']}
                    helperText={errors['params.yearOfManufacture']}
                    onChange={(e) =>
                      updateParam('yearOfManufacture', Number(e.target.value))
                    }
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
                <Box>
                  <Label>Коробка передач</Label>
                  <FormControl
                    fullWidth
                    size="small"
                    error={!!errors['params.transmission']}
                  >
                    <Select
                      value={(form.params as AutoItemParams).transmission || ''}
                      onChange={(e) =>
                        updateParam('transmission', e.target.value)
                      }
                      displayEmpty
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="" disabled>
                        Выберите КПП
                      </MenuItem>
                      {TRANSMISSIONS.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors['params.transmission'] && (
                      <FormHelperText>
                        {errors['params.transmission']}
                      </FormHelperText>
                    )}
                  </FormControl>
                </Box>
                <Box>
                  <Label>Пробег (км)</Label>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={(form.params as AutoItemParams).mileage || ''}
                    error={!!errors['params.mileage']}
                    helperText={errors['params.mileage']}
                    onChange={(e) =>
                      updateParam('mileage', Number(e.target.value))
                    }
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
                <Box>
                  <Label>Мощность двигателя (л.с.)</Label>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={(form.params as AutoItemParams).enginePower || ''}
                    error={!!errors['params.enginePower']}
                    helperText={errors['params.enginePower']}
                    onChange={(e) =>
                      updateParam('enginePower', Number(e.target.value))
                    }
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
              </>
            )}

            {/* --- Real Estate Fields --- */}
            {form.category === 'real_estate' && (
              <>
                <Box>
                  <Label>Тип недвижимости</Label>
                  <FormControl
                    fullWidth
                    size="small"
                    error={!!errors['params.type']}
                  >
                    <Select
                      value={(form.params as RealEstateItemParams).type || ''}
                      onChange={(e) => updateParam('type', e.target.value)}
                      displayEmpty
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="" disabled>
                        Выберите тип
                      </MenuItem>
                      {REAL_ESTATE_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors['params.type'] && (
                      <FormHelperText>{errors['params.type']}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
                <Box>
                  <Label>Адрес</Label>
                  <TextField
                    fullWidth
                    size="small"
                    value={(form.params as RealEstateItemParams).address || ''}
                    error={!!errors['params.address']}
                    helperText={errors['params.address']}
                    onChange={(e) => updateParam('address', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
                <Box>
                  <Label>Площадь (м²)</Label>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={(form.params as RealEstateItemParams).area || ''}
                    error={!!errors['params.area']}
                    helperText={errors['params.area']}
                    onChange={(e) =>
                      updateParam('area', Number(e.target.value))
                    }
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
                <Box>
                  <Label>Этаж</Label>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={(form.params as RealEstateItemParams).floor || ''}
                    error={!!errors['params.floor']}
                    helperText={errors['params.floor']}
                    onChange={(e) =>
                      updateParam('floor', Number(e.target.value))
                    }
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Box>
              </>
            )}
          </Stack>
        </Box>

        {/* Description */}
        <Box>
          <Label>Описание</Label>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value.slice(0, 1000) })
            }
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 1,
              alignItems: 'center',
            }}
          >
            <SuggestionButton
              icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
              label="Улучшить описание"
              onClick={handleGenerateDescription}
              loading={isGeneratingDescription}
            />
            <Typography variant="caption" color="text.secondary">
              {form.description?.length || 0} / 1000
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={isSaving}
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {isSaving ? <CircularProgress size={24} /> : 'Сохранить'}
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={() => navigate(-1)}
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#E0E0E0',
              color: 'text.primary',
              '&:hover': { bgcolor: '#D5D5D5' },
            }}
          >
            Отменить
          </Button>
        </Stack>
      </Stack>

      {/* Description Suggestion Dialog */}
      <Dialog
        open={openDescriptionDialog}
        onClose={() => setOpenDescriptionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Предложенное описание</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={suggestedDescription}
            onChange={(e) => setSuggestedDescription(e.target.value)}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDescriptionDialog(false)}>
            Отмена
          </Button>
          <Button onClick={applySuggestedDescription} variant="contained">
            Применить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Price Suggestion Dialog */}
      <Dialog
        open={openPriceDialog}
        onClose={() => setOpenPriceDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Предложенная рыночная цена</DialogTitle>
        <DialogContent>
          {suggestedPriceValue !== null ? (
            <Typography variant="h5" textAlign="center" sx={{ my: 2 }}>
              {suggestedPriceValue.toLocaleString('ru-RU')} ₽
            </Typography>
          ) : (
            <Typography variant="body1" textAlign="center" sx={{ my: 2 }}>
              Не удалось определить рыночную цену.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPriceDialog(false)}>Отмена</Button>
          {suggestedPriceValue !== null && (
            <Button onClick={applySuggestedPrice} variant="contained">
              Применить
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
