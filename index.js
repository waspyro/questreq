import http from 'http'
import https from 'https'
import querystring from "./qs.js";

const REDIRECT_CODES = [301, 302, 307, 308];
const SUCCESS_CODES = [200, 201];

const defaultPullers = {
  'response': response => response,
  'json': response => JSON.parse(response.body),
  'body': response => response.body,
  'cookies': response => response.getCookies()
}

export function Request(defaultOptions = {}, pullers = {}) {
  pullers = Object.assign({}, defaultPullers, pullers)

  //url, method, body, json, from, cookies, headers, followRedirect, agent, onInit, beforeRequest, onResponse, abortController
  async function request(opts) {
    let ctx = {user: Object.assign({}, opts.defaults ? opts.defaults : request.defaults, opts)}
    ctx = await runHooks(ctx.user.onInit, ctx) //onInit

    ctx.request = normalizeRequestOptions(ctx.user)
    ctx = await runHooks(ctx.user.beforeRequest, ctx) //beforeRequest

    ctx.response = await doRequest(ctx.request) //todo timer/controller
    ctx = await runHooks(ctx.user.onResponse, ctx) //onResponse

    if(ctx.user.followRedirects > 0 && REDIRECT_CODES.includes(ctx.response.statusCode)) {
      opts.followRedirects--
      if(ctx.response.headers.location)
        opts.url = ctx.response.headers.location
      return request(opts)
    }

    if(ctx.user.expectStatusCode !== 'any') {
      if(!ctx.user.expectStatusCodes && ctx.user.expectStatusCode)
        ctx.user.expectStatusCodes = [ctx.user.expectStatusCode]
      else ctx.user.expectStatusCodes = SUCCESS_CODES
      if(!ctx.user.expectStatusCodes.includes(ctx.response.statusCode))
        throw new BadResponseError(ctx)
    }

    if(ctx.user.pull) {
      if(typeof ctx.user.pull === 'function') return ctx.user.pull(ctx.response)
      return request.pullers[ctx.user.pull](ctx.response)
    }

    return ctx.response
  }

  request.pullers = pullers
  request.defaults = defaultOptions
  return request

}

export default Request()

class BadResponseError extends Error {
  constructor({request, response}) {
    super('unexpected response status code: ' + response.statusCode);
    this.code = response.statusCode
    this.url = request?.url?.toString()
    this.responseBody = response.body
  }
}

class TimeoutError extends Error {
  constructor() {
    super('timeout');
  }
}

async function runHooks(hooks, args) {
  if(!hooks?.length) return args
  if(!Array.isArray(hooks)) hooks = [hooks]
  for(const hook of hooks) await hook(args, () => console.warn('deprecated argument "next" used'))
  return args
}

function parseSetCookies(cookies = []) {
  return cookies.map(str => {
    const parts = str.split(';').map(part => part.trim().split('='))
    const [name, value] = parts.shift()
    const cookie = {name,value}
    for(const [key, value = true] of parts)
      cookie[key.toLowerCase()] = typeof value === 'string'
          ? decodeURIComponent(value) : value
    return cookie
  })
}

function doRequest(requestOptions) {
  const request = requestOptions.url.protocol === 'https:' ? https.request : http.request
  return new Promise((resolve, reject) => {
    let completed = false
    const req = request(requestOptions.url, requestOptions, response => {
      response.requestOptions = requestOptions
      response.body = ''
      response.on('data', chunk => response.body += chunk)
      response.on('end', () => {
        completed = true
        resolve(response)
      })
      response.getCookies = () => {
        const cookies = parseSetCookies(response.headers['set-cookie'])
        response.getCookies = () => cookies
        return cookies
      }
    }).end(requestOptions.body)
        .on('error', err => completed || reject(err)) //fix for https://github.com/nodejs/node/issues/27916
  })
}

function normalizeRequestOptions(userOptions) {
  const requestOptions = {
    headers: userOptions.headers || {},
    url: userOptions.url instanceof URL
        ? userOptions.url
        : new URL(userOptions.url.startsWith('http')
            ? userOptions.url
            : 'https://' + userOptions.url),
    body: userOptions.body,
    method: userOptions.method || 'GET',
    agent: userOptions.agent
  }

  if(userOptions.qs) {
    if(Array.isArray(userOptions.qs)) requestOptions.url.search = querystring(...userOptions.qs)
    else requestOptions.url.search = querystring(userOptions.qs)
  }

  if (userOptions.method === 'POST') {
    if (userOptions.form) {
      requestOptions.headers['content-type'] = 'application/x-www-form-urlencoded'
      if(!userOptions.body) requestOptions.body = new URLSearchParams(userOptions.form).toString()
    } else if (userOptions.json) {
      requestOptions.headers['content-type'] = 'application/json'
      if(!userOptions.body) requestOptions.body = JSON.stringify(userOptions.json)
    }
    requestOptions.headers['content-length'] = Buffer.byteLength(requestOptions.body)
  }

  if(userOptions.cookies) {
    const cookieStr = Object.entries(userOptions.cookies)
        .filter(cookie => cookie[1])
        .map(([name, value]) => `${name}=${value}`)
        .join('; ')
    if(cookieStr) requestOptions.headers.cookie = cookieStr
  }

  return requestOptions
}
