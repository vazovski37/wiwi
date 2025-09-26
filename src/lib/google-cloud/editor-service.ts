import { GoogleAuth } from 'google-auth-library';
import { CloudBuildClient } from '@google-cloud/cloudbuild';
import { v2 } from '@google-cloud/run';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const { ServicesClient } = v2;

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function startEditingSession(fullRepoName: string) { // Expects "owner/repo-name"
  const projectId = process.env.GCLOUD_PROJECT_ID!;
  const location = 'us-central1';
  const sessionId = uuidv4().substring(0, 8);
  
  const [githubOrg, repoName] = fullRepoName.split('/');
  const sessionServiceName = `${repoName}-session-${sessionId}`;
  const imageName = `gcr.io/${projectId}/${sessionServiceName}`;

  if (!githubOrg || !repoName) {
    throw new Error("Invalid 'fullRepoName' format. Expected 'owner/repo-name'.");
  }

  try {
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      projectId,
    });
    const cloudBuildClient = new CloudBuildClient({ auth, projectId });
    const runClient = new ServicesClient({ auth, projectId });
    const token = await auth.getAccessToken();

    const repoId = `${githubOrg}_${repoName}`;
    // IMPORTANT: This must match the name of your connection in the Google Cloud Console.
    const connectionName = "my-github-connection"; 
    const connectionParent = `projects/${projectId}/locations/${location}/connections/${connectionName}`;
    const repositoryResourceName = `${connectionParent}/repositories/${repoId}`;
    
    try {
      console.log(`🔗 Ensuring repo ${repoId} is registered with Cloud Build Connection...`);
      const registrationUrl = `https://cloudbuild.googleapis.com/v2/${connectionParent}/repositories?repositoryId=${repoId}`;
      await axios.post(
        registrationUrl,
        { remoteUri: `https://github.com/${fullRepoName}.git` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`✅ Repo ${repoId} is registered.`);
      await sleep(5000);
    } catch (err: any) {
      console.log('⚠️ Repo registration might have failed or already exists.');
    }

    console.log(`Starting Cloud Build for image: ${imageName}`);

    // --- THIS IS THE DEFINITIVE FIX ---
    // The 'source' object needs to use 'connectedRepository' which
    // uses the authorization from the GitHub Connection and does not require a password.
    const [buildOperation] = await cloudBuildClient.createBuild({
      projectId,
      build: {
        steps: [{
          name: 'gcr.io/cloud-builders/docker',
          args: ['build', '-t', imageName, '.'],
        }],
        images: [imageName],
        source: {
          connectedRepository: {
            repository: repositoryResourceName,
            revision: 'main',
          },
        },
        options: {
          logging: 'CLOUD_LOGGING_ONLY',
        },
      },
    });
    // --- END FIX ---
    
    await buildOperation.promise();
    console.log('Cloud Build completed successfully.');

    console.log(`Deploying service: ${sessionServiceName} to Cloud Run`);
    const [runOperation] = await runClient.createService({
      parent: `projects/${projectId}/locations/${location}`,
      serviceId: sessionServiceName,
      service: {
        template: {
          containers: [{
            image: imageName,
            ports: [{ containerPort: 3000 }],
          }],
        },
      },
    });

    const [service] = await runOperation.promise();
    console.log('Cloud Run deployment completed.');
    
    if (!service.uri) {
        throw new Error("Cloud Run service created without a URL.");
    }
    
    return {
      success: true,
      url: service.uri,
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