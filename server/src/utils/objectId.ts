import { Types } from 'mongoose'

export function validObjectId(id: string | string[]): boolean {
  return typeof id === 'string' && Types.ObjectId.isValid(id)
}