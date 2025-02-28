import path from 'path';
import {
  Stack, StackProps,
  aws_route53 as route53,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambda_node,
  aws_events as events,
  aws_events_targets as targets,
  aws_iam as iam,
  aws_ssm as ssm,
  Duration,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface DynamicDnsStackProps extends StackProps {
  hostedZoneName: string; // The hosted zone domain name ex: conklin.io
  pollInterval: number; // In seconds how often to poll for IP address updates. Defaults to 60 seconds.
}

export class DynamicDnsStack extends Stack {
  constructor(scope: Construct, id: string, props: DynamicDnsStackProps) {
    super(scope, id, props);
    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: props.hostedZoneName,
    });

    const dynamicDnsParam = new ssm.StringParameter(this, 'IPParameter', {
      description: 'This is the WAN IP Address from your on-premise system which is subject to change.',
      parameterName: 'DynamicDNSIpAddress',
      stringValue: '127.0.0.1',
      tier: ssm.ParameterTier.STANDARD,

    });

    const dynamicDnsFunction = new lambda_node.NodejsFunction(this, 'DynamicDnsLambdaFunction', {
      entry: path.join(__dirname, 'lambda', 'handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_LATEST,
      memorySize: 512,
      timeout: Duration.seconds(10),
      bundling: {
        minify: true,
        externalModules: ['aws-sdk'],
      },
      environment: {
        HOSTED_ZONE_ID: zone.hostedZoneId,
        SSM_PARAM: dynamicDnsParam.parameterName,
      },
    });
    dynamicDnsParam.grantRead(dynamicDnsFunction);

    const pollingRule = new events.Rule(this, 'PollEvent', {
      schedule: events.Schedule.rate(Duration.seconds(props.pollInterval)),
    });

    pollingRule.addTarget(new targets.LambdaFunction(dynamicDnsFunction));
    dynamicDnsFunction.grantInvoke(new iam.ServicePrincipal('events.amazonaws.com'));
  }
}
