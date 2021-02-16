import { Probot } from "probot";
import type { MetabotWebhookPayloadPullRequest } from 'metabot-utils';

export = (app: Probot) => {
  app.on("pull_request.opened", async (context: any) => {
    // const issueComment = context.issue({
    //   body: context.payload["originalBotComment"],
    // });
    // await context.octokit.issues.createComment(issueComment);
    
    const payload: MetabotWebhookPayloadPullRequest = context.payload;

    context.log(`Bot's Name: ${payload.botName}`);
    context.log(`Bot's Comment: ${payload.botComment}`);
    
    console.log();
  });
  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
