import { GoogleAuth } from 'google-auth-library';
import { CloudBuildClient } from '@google-cloud/cloudbuild';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to promisify child_process.exec
function execShellCommand(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return reject(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

export async function startEditingSession(fullRepoName: string) {
  const projectId = process.env.GCLOUD_PROJECT_ID!;
  const location = 'us-central1';
  const sessionId = uuidv4().substring(0, 8);
  const [githubOrg, repoName] = fullRepoName.split('/');
  
  const sessionServiceName = `${repoName}-session-${sessionId}`;
  const imageName = `gcr.io/${projectId}/${sessionServiceName}`;
  const clusterName = process.env.GKE_CLUSTER_NAME!;
  const zone = process.env.GKE_ZONE!;

  if (!githubOrg || !repoName) {
    throw new Error("Invalid 'fullRepoName' format. Expected 'owner/repo-name'.");
  }
  
  if (!clusterName || !zone) {
      throw new Error("Missing GKE_CLUSTER_NAME or GKE_ZONE environment variables.");
  }
  
  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      projectId,
    });
    const cloudBuildClient = new CloudBuildClient({ auth, projectId });

    console.log(`Starting Cloud Build for dev image: ${imageName}`);

    const [buildOperation] = await cloudBuildClient.createBuild({
      projectId,
      build: {
        steps: [{
          name: 'gcr.io/cloud-builders/docker',
          args: ['build', '-t', imageName, '-f', 'Dockerfile', '.'],
        }],
        images: [imageName],
        source: {
          gitSource: {
            url: `https://github.com/${fullRepoName}.git`,
            revision: 'refs/heads/main',
          },
        },
        options: {
          logging: 'CLOUD_LOGGING_ONLY',
        },
      },
    });
    
    await buildOperation.promise();
    console.log('Cloud Build for dev image completed successfully.');

    // Read the manifest template
    let manifestTemplate = await fs.readFile(path.join(process.cwd(), 'k8s-deployment.yaml'), 'utf8');
    
    // Replace dynamic placeholders in the manifest
    const manifest = manifestTemplate
      .replace(/<YOUR_PROJECT_ID>/g, projectId)
      .replace(/<YOUR_IMAGE_NAME>/g, sessionServiceName)
      .replace(/<YOUR_SESSION_SERVICE_NAME>/g, sessionServiceName)
      .replace(/<YOUR_CLAIM_NAME>/g, 'live-editor-claim');

    // Create a temporary file and write the manifest to it
    const tempManifestPath = path.join('/tmp', `${sessionServiceName}-manifest.yaml`);
    await fs.writeFile(tempManifestPath, manifest, 'utf8');

    // Apply the manifest to the GKE cluster using the temporary file
    console.log(`Deploying to GKE cluster: ${clusterName} in zone ${zone}`);
    const applyCommand = `kubectl apply -f ${tempManifestPath}`;
    await execShellCommand(applyCommand);
    
    // Clean up the temporary file
    await fs.unlink(tempManifestPath);
    
    console.log('Kubernetes deployment initiated successfully.');

    // The URL is now based on the Ingress host name.
    const serviceUrl = `http://${sessionServiceName}.hellohostagent.com`;

    return {
      success: true,
      url: serviceUrl,
      sessionId: sessionId,
    };
  } catch (error: any) {
    console.error('Failed to start editing session:', error.details || error.message || error);
    return {
      success: false,
      error: 'Failed to create live editing session. Check server logs.',
    };
  }
}