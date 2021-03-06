import { Probot } from "probot";
import { sleep } from './helpers/utils';
import { fetchBotsComments, saveBotComment } from './bot';

export = (app: Probot) => {
  const connString = process.env.MONGO_CONN_STRING!;

  app.on("pull_request.opened", async (context) => {
    // waiting for all bots' comments to be posted, saved on database and deleted.
    await sleep(4000);

    const { documents, error } = await fetchBotsComments(context.payload.repository.owner.login, context.payload.repository.name, context.payload.number, connString);
    if (error) { throw error; }

    const labelFrequency: Map<string, number> = documents.reduce((acc, curr) => acc.set(curr.label, (acc.get(curr.label) || 0) + 1), new Map());
    const commentsPerLabelCount = [...labelFrequency.values()].reduce((acc, curr) => acc + curr);

    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;
    const issueNumber = context.payload.number;
    const installationId = context.payload.installation?.id;
    const prOwner = context.payload.pull_request.user.login;

    let body = `Hi @${prOwner}.\n\nYou have ${commentsPerLabelCount} ${commentsPerLabelCount === 1 ? "comment" : "comments"}, made by bots installed on this repo, regarding this pull request. If you want me to show them, please use the links below:\n`;

    for (let label of labelFrequency.keys()) {
      const frequency = labelFrequency.get(label);
      body += `- There ${frequency === 1 ? "is" : "are"} ${frequency} ${frequency === 1 ? "comment" : "comments"} with the label **${label}**. `
      body += `[Show me](https://metabot-express.herokuapp.com/comments/?owner=${owner}&repo=${repo}&issueNumber=${issueNumber}&label=${label}&installationId=${installationId}).\n`
    }

    body += `- [Show me all](https://metabot-express.herokuapp.com/comments/?owner=${owner}&repo=${repo}&issueNumber=${issueNumber}&label=all&installationId=${installationId}).\n\n`
    body += `Let me know what you think of this comment by reacting with 👍 or 👎.`

    const issueComment = context.issue({ body });
    await context.octokit.issues.createComment(issueComment);
  });

  app.on("issue_comment.created", async (context) => {
    if (context.isBot && context.payload.comment.user.login !== "metabot-puc[bot]") {
      const { error } = await saveBotComment(
        context.payload.repository.owner.login, 
        context.payload.repository.name, 
        context.payload.issue.number, 
        context.payload.comment, 
        context.payload.comment.user.login, 
        connString
      );
      
      if (error) { throw error; }

      await context.octokit.issues.deleteComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id
      });

    } else {
      //user comment
    }
  });
};

