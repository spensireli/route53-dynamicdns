/* eslint-disable @typescript-eslint/no-require-imports */
import { ScheduledEvent, Context, Callback } from 'aws-lambda';
import { handler } from '../src/lambda/handler';

jest.mock('@aws-sdk/client-ssm', () => {
  const mockSend = jest.fn();
  return {
    SSMClient: jest.fn(() => ({ send: mockSend })),
    GetParameterCommand: jest.fn(),
    mockSend,
  };
});

jest.mock('@aws-sdk/client-route-53', () => {
  const mockSend = jest.fn();
  return {
    Route53Client: jest.fn(() => ({ send: mockSend })),
    ChangeResourceRecordSetsCommand: jest.fn(),
    ListResourceRecordSetsCommand: jest.fn(),
    mockSend,
  };
});

describe('Lambda Handler', () => {
  let mockSSMSend: jest.Mock;
  let mockRoute53Send: jest.Mock;

  beforeEach(() => {
    mockSSMSend = require('@aws-sdk/client-ssm').mockSend;
    mockSSMSend.mockReset();
    mockRoute53Send = require('@aws-sdk/client-route-53').mockSend;
    mockRoute53Send.mockReset();
    process.env.HOSTED_ZONE_ID = 'test-zone-id';
    process.env.SUB_DOMAIN = 'test.example.com';
  });

  afterEach(() => {
    delete process.env.HOSTED_ZONE_ID;
    delete process.env.SUB_DOMAIN;
  });

  const cloudWatchEvent: ScheduledEvent = {
    'version': '0',
    'id': 'some-id',
    'detail-type': 'Scheduled Event',
    'source': 'aws.events',
    'account': '123456789012',
    'time': new Date().toISOString(),
    'region': 'us-east-1',
    'resources': ['arn:aws:events:us-east-1:123456789012:rule/my-schedule-rule'],
    'detail': {},
  };

  const mockContext: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: 'log-stream',
    getRemainingTimeInMillis: () => 3000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };

  const mockCallback: Callback = () => {};

  it('should return a 200 response with items when SSM returns data and update Route53', async () => {

    const mockItems = {
      Parameter: {
        Name: 'test-param-name',
        Value: '123.456.789.999',
        Version: Number('long'),
      },
    };

    const ListResourceRecordSetsResponseMock = {
      ResourceRecordSets: [ 
        { 
          Name: "test.example.com'", 
          Type: "A",
          SetIdentifier: "FAKEIDENTIFIER",
          TTL: 60,
          ResourceRecords: [
            {
              Value: "1.1.1.1",
            },
          ],
        },
      ],
      MaxItems: 1,
    }
 

    mockSSMSend.mockResolvedValue(mockItems);
    mockRoute53Send.mockResolvedValue(ListResourceRecordSetsResponseMock);
    const response = await handler(cloudWatchEvent, mockContext, mockCallback);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual('Success');
    expect(mockRoute53Send).toHaveBeenCalled();
  });


  it('should return a 200 response with items when SSM returns data and updates Route53 when no record is found in route53', async () => {

    const mockItems = {
      Parameter: {
        Name: 'test-param-name',
        Value: '123.456.789.999',
        Version: Number('long'),
      },
    };
 

    mockSSMSend.mockResolvedValue(mockItems);
    mockRoute53Send.mockResolvedValue({});
    const response = await handler(cloudWatchEvent, mockContext, mockCallback);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual('Success');
    expect(mockRoute53Send).toHaveBeenCalled();
  });

  it('should return a 200 response with items when SSM returns data and not update Route53', async () => {

    const mockItems = {
      Parameter: {
        Name: 'test-param-name',
        Value: '123.456.789.999',
        Version: Number('long'),
      },
    };

    const ListResourceRecordSetsResponseMock = {
      ResourceRecordSets: [ 
        { 
          Name: "test.example.com'", 
          Type: "A",
          SetIdentifier: "FAKEIDENTIFIER",
          TTL: 60,
          ResourceRecords: [
            {
              Value: "123.456.789.999",
            },
          ],
        },
      ],
      MaxItems: 1,
    }
 

    mockSSMSend.mockResolvedValue(mockItems);
    mockRoute53Send.mockResolvedValue(ListResourceRecordSetsResponseMock);
    // mockRoute53Send.mockResolvedValue({});
    const response = await handler(cloudWatchEvent, mockContext, mockCallback);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual('Success');
    expect(mockRoute53Send).toHaveBeenCalled();
  });

  it('should return a 500 response with a message when items are found with 127.0.0.1', async () => {
    const mockItems = {
      Parameter: {
        Name: 'test-param-name',
        Value: '127.0.0.1',
        Version: Number('long'),
      },
    };

    mockSSMSend.mockResolvedValue(mockItems);
    mockRoute53Send.mockResolvedValue({});
    const response = await handler(cloudWatchEvent, mockContext, mockCallback);
    expect(response.statusCode).toBe(500);
  });

  it('should return a 200 response with a message when no items are found and not update Route53', async () => {
    mockSSMSend.mockResolvedValue({});
    const response = await handler(cloudWatchEvent, mockContext, mockCallback);
    expect(response.statusCode).toBe(500);
    expect(mockRoute53Send).not.toHaveBeenCalled();
  });

  it('should return a 500 response when SSM throws an error', async () => {
    mockSSMSend.mockRejectedValue(new Error('SSM failure'));
    const response = await handler(cloudWatchEvent, mockContext, mockCallback);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({ error: 'Could not fetch item' });
  });

  it('should return a 500 response when Route53 update fails', async () => {
    const mockItems = {
      Parameter: {
        Name: 'test-param-name',
        Value: '123.456.789.999',
        Version: Number('long'),
      },
    };

    mockSSMSend.mockResolvedValue(mockItems);
    mockRoute53Send.mockRejectedValue(new Error('Route53 failure'));
    const response = await handler(cloudWatchEvent, mockContext, mockCallback);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({ error: 'Could not fetch item' });
  });
});
