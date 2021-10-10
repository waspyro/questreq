import http from 'http'
import https from 'https'
import Hooks from './hooks.js'

export default class Request {

  static get func() {
    const request = new this
    const mainEntry = request.request.bind(request)
    for (const prop in request) mainEntry[prop] = request[prop]
    return mainEntry
  }

  constructor() {
    this.setRandomDefaultUserAgentHeader()
  }

  defaultHeaders = {
    'Accept': '*/*',
    'Accept-Language': 'en-gb'
  }

  hooks = {
    onCreation: new Hooks,
    onRequest: new Hooks,
    onResponse: new Hooks,
    onReturn: new Hooks
  }

  #getRequestOptions(userOptions) {
    const requestOptions = {
      headers: Object.assign(this.defaultHeaders, userOptions.headers), //todo: deep merge
      url: typeof userOptions.url === 'string' ? new URL(userOptions.url) : userOptions.url,
      body: userOptions.body,
      method: userOptions.method || 'GET',
      agent: userOptions.agent || false
    }

    if (userOptions.method === 'POST') {
      if (userOptions.form) {
        if (requestOptions.body === undefined)
          requestOptions.body = new URLSearchParams(userOptions.form).toString()
        requestOptions.headers['content-type'] = 'application/x-www-form-urlencoded'
      } else if (userOptions.json) {
        if (requestOptions.body === undefined)
          requestOptions.body = JSON.stringify(userOptions.json)
        requestOptions.headers['content-type'] = 'application/json'
      }
      requestOptions.headers['content-length'] = Buffer.byteLength(requestOptions.body)
    }

    if (userOptions.cookies) {
      requestOptions.headers.cookie = typeof userOptions.cookies === 'string'
        ? userOptions.cookies
        : userOptions.cookies.toString()
    }

    return requestOptions
  }

  //url, headers, method, body, agent
  #doRequest(opts) {
    const request = opts.url.protocol === 'https:' ? https.request : http.request
    const requestOpts = {headers: opts.headers, method: opts.method, agent: opts.agent}
    return new Promise((resolve, reject) => {
      const req = request(opts.url, requestOpts, response => {
        let body = ''
        response.on('data', chunk => body += chunk)
        response.on('end', () => {
          const {statusCode, statusMessage, rawHeaders} = response
          resolve({statusCode, statusMessage, rawHeaders, body, requestOpts: opts})
        })
      })
      if (opts.body) req.write(opts.body)
      req.end()
    })
  }

  //todo: return request object which can be awaited, repeated, cancelled
  //method, url, body, form, headers, cookies, returnType, onRedirect, timeout, json, maxRedirects, returnBody, returnType
  async request(opts) {
    const additionalHooks = opts.hooks || {}

    const userOptions = await this.hooks.onCreation.run(
      opts, additionalHooks.onCreation)
    const requestOptions = await this.hooks.onRequest.run(
      this.#getRequestOptions(userOptions), additionalHooks.onRequest)
    const response = await this.hooks.onResponse.run(
      await this.#doRequest(requestOptions), additionalHooks.onResponse)

    if (response.statusCode === 301 && userOptions.followRedirects > 0) {
      userOptions.followRedirects--
      return this.request(userOptions)
    }

    if (response.statusCode < 200 || response.statusCode > 300) throw response
    return this.hooks.onReturn.run(response, additionalHooks.onReturn)
  }

  #getRandomUserAgent(isMobile) { //todo: type: mobile / desktop
    return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
  }

  setDefaultUserArgentHeader(sUserAgent) {
    this.defaultHeaders['User-Agent'] = sUserAgent
  }

  setRandomDefaultUserAgentHeader(isMobile) {
    this.setDefaultUserArgentHeader(this.#getRandomUserAgent(isMobile))
  }

}
