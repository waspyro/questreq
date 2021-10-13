import Request from "../index.js";

const cookies = []

const r = new Request({
  cookieSaver: cookie => cookies.push(cookie),
  cookieGetter: () => cookies.map(({name, value}) => `${name}=${value}`).join('; '),
  onRequestOpts: opts => console.log(opts.url.toString()),
  saveCookies: false,
  useCookies: true
})

await r({
  url: 'https://steamcommunity.com',
}).then(re => {
  const cookies = re.getCookies()
  console.log(cookies.length)
  cookies[0].save()
}) //should be 2

await r({
  url: 'https://steamcommunity.com',
}).then(re => {
  const cookies = re.getCookies()
  console.log(cookies.length)
  cookies.save()
}) //should be 1

await r({
  url: 'https://steamcommunity.com',
}).then(re => console.log(re.getCookies().length)) //should be 0
