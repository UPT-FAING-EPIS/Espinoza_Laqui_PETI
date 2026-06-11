const ACTIVE_PETI_GROUP_KEY = 'strategicti:active-peti-group-id'

export function getActivePetiGroupId() {
  const rawValue = window.sessionStorage.getItem(ACTIVE_PETI_GROUP_KEY)
  const groupId = Number(rawValue)
  return Number.isInteger(groupId) && groupId > 0 ? groupId : null
}

export function setActivePetiGroupId(groupId: number) {
  if (Number.isInteger(groupId) && groupId > 0) {
    window.sessionStorage.setItem(ACTIVE_PETI_GROUP_KEY, String(groupId))
  }
}

export function clearActivePetiGroupId() {
  window.sessionStorage.removeItem(ACTIVE_PETI_GROUP_KEY)
}
