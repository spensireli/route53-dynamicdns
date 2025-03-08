# Route53 Dynamic DNS

https://aws.amazon.com/blogs/security/iam-roles-anywhere-with-an-external-certificate-authority/


openssl req -x509 -newkey rsa:4096 -sha256 -days 3650   -nodes -keyout dynamicdns.dev.conklin.io.key -out dynamicdns.dev.conklin.io.crt -subj "/CN=dynamicdns.dev.conklin.io""


