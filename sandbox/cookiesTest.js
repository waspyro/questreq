import {Request} from "../index.js";

let cookieStore = {}

const r = Request({
  onInit: (ctx) => ctx.user.cookies = cookieStore,
  onResponse: ctx => ctx.response.getCookies().forEach(({name, value}) => cookieStore[name] = value),
  pull: 'cookies'
})

await r({
  url: 'https://steamcommunity.com',
}).then((cookies) => console.log(cookies.length)) //should be 2

await r({
  url: 'https://steamcommunity.com',
}).then((cookies) => console.log(cookies.length)) //should be 0
