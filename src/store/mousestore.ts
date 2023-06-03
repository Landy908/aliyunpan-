import { defineStore } from 'pinia'

export interface MouseMessage {
  isTrusted: boolean;
  Ctrl: boolean;
  Shift: boolean;
  Alt: boolean;
  button: number;
  buttons: number;
}

export interface MouseState {
  MouseEvent: MouseMessage
}

const useMouseStore = defineStore('mouse', {
  state: (): MouseState => ({
    MouseEvent: {
      isTrusted: false,
      Ctrl: false,
      Shift: false,
      Alt: false,
      button: 0,
      buttons: 0
    } as MouseMessage,
  }),
  getters: {},
  actions: {
    updateStore(partial: Partial<MouseState>) {
      this.$patch(partial)
    },
    KeyDown(event: MouseEvent) {
      // console.log('MouseEvent', event)
      this.MouseEvent = {
        isTrusted: event.isTrusted,
        Ctrl: event.ctrlKey,
        Shift: event.shiftKey,
        Alt: event.altKey,
        button: event.button,
        buttons: event.buttons
      }
    }
  }
})

export default useMouseStore
