import Request from "../index.js";

const r = Request.func
await r({
  url: 'https://reqres.in/api/users',
  method: 'POST',
  json: {
    "name": "morpheus",
    "job": "leader"
  },
  pull: 'json'
}).then(re => console.log(re)) //should be {name: 'morpheus'...}
