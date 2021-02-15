import { Probot } from "probot";

import type { MetabotWebhookPayloadPullRequest } from 'metabot-utils'

export = (app: Probot) => {
  app.on("pull_request.opened", async (context: any) => {
    const payload: MetabotWebhookPayloadPullRequest = context.payload;

    context.log(`Bot's Name: ${payload.botName}`);
    context.log(`Bot's Comment: ${payload.botComment}`);
  });
};