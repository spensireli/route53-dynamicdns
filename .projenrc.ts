import { awscdk } from 'projen';

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.180.0',
  defaultReleaseBranch: 'main',
  name: 'route53-dynamicdns',
  projenrcTs: true,
  gitignore: [
    'cdk.context.json',
  ],

  deps: [
    'aws-lambda',
    '@types/node',
    '@types/aws-lambda',
    '@aws-sdk/client-ssm',
    '@aws-sdk/client-route-53',
  ], /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  devDeps: [
    'aws-lambda',
    '@types/aws-lambda',
    '@aws-sdk/client-ssm',
    '@aws-sdk/client-route-53',
  ], /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();