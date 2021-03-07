import { Probot } from "probot";
import { CosmosClient } from './helpers/cosmos'

import type { MetabotWebhookPayloadPullRequest } from 'metabot-utils'

export = (app: Probot) => {
  app.on("pull_request.opened", async (context: any) => {
    const payload: MetabotWebhookPayloadPullRequest = context.payload;

    context.log(`Bot's Name: ${payload.botName}`);
    context.log(`Bot's Comment: ${payload.botComment}`);

    const connString = process.env.MONGO_CONN_STRING!;
    const client = new CosmosClient(connString);

    const { result, error } = await client.insertOne("metabot", "events", payload)

    if(!error) {
      context.log(result)
    } else {
      throw error;
    }

    //@todo remover isso aqui eventualmente
    console.log("Batata")

  });
};
