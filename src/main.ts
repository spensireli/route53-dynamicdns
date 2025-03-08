import { App } from 'aws-cdk-lib';
import { DynamicDnsStack } from './DynamicDnsStack';

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new DynamicDnsStack(app, 'route53-dynamicdns', { env: devEnv, hostedZoneName: 'conklin.io', pollInterval: 120, subDomainName: 'home.conklin.io' });

app.synth();