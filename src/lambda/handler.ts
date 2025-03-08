import { Route53Client, ChangeResourceRecordSetsCommand, ListResourceRecordSetsCommand } from '@aws-sdk/client-route-53';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { Handler } from 'aws-lambda';


export const handler: Handler = async () => {
  const ssmClient = new SSMClient({});
  const route53CLient = new Route53Client({});
  const hostedZoneId = process.env.HOSTED_ZONE_ID;
  const SSM_PARAM = process.env.SSM_PARAM;
  const subDomainName = process.env.SUB_DOMAIN;
  try {
    const command = new GetParameterCommand({
      Name: SSM_PARAM,
      WithDecryption: false,
    });

    const result = await ssmClient.send(command);
    console.log(result.Parameter);

    if (!result.Parameter?.Value || result.Parameter.Value === '127.0.0.1') {
      throw new Error('No valid items found in Parameter Store.');
    }

    const lookupRecord = new ListResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      StartRecordName: subDomainName,
      StartRecordType: 'A',
      MaxItems: 1,
    });

    let foundRecord: string | undefined;
    try {
      const lookUpRecordResponse = await route53CLient.send(lookupRecord);
      foundRecord = lookUpRecordResponse.ResourceRecordSets![0].ResourceRecords![0].Value
    } catch {
        console.log('No valid record found proceeding to create.')
    }
    
    if ( foundRecord != result.Parameter.Value) {
      const changeRecordSet = new ChangeResourceRecordSetsCommand({
        ChangeBatch: {
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: subDomainName,
                ResourceRecords: [
                  {
                    Value: `${result.Parameter.Value}`,
                  },
                ],
                TTL: 60,
                Type: 'A',
              },
            },
          ],
          Comment: `Dynamic DNS Entry for ${subDomainName}`,
        },
        HostedZoneId: hostedZoneId,
      });
      await route53CLient.send(changeRecordSet);
      console.log(`Created Record: ${subDomainName} --> ${result.Parameter.Value}`);
    } else {
      console.log(`No Action Taken, Record is up to date already: ${subDomainName} --> ${foundRecord}`)
    }
    return {
      statusCode: 200,
      body: 'Success',
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not fetch item' }),
    };
  }
};
