import Request from "../index.js";

let cookieStore = {}

const r = new Request({
  cookieReceiver: cookies => cookies.forEach(cookie => cookieStore[cookie.name] = cookie.value),
  cookiesSetter: () => cookieStore,
  onRequestOpts: opts => console.log(opts.url.toString()),
})

await r({
  url: 'https://steamcommunity.com',
}).then(({cookies}) => console.log(cookies.length)) //should be 2

await r({
  url: 'https://steamcommunity.com',
}).then(({cookies}) => console.log(cookies.length)) //should be 0

cookieStore = {}

await r({ //ignoring cookies for this case and set only one that we choose
  url: 'https://steamcommunity.com',
  cookieReceiver: null //testing falsy case here; but we also can use it to handle logic below
}).then(({cookies}) => {
  const {name, value} = cookies[0]
  cookieStore[name] = value
  console.log(cookies.length)
}) //should be 2

await r({
  url: 'https://steamcommunity.com',
}).then(({cookies}) => console.log(cookies.length)) //should be 1

console.log(Object.keys(cookieStore).length) //should be 2
