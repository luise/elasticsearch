const kelda = require('kelda');

function getHostname(c) {
  return c.getHostname();
}

function Elasticsearch(n) {
  this.containers = [];
  for (let i = 0; i < n; i += 1) {
    this.containers.push(new kelda.Container({
      name: 'elasticsearch',
      image: 'elasticsearch:2.4',
      command: [
        '--transport.tcp.port', `${this.transportPorts.min}-${this.transportPorts.max}`,
        '--http.port', this.port.toString(),
      ],
    }));
  }
  this.loadBalancer = new kelda.LoadBalancer({
    name: 'elasticsearch-lb',
    containers: this.containers,
  });

  if (n > 1) {
    const hosts = this.containers.map(getHostname).join(',');
    this.containers.forEach((c) => {
      c.command.push(
        '--discovery.zen.ping.unicast.hosts', hosts,
        '--network.host', '0.0.0.0');
    });
  }

  kelda.allowTraffic(this.containers, this.containers, this.transportPorts);
}

Elasticsearch.prototype.uri = function uri() {
  return `http://${this.loadBalancer.hostname()}:${this.port}`;
};

Elasticsearch.prototype.allowFromPublic = function allowFromPublic() {
  kelda.allowTraffic(kelda.publicInternet, this.containers, this.port);
  return this;
};

Elasticsearch.prototype.addClient = function addClient(clnt) {
  kelda.allowTraffic(clnt, this.loadBalancer, this.port);
};

Elasticsearch.prototype.deploy = function deploy(depl) {
  this.containers.forEach(container => container.deploy(depl));
  this.loadBalancer.deploy(depl);
};

Elasticsearch.prototype.transportPorts = new kelda.PortRange(9300, 9400);
Elasticsearch.prototype.port = 9200;

exports.Elasticsearch = Elasticsearch;
