import { SetMetadata } from '@nestjs/common'
import { IS_PUBLIC } from './auth.constants'

export const Public = () => SetMetadata(IS_PUBLIC, true)
