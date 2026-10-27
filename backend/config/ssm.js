import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';

// Initialize SSM Client using default credential provider chain (IAM Role on EC2 / env in local)
const ssmClient = new SSMClient({ region });

/**
 * Fetch a single parameter from AWS Systems Manager (SSM) Parameter Store
 * @param {string} paramPath - Path/name of the parameter in SSM (e.g. /app/db_host)
 * @param {boolean} withDecryption - Whether to decrypt SecureString parameters
 * @returns {Promise<string|null>} The parameter value or null if not found
 */
async function getSSMParameter(paramPath, withDecryption = true) {
  if (!paramPath) return null;

  try {
    const command = new GetParameterCommand({
      Name: paramPath,
      WithDecryption: withDecryption,
    });
    const response = await ssmClient.send(command);
    return response.Parameter?.Value || null;
  } catch (error) {
    console.warn(`[SSM] Warning: Could not fetch parameter "${paramPath}" from AWS SSM (${error.name}: ${error.message}).`);
    return null;
  }
}

/**
 * Dynamically resolves database credentials at startup.
 * Prioritizes AWS Systems Manager Parameter Store.
 * Falls back to local environment variables for local testing when SSM is unreachable.
 * 
 * @returns {Promise<{host: string, user: string, password: string, database: string, port: number}>}
 */
export async function loadDatabaseConfig() {
  const hostPath = process.env.SSM_DB_HOST_PATH;
  const userPath = process.env.SSM_DB_USER_PATH;
  const passwordPath = process.env.SSM_DB_PASSWORD_PATH;

  console.log(`[Config] Fetching database credentials (AWS Region: ${region})...`);

  // Concurrent fetch from SSM for optimal startup speed
  const [ssmHost, ssmUser, ssmPassword] = await Promise.all([
    getSSMParameter(hostPath, false),
    getSSMParameter(userPath, false),
    getSSMParameter(passwordPath, true), // SecureString
  ]);

  const dbConfig = {
    host: ssmHost || process.env.DB_HOST || '127.0.0.1',
    user: ssmUser || process.env.DB_USER || 'root',
    password: ssmPassword || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'assignment_portal',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  };

  const sources = {
    host: ssmHost ? `AWS SSM (${hostPath})` : 'Environment fallback',
    user: ssmUser ? `AWS SSM (${userPath})` : 'Environment fallback',
    password: ssmPassword ? `AWS SSM (${passwordPath})` : 'Environment fallback',
  };

  console.log('[Config] Database credentials resolved successfully:');
  console.log(` - Host: ${dbConfig.host} [via ${sources.host}]`);
  console.log(` - User: ${dbConfig.user} [via ${sources.user}]`);
  console.log(` - Password: [REDACTED] [via ${sources.password}]`);
  console.log(` - Database: ${dbConfig.database}:${dbConfig.port}`);

  return dbConfig;
}
