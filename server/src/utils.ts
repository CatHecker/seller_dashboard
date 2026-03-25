import { Item } from '../../shared/types/types.ts'
import {
  AutoItemParamsSchema,
  ElectronicsEstateItemParamsSchema,
  RealEstateItemParamsSchema,
} from './validation.ts'

export const doesItemNeedRevision = (item: Item): boolean =>
  !item.description ||
  !(() => {
    if (item.category === 'auto')
      return AutoItemParamsSchema.safeParse(item.params).success
    if (item.category === 'real_estate')
      return RealEstateItemParamsSchema.safeParse(item.params).success

    return ElectronicsEstateItemParamsSchema.safeParse(item.params).success
  })()
