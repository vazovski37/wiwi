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

/**
 * Modify the Next.js main page (pages/index.js or app/page.js/page.tsx)
 * to display the project name and a welcome message.
 */
async function modifyNextJsPage(
  templatePath: string, 
  projectName: string,
  repoName: string, // Added repoName to allow correct GitHub link
  githubOrg: string // Added githubOrg to allow correct GitHub link
) {
  // Check for common Next.js page paths, prioritizing modern App Router (src/app/page.tsx)
  const appPageTsx = path.join(templatePath, 'src', 'app', 'page.tsx');
  const appPageJs = path.join(templatePath, 'app', 'page.js'); // Next.js 13+ default structure check
  const pagesIndex = path.join(templatePath, 'pages', 'index.js');
  
  let fileToModify = '';
  
  // Use `pathExists` from fs-extra as promises/fs doesn't have it directly.
  if (await fsExtra.pathExists(appPageTsx)) {
     fileToModify = appPageTsx;
  } else if (await fsExtra.pathExists(appPageJs)) {
     fileToModify = appPageJs;
  } else if (await fsExtra.pathExists(pagesIndex)) {
     fileToModify = pagesIndex;
  } else {
     console.warn('Could not find src/app/page.tsx, app/page.js, or pages/index.js to modify. Skipping page customization.');
     return;
  }

  // Next.js (App Router) page content using TypeScript (TSX) and Tailwind CSS classes
  const newContent = `// src/app/page.tsx
/**
 * This page was customized automatically during repository creation
 * to display the project name.
 */
import Image from "next/image";

export default function Home() {
  const projectTitle = "${projectName}";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50">
      <main className="flex flex-col items-center justify-center gap-8 p-10 rounded-xl shadow-2xl bg-white dark:bg-gray-800 transition-shadow">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Welcome to <span className="text-blue-600 dark:text-blue-400">{projectTitle}</span>
        </h1>
        <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400">
          Your Next.js project is successfully provisioned and ready for deployment! good luck little boy!! don even think twice. no doubt u gonna make it!
        </p>
        <div className="flex gap-4">
          <a
            className="rounded-full border border-transparent transition-colors flex items-center justify-center bg-blue-600 text-white gap-2 px-6 py-3 font-semibold hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            href="https://github.com/${githubOrg}/${repoName}"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* Using a placeholder SVG icon for GitHub */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577 0-.285-.011-1.045-.017-2.049-3.336.724-4.042-1.61-4.042-1.61-.542-1.368-1.325-1.734-1.325-1.734-1.085-.741.083-.725.083-.725 1.205.084 1.838 1.236 1.838 1.236 1.069 1.835 2.809 1.305 3.493.998.108-.77.418-1.305.762-1.605-2.665-.304-5.467-1.334-5.467-5.931 0-1.306.465-2.372 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.849 1.233 1.915 1.233 3.221 0 4.609-2.807 5.624-5.476 5.921.43.372.823 1.102.823 2.222 0 1.604-.015 2.895-.015 3.28 0 .318.192.694.801.576 4.765-1.589 8.2-6.084 8.2-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            View on GitHub
          </a>
        </div>
      </main>
    </div>
  );
}
`;

  await fs.writeFile(fileToModify, newContent, 'utf8');
  console.log(`✅ Next.js main page successfully updated at: ${path.relative(templatePath, fileToModify)}`);
}

/** Commit local template to GitHub repo */
export async function commitNextJsTemplate(
  octokit: Octokit,
  owner: string,
  repo: string,
  templatePath: string,
  commitMessage: string // Added custom commit message
) {
  let parentSha: string | undefined;
  try {
    // Attempt to get the latest SHA of the main branch
    const { data: refData } = await octokit.git.getRef({ owner, repo, ref: 'heads/main' });
    parentSha = refData.object.sha;
  } catch {
    // This is expected for a brand new repository
    console.log('Main branch not found. This is a new repository or empty.');
  }

  // 1. Get all file paths in the template directory
  const filePaths = await getFilePaths(templatePath);
  
  // 2. Create blobs for all files
  const blobPromises = filePaths.map(async filePath => {
    const content = await fs.readFile(filePath, 'base64');
    const { data: blobData } = await octokit.git.createBlob({
      owner,
      repo,
      content,
      encoding: 'base64',
    });
    return {
      // Calculate the relative path within the repository using POSIX format
      path: posix.join(...path.relative(templatePath, filePath).split(path.sep)),
      sha: blobData.sha,
      mode: '100644', // File mode for normal file
      type: 'blob',
    };
  });

  const treeItems = await Promise.all(blobPromises);
  
  // 3. Create a new tree containing all file blobs
  const { data: treeData } = await octokit.git.createTree({
    owner,
    repo,
    tree: treeItems,
    // If a parentSha exists (meaning the repo is not empty), base the new tree on it
    base_tree: parentSha // This ensures existing files not in the template are kept (though this is for initial commit of a freshly created repo)
  });

  // 4. Create the new commit
  const parents = parentSha ? [parentSha] : [];
  const { data: commitData } = await octokit.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: treeData.sha,
    parents: parents,
  });

  // 5. Update the main branch reference to point to the new commit
  await octokit.git.updateRef({
    owner,
    repo,
    ref: 'heads/main',
    sha: commitData.sha,
    force: true, // Use force for initial push to uninitialized repo
  });

  console.log(`✅ Successfully committed changes to ${owner}/${repo}`);
}

