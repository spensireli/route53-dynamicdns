# Route53 Dynamic DNS



## Pre-requisites
- Route53 Hosted Zone & Domain
- AWS CLI & Profile Configured

## Quickstart

Deploy the AWS Infrastructure

```
nvm use
```

```
npm install
```

```
npx projen build
```

```
npx cdk deploy route53-dynamicdns
```



https://aws.amazon.com/blogs/security/iam-roles-anywhere-with-an-external-certificate-authority/


openssl req -x509 -newkey rsa:4096 -sha256 -days 3650   -nodes -keyout dynamicdns.dev.conklin.io.key -out dynamicdns.dev.conklin.io.crt -subj "/CN=dynamicdns.dev.conklin.io""



podman run -e AWS_ACCESS_KEY_ID=<accesskey> -e AWS_SECRET_ACCESS_KEY=<secret> -e AWS_REGION=us-east-1 -e POLL_INTERVAL=15 -it localhost/dynamicdns:latest sh