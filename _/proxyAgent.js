const { SocksProxyAgent } = require('socks-proxy-agent');

const getAgent = (proxy) => {
    try {
        return new SocksProxyAgent(proxy);
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = getAgent