import Request from "../index.js";

const r = new Request
const req = r({
  url: 'https://reqres.in/api/users',
  method: 'POST',
  json: {
    "name": "morpheus",
    "job": "leader"
  },
  pull: 'json'
}).then(console.log) //should be name: 'morpheus'...
