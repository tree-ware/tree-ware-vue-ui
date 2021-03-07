import { CommandItemData } from './CommandInterfaces'

export function useTreeWareCommandPalette() {
  function applyCommand(command: CommandItemData) {
    if (typeof command.action === 'number') return
    command.action()
  }

  return { applyCommand }
}
