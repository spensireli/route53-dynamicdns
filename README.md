# Route53 Dynamic DNS
An ultra cheap Dynamic DNS service deployed with AWS CDK that is hosted on AWS with zero third-party dependencies (not counting AWS). Similar to Duck DNS but with your domain. 


### Why? 
Residential ISPs change IP addresses frequently. If you are hosting anything at home and don't want to remember what the IP is or keep track of when it changes, you can deploy a dynamic DNS service. The Dynamic DNS Service simply takes the IP address and creates an A record for it. 

Example: 
``` 
x.x.x.x -> subdomain.example.foo

IP change

y.y.y.y -> subdomain.example.foo
```

Even though the underlying IP address changed the record stays the same. 

### How does it work?
There are two main components that are deployed. A lambda function and the polling service. 

#### The Polling Service
The polling service is deployed on the home network. This fetches your public IP address and monitors it for changes. When your public IP address is changed the service will update an SSM parameter which will then be used by the lambda service. An API call is only made to SSM on start and IP change. This reduces the amount of calls made to AWS thus reducing cost. 

You may ask why not just have this directly update the record? You certainly could if you are comfortable having something deployed at home that has the ability to change records. The benefit of the designed approach is restricted access. The polling service only requires the ability to update SSM parameter store. Secondly the values in SSM are versioned. You are able to go back and see your previous IP addresses. I understand this is something that maynot be beneficial to everyone.

#### Lambda and AWS Infrastructure
The AWS infrastructure is deployed using AWS CDK. The primary component deployed is an AWS Lambda function. This lambda function runs based on a defined CloudWatch cron event. I'll probably update this in the future so that it is a little more smart. But for rev 1 this shall do. 

The lambda function pulls from SSM noting if the IP address is new or an existing record. If it is new it makes an api call to route53 to configure the A record to the defined subdomain. If it is not new it does nothing. 

## Pre-requisites
- Route53 Hosted Zone & Domain
- AWS CLI & Profile Configured
- Some AWS CDK Knowledge

## Installation

Deploy the AWS Infrastructure


```
$ nvm use
```

```
$ npm install
```

```
$ npx projen build
```

```
 $ npx cdk deploy route53-dynamicdns
```

## Deploy Polling Service

### Docker Compose or Podman

Set the environment variables in the compose file or the `.env` file. 
```
docker-compose up -d
```

### Helm Deployment
Modify the `charts/dynamicdns-pollingservice/values.yaml` with the appropriate changes you wish to make. 
Note that you will need to have a Kubernetes secret that stores the aws-credentials. The `values.yaml` contains an example of how to do this. 

```
helm install dynamicdns-pollingservice dyanmicdns-pollingservice/
```