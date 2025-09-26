import { GoogleAuth } from 'google-auth-library';
import { CloudBuildClient } from '@google-cloud/cloudbuild';
import { Storage } from '@google-cloud/storage';
import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import { promises as fs } from 'fs';
import fsExtra from 'fs-extra';
import path, { posix } from 'path';
import axios from 'axios';

/** Helper to recursively get all file paths, skipping .git */
async function getFilePaths(dir: string): Promise<string[]> {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents
      .filter(d => d.name !== '.git')
      .map(dirent => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFilePaths(res) : res;
      })
  );
  return Array.prototype.concat(...files);
}

/** Commit local template to GitHub repo */
export async function commitNextJsTemplate(
  octokit: Octokit,
  owner: string,
  repo: string,
  templatePath: string
) {
  let parentSha: string | undefined;
  try {
    const { data: refData } = await octokit.git.getRef({ owner, repo, ref: 'heads/main' });
    parentSha = refData.object.sha;
  } catch {
    console.log('Main branch not found. This is a new repository.');
  }

  const filePaths = await getFilePaths(templatePath);
  const blobPromises = filePaths.map(async filePath => {
    const content = await fs.readFile(filePath, 'base64');
    const { data: blobData } = await octokit.git.createBlob({
      owner,
      repo,
      content,
      encoding: 'base64',
    });
    return {
      path: posix.join(...path.relative(templatePath, filePath).split(path.sep)),
      sha: blobData.sha,
      mode: '100644',
      type: 'blob',
    };
  });

  const treeItems = await Promise.all(blobPromises);
  const { data: treeData } = await octokit.git.createTree({
    owner,
    repo,
    tree: treeItems,
  });

  const { data: commitData } = await octokit.git.createCommit({
    owner,
    repo,
    message: 'Initial commit: Add Next.js template',
    tree: treeData.sha,
    parents: parentSha ? [parentSha] : [],
  });

  await octokit.git.updateRef({
    owner,
    repo,
    ref: 'heads/main',
    sha: commitData.sha,
    force: true,
  });

  console.log(`✅ Successfully committed template to ${owner}/${repo}`);
}

/** Wait helper */
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Main function to create & deploy website with Cloud Build repo registration */
export async function createAndDeployWebsite(
  projectId: string,
  githubOrg: string,
  websiteName: string,
  templateRepoUrl: string,
  githubToken: string
) {
  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  const baseName = websiteName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const serviceName = `${baseName}-${uniqueSuffix}`;
  const newRepoName = serviceName; // This is the unique name for the GitHub repo and service
  const tempDir = path.join('/tmp', `template-clone-${Date.now()}`);
  const logsBucket = `cloud-build-logs-${projectId}-${uniqueSuffix}`;
  const location = 'us-central1';
  const projectHash = process.env.GCLOUD_PROJECT_HASH;

  if (!projectHash) {
    throw new Error("GCLOUD_PROJECT_HASH environment variable is not set.");
  }

  try {
    const octokit = new Octokit({ auth: githubToken });
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      projectId,
    });
    const token = await auth.getAccessToken();

    const storage = new Storage({ auth, projectId });
    console.log(`📦 Creating Cloud Build logs bucket: ${logsBucket}`);
    await storage.createBucket(logsBucket, {
      location,
      uniformBucketLevelAccess: true,
    });
    await sleep(5000);

    const cloudBuildClient = new CloudBuildClient({ auth, projectId });

    console.log(`📦 Creating new GitHub repository: ${githubOrg}/${newRepoName}`);
    await octokit.repos.createForAuthenticatedUser({
      name: newRepoName,
      private: true,
      auto_init: true,
    });

    console.log(`⬇️ Cloning template from ${templateRepoUrl}`);
    await fs.mkdir(tempDir, { recursive: true });
    await simpleGit({ timeout: { block: 60000 } }).clone(templateRepoUrl, tempDir, ['--depth=1']);
    await fsExtra.remove(path.join(tempDir, '.git'));
    await commitNextJsTemplate(octokit, githubOrg, newRepoName, tempDir);
    await fs.rm(tempDir, { recursive: true, force: true });

    const repoId = `${githubOrg}_${newRepoName}`;
    const connectionParent = `projects/${projectId}/locations/${location}/connections/my-github-connection`;
    try {
      console.log(`🔗 Registering repo ${repoId} in Cloud Build connection...`);
      const url = `https://cloudbuild.googleapis.com/v2/${connectionParent}/repositories?repositoryId=${repoId}`;
      await axios.post(
        url,
        { remoteUri: `https://github.com/${githubOrg}/${newRepoName}.git` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`✅ Repo registered in Cloud Build: ${repoId}`);
      console.log('⏱️ Waiting 10 seconds for Cloud Build to recognize the new repository...');
      await sleep(10000);
    } catch (err: any) {
      console.log('⚠️ Repo registration might have failed or already exists:', err.response?.data || err.message);
    }

    console.log(`⚙️ Creating a GitHub push trigger for ${newRepoName}`);
    const trigger = {
      name: `deploy-${serviceName}`,
      description: `Deploys ${serviceName}`,
      filename: 'cloudbuild.yaml',
      repositoryEventConfig: {
        repository: `${connectionParent}/repositories/${repoId}`,
        push: { branch: 'main' },
      },
    };

    const maxCreateRetries = 5;
    for (let i = 0; i < maxCreateRetries; i++) {
      try {
        console.log(`⚙️ Attempt ${i + 1}: Creating Cloud Build trigger for ${newRepoName}`);
        await cloudBuildClient.createBuildTrigger({
          projectId,
          parent: `projects/${projectId}/locations/${location}`,
          trigger,
        });
        console.log('✅ Trigger created successfully!');
        break;
      } catch (error: any) {
        if (i < maxCreateRetries - 1) {
          console.log(`⚠️ Trigger creation failed. Retrying in ${3 + i * 2} seconds...`);
          await sleep(3000 + i * 2000);
        } else {
          throw error;
        }
      }
    }
    const serviceUrl = `https://${serviceName}-${projectHash}-${location}.a.run.app`;

    console.log(`🎉 Website ${newRepoName} created and deployment initiated. ${serviceUrl}`);
    
    // --- CORRECTED URL LOGIC ---
    // This function's job is to set up the repo and trigger. The trigger will then deploy
    // to Cloud Run. The final URL is not known at this exact moment.
    // We return the unique repo name, which is the most critical piece of data.
    // The URL is now a placeholder; a more advanced solution would use a webhook from
    // Cloud Build to update the database with the real URL after deployment.
    return { 
      success: true, 
      repo: `${githubOrg}/${newRepoName}`,
      url: serviceUrl 
    };
    
  } catch (error: any) {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    console.error('❌ Failed to create website:', error.details || error.message || error);
    return { success: false, error: error.details || error.message || 'Creation failed.' };
  }
}