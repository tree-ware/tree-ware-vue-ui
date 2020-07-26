import { ComputedOptions } from 'vue'
import { createDecorator } from 'vue-class-component'

export const NoCache = createDecorator((options, key) => {
  if (options.computed) {
    let computedOptions = options.computed[key] as ComputedOptions<any>
    computedOptions.cache = false
  }
})
