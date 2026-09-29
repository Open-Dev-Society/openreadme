const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'https://openreadme.vercel.app/api/openreadme';
// Every image costs the API a headless browser launch, so this is the real throttle.
// Turn it down if the API starts timing out or returning 429.
const CONCURRENCY = Number(process.env.CONCURRENCY) || 6;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'Open-Dev-Society';
const REPO_NAME = 'openreadme';

// Read user profiles from JSON file
function readUserProfiles() {
  try {
    const profilesPath = path.join(process.cwd(), 'data', 'user-profiles.json');
    const data = fs.readFileSync(profilesPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('⚠️  Error reading user profiles:', error.message);
    return {};
  }
}

async function generateProfileImage(username, userId) {
  try {
    console.log(`🎨 Generating image for ${username} (${userId})...`);

    // Read stored user profile data first
    const userProfiles = readUserProfiles();
    const storedProfile = userProfiles[username] || {};

    console.log(`📦 Stored profile data:`, storedProfile);

    // Get user data from GitHub API as fallback
    const userResponse = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'OpenReadme-Workflow'
      }
    });

    if (!userResponse.ok) {
      console.warn(`⚠️  GitHub API warning for ${username}: ${userResponse.statusText}`);
    }

    const userData = userResponse.ok ? await userResponse.json() : { login: username };

    // Prioritize stored profile data over GitHub API data
    const name = storedProfile.name || userData.name || username;
    const profilePic = storedProfile.profilePic || userData.avatar_url || '';
    const twitterUsername = storedProfile.twitterUsername || userData.twitter_username || '';
    const linkedinUsername = storedProfile.linkedinUsername || '';
    const portfolioUrl = storedProfile.portfolioUrl || userData.blog || userData.html_url || '';

    console.log(`✅ Using data - Name: ${name}, Twitter: ${twitterUsername}, LinkedIn: ${linkedinUsername}`);

    // Build API URL with parameters
    const params = new URLSearchParams({
      username: username,  // Required for API validation
      n: name,
      i: profilePic,
      g: username,
      x: twitterUsername,
      l: linkedinUsername,
      p: portfolioUrl,
      t: 'classic'
    });

    const apiUrl = `${API_URL}?${params.toString()}`;
    console.log(`📡 Calling API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'OpenReadme-Workflow'
      }
    });

    console.log(`📊 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API error response: ${errorText}`);
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    console.log(`✅ Successfully generated image for ${username}`);
    console.log(`🔗 Image URL: ${result.url}`);
    console.log(`📝 Method: ${result.method}`);

    return result.url;

  } catch (error) {
    console.error(`❌ Error generating image for ${username}:`, error.message);
    console.error(`🔍 Stack trace:`, error.stack);
    return null;
  }
}

// Process all users
(async () => {
  try {
    const mappingsString = process.env.MAPPINGS || '';
    const mappings = mappingsString.split(' ').filter(m => m.trim());
    console.log(`📋 Found ${mappings.length} users to process`);
    console.log(`🔧 Using API URL: ${API_URL}`);

    if (mappings.length === 0) {
      console.log('⚠️  No user mappings found to process');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Serial, this took 16s per profile: 21 minutes for 81 users, and longer with
    // every user added. The queue is shared, so a slow profile holds up one worker
    // instead of all of them.
    const queue = mappings.slice();
    console.log(`⚡ Processing ${CONCURRENCY} at a time`);

    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const mapping = queue.shift();
        const [username, userId] = mapping.split('=');
        if (!username || !userId) {
          console.warn(`⚠️  Invalid mapping format: ${mapping}`);
          continue;
        }

        console.log(`🔄 Processing ${username} (${userId})`);

        try {
          const imageUrl = await generateProfileImage(username, userId);
          if (imageUrl) {
            successCount++;
            console.log(`✅ Success for ${username}: ${imageUrl}`);
          } else {
            errorCount++;
            console.log(`❌ Failed for ${username}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`💥 Error processing ${username}:`, error.message);
        }
      }
    }));

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 WORKFLOW SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📋 Total: ${successCount + errorCount}`);
    console.log(`${'='.repeat(60)}`);

  } catch (error) {
    console.error('💥 Workflow failed:', error.message);
    process.exit(1);
  }
})();
