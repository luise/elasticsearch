const { Infrastructure, Machine } = require('kelda');
const Elasticsearch = require('./elasticsearch.js').Elasticsearch;

const clusterSize = 2;

const baseMachine = new Machine({ provider: 'Amazon' });
const infra = new Infrastructure({
  masters: baseMachine,
  workers: baseMachine.replicate(clusterSize),
});

const elasticsearch = new Elasticsearch(clusterSize);
elasticsearch.allowFromPublic();
elasticsearch.deploy(infra);
