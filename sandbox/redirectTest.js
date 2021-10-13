import Request from "../index.js";

const r = new Request({
  onRequestOpts: opts => console.log('>', opts.url.toString())
})

await r({
  url: 'https://google.com',
  followRedirects: 1
}).then(re => console.log(re.statusCode)) //should be 200
