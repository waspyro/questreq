import http from 'http'
import https from 'https'

export default class Request {

  constructor(opts) {
    this.opts = this.#mergeOpts(opts)
    const mainEntry = this.request.bind(this)
    for (const prop in this) mainEntry[prop] = this[prop]
    return mainEntry
  }

  #mergeOpts(newOpts) {
    return Object.assign(this.opts, newOpts)
  }

  opts = {
    url: undefined,
    body: undefined,
    form: undefined,
    json: undefined,
    pull: undefined,
    onInit: [],
    onRequestOpts: [],
    beforeRequest: [],
    onResponse: [],
    followRedirects: false,
    method: 'GET',
    agent: false,
    saveCookies: false,
    appendCookies: false,
    useCookies: false,
    cookieSaver: () => {},
    cookieGetter: () => {},
    headers: {
      'Accept': '*/*',
      'Accept-Language': 'en-gb'
    }
  }

  responseParsers = new Map([
    ['json', resp => JSON.parse(resp.body)],
    ['body', resp => resp.body]
  ])

  #getRequestOptions(userOptions) {
    const requestOptions = {
      headers: userOptions.headers,
      url: userOptions.url,
      body: userOptions.body,
      method: userOptions.method,
      agent: userOptions.agent
    }

    if (userOptions.method === 'POST') {
      if (userOptions.form) {
        requestOptions.body = new URLSearchParams(userOptions.form).toString()
        requestOptions.headers['content-type'] = 'application/x-www-form-urlencoded'
      } else if (userOptions.json) {
        requestOptions.body = JSON.stringify(userOptions.json)
        requestOptions.headers['content-type'] = 'application/json'
      }
      requestOptions.headers['content-length'] = Buffer.byteLength(requestOptions.body)
    }

    if (userOptions.useCookies)
      requestOptions.headers.cookie = userOptions.cookieGetter(userOptions.appendCookies)

    return requestOptions
  }

  #doRequest(requestOpts) {
    const request = requestOpts.url.protocol === 'https:' ? https.request : http.request
    return new Promise((resolve, reject) => {
      request(requestOpts.url, requestOpts, response => {
        response.requestOptions = requestOpts
        response.body = ''
        response.on('data', chunk => response.body += chunk)
        response.on('end', () => resolve(response))
        response.getCookies = () => {
          if(response.cookies === undefined)
            response.cookies = this.#parseSetCookies(response.headers['set-cookie'])
          return response.cookies
        }
      }).end(requestOpts.body)
    })
  }

  #parseSetCookies(cookies = []) {
    const cookiesArr = cookies.map(str => {
      const parts = str.split(';').map(part => part.trim().split('='))
      const [name, value] = parts.shift()
      const cookie = {name,value}
      for(const [key, value = true] of parts)
        cookie[key.toLowerCase()] = decodeURIComponent(value)
      cookie.save = () => this.opts.cookieSaver(cookie)
      return cookie
    })
    cookiesArr.save = () => cookiesArr.forEach(c => c.save())
    return cookiesArr
  }

  #runHooks(hooks, args) {
    if(!Array.isArray(hooks)) hooks = [hooks]
    const modify = (newArgs) => args = newArgs
    for(let i = 0; i < hooks.length; i++) hooks[i](args, modify)
    return args
  }

  async request(userOpts) {
    userOpts.url = new URL(userOpts.url)
    userOpts = this.#mergeOpts(userOpts)
    userOpts = this.#runHooks(userOpts.onInit, userOpts)
    const requestOptions = this.#runHooks(userOpts.onRequestOpts, this.#getRequestOptions(userOpts))
    const response = this.#runHooks(userOpts.onResponse, await this.#doRequest(requestOptions))
    if(userOpts.saveCookies) response.getCookies().forEach(c => c.save())

    //todo: "remember redirect" option?
    if (response.statusCode === 301 && userOpts.followRedirects > 0) {
      userOpts.followRedirects--
      userOpts.url = response.headers.location
      return this.request(userOpts)
    }

    if (response.statusCode < 200 || response.statusCode > 300) throw response

    if(userOpts.pull)
      return typeof userOpts.pull === 'function'
        ? userOpts.pull(response)
        : this.responseParsers.get(userOpts.pull)(response)

    return response
  }

}
