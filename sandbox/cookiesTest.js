import Request from "../index.js";

const r = Request.func
const cookies = []
r.hooks.beforeRequest.add((opts) => console.log(opts.url.toString()))
r.hooks.onSetCookie.add(c => cookies.push(...c))
await r({
  url: 'https://steamcommunity.com',
  cookies: cookies.map(({name, value}) => `${name}=${value}`).join(';')
}).then(re => console.log(re.cookies.length)) //should be 2

await r({
  url: 'https://steamcommunity.com',
  cookies: cookies.map(({name, value}) => `${name}=${value}`).join(';')
}).then(re => console.log(re.cookies.length)) //should be 0
