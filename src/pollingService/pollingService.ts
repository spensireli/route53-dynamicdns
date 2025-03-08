/* eslint-disable import/no-extraneous-dependencies */
import axios from 'axios';
import dotenv from 'dotenv';
import { SSMClient, PutParameterCommand, ParameterType } from "@aws-sdk/client-ssm";

dotenv.config();

const DEFAULT_INTERVAL_SECONDS = 30;

const intervalSeconds = process.env.POLL_INTERVAL
  ? parseInt(process.env.POLL_INTERVAL, 10)
  : process.argv[2]
  ? parseInt(process.argv[2], 10)
  : DEFAULT_INTERVAL_SECONDS;

if (isNaN(intervalSeconds) || intervalSeconds <= 0) {
  console.log('Invalid polling interval. Using default 30 seconds.');
}

const intervalMs = intervalSeconds * 1000;
let storedIpAddress: string | null = null;

const client = new SSMClient({});

export async function updateSSMParameter(ipAddress: string) {
  try {
    const input = {
      Name: "DynamicDNSIpAddress",
      Description: "Stored public IP address",
      Value: ipAddress,
      Type: ParameterType.STRING,
      Overwrite: true,
    };
    const command = new PutParameterCommand(input);
    await client.send(command);
    console.log(`Updated SSM Parameter Store with IP: ${ipAddress}`);
  } catch (error) {
    console.error('Error updating SSM Parameter Store:', error);
  }
}

export async function fetchIPAddress() {
  try {
    const response = await axios.get('https://checkip.amazonaws.com');
    const ipAddress = response.data.trim();

    if (storedIpAddress !== ipAddress) {
      console.log(`Public IP changed: ${ipAddress}`);
      storedIpAddress = ipAddress;
      await updateSSMParameter(ipAddress);
    } else {
      console.log('Public IP remains the same:', ipAddress);
    }
  } catch (error) {
    console.error('Error fetching IP:', error);
  }
}

export function startPolling() {
  console.log(`Polling IP address every ${intervalSeconds} seconds...`);
  return setInterval(fetchIPAddress, intervalMs);
}

if (process.env.NODE_ENV !== 'test') {
  startPolling();
}
