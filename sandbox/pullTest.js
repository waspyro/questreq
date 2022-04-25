import request from "../index.js";

const req = request({
  url: 'https://reqres.in/api/users',
  method: 'POST',
  json: {
    "name": "morpheus",
    "job": "leader"
  },
  pull: 'json'
}).then(console.log) //should be name: 'morpheus'...
