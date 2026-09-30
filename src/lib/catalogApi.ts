import { resourceApi } from './api'
import type { Category, Location, Role } from '../types/inventory'

export const categoriesApi = resourceApi<Category, Omit<Category, 'id'>>('categories')
export const locationsApi = resourceApi<Location, Omit<Location, 'id' | 'active'>>('locations')
export const rolesApi = resourceApi<Role, Omit<Role, 'id'>>('roles')
