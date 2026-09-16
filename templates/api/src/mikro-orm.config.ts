import { loadEnv } from './config/env'
import { createOrmConfig } from './mikro-orm.factory'

export default createOrmConfig(loadEnv())
