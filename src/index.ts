import { Probot } from "probot";

export = (app: Probot) => {
  app.on("pull_request.opened", async (context: any) => {
    context.log(`Bot's Name: ${context.payload["originalBotName"]}`);
    context.log(`Bot's Comment: ${context.payload["originalBotComment"]}`);
  });
};
