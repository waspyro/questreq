import Request from "../index.js";

const r = Request.func
await r({
  url: 'https://google.com',
  followRedirects: 1
}).then(re => console.log(re.statusCode)) //should be 200
