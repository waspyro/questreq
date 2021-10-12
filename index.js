import Request from './components/request.js'

const r = Request.func
// r.hooks.onRequest.add((opts) => console.log(opts.url))
const re = await r({
  url: 'https://reqres.in/api/users',
  method: 'POST',
  json: {
    "name": "morpheus",
    "job": "asdasd"
  },
  pull: 'json'
})
console.log(re)
// console.log(re.headers)

export default Request