/** Wait helper */
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ----------------------------------------------------------------------
// NEW: Function to generate the modified cloudbuild.yaml content
// ----------------------------------------------------------------------

/** Generate the modified cloudbuild.yaml content to ensure public accessibility */
function generateCloudBuildYaml(repoName: string, region: string): string {
  // Use a string literal for the YAML content
  return `steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/$REPO_NAME:$SHORT_SHA', '.']
- name: 'gcr.io/cloud-builders/docker'
  args: ['push', 'gcr.io/$PROJECT_ID/$REPO_NAME:$SHORT_SHA']
- name: 'gcr.io/cloud-builders/gcloud'
  id: Deploy
  args:
    - 'run'
    - 'deploy'
    - '${repoName}' # Use $REPO_NAME or explicit repoName
    - '--image'
    - 'gcr.io/$PROJECT_ID/$REPO_NAME:$SHORT_SHA'
    - '--platform'
    - 'managed'
    - '--region'
    - '${region}'
    - '--allow-unauthenticated' # Try to make it public on deploy
- name: 'gcr.io/cloud-builders/gcloud'
  id: Set-Public-Policy # Add explicit step to ensure public access
  args:
    - 'run'
    - 'services'
    - 'add-iam-policy-binding'
    - '${repoName}' # Use $REPO_NAME or explicit repoName
    - '--member=allUsers'
    - '--role=roles/run.invoker'
    - '--platform'
    - 'managed'
    - '--region'
    - '${region}'
  waitFor:
    - Deploy # Wait for the deployment step to finish
`;
}
// ----------------------------------------------------------------------

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
  const location = 'us-central1'; // Use a consistent region variable
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

    const cloudBuildClient = new CloudBuildClient({ auth, projectId });
    
    // 1. Create S3 Bucket
    const storage = new Storage({ auth, projectId });
    console.log(`📦 Creating Cloud Build logs bucket: ${logsBucket}`);
    await storage.createBucket(logsBucket, {
      location,
      uniformBucketLevelAccess: true,
    });
    await sleep(5000);

    // 2. Create GitHub repository (must be empty initially for the commit flow)
    console.log(`📦 Creating new GitHub repository: ${githubOrg}/${newRepoName}`);
    await octokit.repos.createForAuthenticatedUser({
      name: newRepoName,
      private: false,
      auto_init: true, // Creates a README which will be overwritten
    });
    // NOTE: A new repo with auto_init=true has a commit. The commitNextJsTemplate handles this by looking for `heads/main`'s SHA.

    // 3. Register the repository connection
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
    
    // 4. Create the GitHub push trigger
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

    // =========================================================
    // 🔥 CLONE, CUSTOMIZE, WRITE CLOUDBUILD.YAML, and COMMIT
    // =========================================================
    
    // Clone template locally
    console.log(`⬇️ Cloning template from ${templateRepoUrl}`);
    await fs.mkdir(tempDir, { recursive: true });
    await simpleGit({ timeout: { block: 60000 } }).clone(templateRepoUrl, tempDir, ['--depth=1']);
    await fsExtra.remove(path.join(tempDir, '.git'));
    
    // Customization step 1: Customize the landing page
    await modifyNextJsPage(tempDir, websiteName, newRepoName, githubOrg);

    // Customization step 2: Write the new cloudbuild.yaml
    const cloudbuildYamlPath = path.join(tempDir, 'cloudbuild.yaml');
    const cloudbuildYamlContent = generateCloudBuildYaml(newRepoName, location);
    await fs.writeFile(cloudbuildYamlPath, cloudbuildYamlContent, 'utf8');
    console.log(`✅ Updated cloudbuild.yaml written to: ${cloudbuildYamlPath}`);


    // Commit the template to the now-configured repository
    const commitMessage = `Initial commit: Set up and customize Next.js project "${websiteName}". Added explicit public access setting to cloudbuild.yaml.`;
    await commitNextJsTemplate(octokit, githubOrg, newRepoName, tempDir, commitMessage);
    await fs.rm(tempDir, { recursive: true, force: true });
    // =========================================================

    const serviceUrl = `https://${newRepoName}-${projectHash}.${location}.run.app`;

    console.log(`🎉 Website ${newRepoName} created and deployment initiated. ${serviceUrl}`);
    
    return { 
      success: true, 
      repo: `${githubOrg}/${newRepoName}`,
      url: serviceUrl 
    };
    
  } catch (error: any) {
    // Clean up temporary directory if it exists and cleanup fails
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    console.error('❌ Failed to create website:', error.details || error.message || error);
    return { success: false, error: error.details || error.message || 'Creation failed.' };
  }
}
