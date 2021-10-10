export default class Hooks {
  hooks = []

  add(hook) {
    return this.hooks.push(hook)
  }

  delete(hook) {
    const i = this.hooks.indexOf(hook)
    if(i > -1) return this.hooks.splice(i, 1).length
    return -1
  }

  async run(args, additionalHooks) {
    let hooks = this.hooks
    if(additionalHooks) hooks = Array.isArray(additionalHooks) ?
      [...hooks, ...additionalHooks] : [...hooks, additionalHooks]

    const modify = (newArgs) => args = newArgs
    for(let i = 0; i < hooks.length; i++)
      await hooks[i](args, modify)

    return args
  }
}
