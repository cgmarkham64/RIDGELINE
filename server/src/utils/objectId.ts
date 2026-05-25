import { Types } from 'mongoose'

export function validObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id)
}