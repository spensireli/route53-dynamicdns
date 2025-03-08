import { fetchIPAddress, startPolling } from '../src/pollingService/pollingService';
import axios from 'axios';

jest.mock('@aws-sdk/client-ssm', () => {
  const mockSend = jest.fn();
  return {
    SSMClient: jest.fn(() => ({ send: mockSend })),
    PutParameterCommand: jest.fn(),
    ParameterType: { STRING: 'String' },
    mockSend,
  };
});

jest.mock('axios');

describe('pollingService', () => {
  let mockSSMSend: jest.Mock;
  let mockAxiosGet: jest.Mock;

  beforeEach(() => {
    mockSSMSend = require('@aws-sdk/client-ssm').mockSend;
    mockAxiosGet = (axios.get as jest.Mock);
    mockSSMSend.mockClear();
    mockAxiosGet.mockClear();
  });


  it('Fetch IP Address Should Be Successful, Rerun multiple times and skip SSM command', async () => {
    const mockItems = {
      Parameter: {
        Name: 'test-param-name',
        Value: '123.456.789.999',
        Version: 1,
      },
    };

    mockSSMSend.mockResolvedValue(mockItems);
    mockAxiosGet.mockResolvedValue({ data: '123.456.789.999' });
    process.env.POLL_INTERVAL = '10';
    await fetchIPAddress();
    expect(mockAxiosGet).toHaveBeenCalled();
    // Invoking multiple times will result in the same IP address and should skip SSM Send
    await fetchIPAddress();
    await fetchIPAddress();
    expect(mockSSMSend).toHaveBeenCalledTimes(1);
  });

  it('Test Error Fecthing IP', async () => {
    mockSSMSend.mockResolvedValue({});
    mockAxiosGet.mockResolvedValue({});
    await expect(async () => {
        await fetchIPAddress();
      }).not.toThrow();    
  });

  it('Test Error updating SSM Parameter Store', async () => {
    const mockError = new Error('SSM Parameter retrieval failed');
    mockSSMSend.mockRejectedValue(mockError);
    mockAxiosGet.mockResolvedValue({ data: '123.456.789.123' });
    process.env.POLL_INTERVAL = '10';
    await expect(async () => {
        await fetchIPAddress();
      }).not.toThrow();
  });

  it('Test Polling', () => {
    let mockfetchIPAddress: jest.Mock;
    mockfetchIPAddress = (fetchIPAddress as jest.Mock);
    mockfetchIPAddress;
    jest.useFakeTimers();
    startPolling();
    jest.advanceTimersByTime(10 * 1000); // Move timers forward by 10s
  });
});