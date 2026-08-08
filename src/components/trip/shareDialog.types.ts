export interface Collaborator {
  sub: string
  name: string
  role?: 'read' | 'edit'
}
