import { Loadout } from '../models/Loadout'
import { makeOwnerCrudRouter } from '../utils/crudFactory'

export default makeOwnerCrudRouter(Loadout, { populateField: 'items' })