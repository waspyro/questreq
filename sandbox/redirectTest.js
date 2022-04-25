import {Request} from "../index.js";

const r = new Request({
  beforeRequest: (ctx) => new Promise(resolve => { //test async
    console.log('>', ctx.request.url.toString())
    setTimeout(resolve, 1000)
  })
})

await r({
  url: 'https://google.com',
  followRedirects: 1
}).then(re => console.log(re.statusCode)) //should be 200

await r({
  url: 'https://google.com',
  followRedirects: 0
}).then(re => console.log(re.statusCode)) //should throw error