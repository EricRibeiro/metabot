import { Probot } from "probot";
import { buildGitHubComment, sleep } from './helpers/utils';
import { fetchBotsComments, saveBotComment, labelResolver } from './bot';

import type { BotsConfig } from "./helpers/types"

export = (app: Probot) => {
  const connString = process.env.MONGO_CONN_STRING!;

  app.on("pull_request.opened", async (context) => {
    // waiting for all bots' comments to be posted, saved on database and deleted.
    await sleep(10000);
    const config = <BotsConfig>(await context.config("config.yml"));

    const { documents, error } = await fetchBotsComments(
      context.payload.repository.owner.login,
      context.payload.repository.name,
      context.payload.number,
      connString
    );

    if (error) throw error;
    
    if (documents) {
      const prOwner = context.payload.pull_request.user.login;
      const body = buildGitHubComment(prOwner, documents, config.metabotBotsToWaitForComment);
      const issueComment = context.issue({ body });
      
      await context.octokit.issues.createComment(issueComment);
    }
  });

  app.on("issue_comment.created", async (context) => {
    if (context.isBot && context.payload.comment.user.login !== "metabot-puc[bot]") {
      const config = <BotsConfig>(await context.config("config.yml"));
      const commentLabel = labelResolver(config.metabotLabels, context.payload.comment.user.login);

      const { error } = await saveBotComment(
        context.payload.repository.owner.login,
        context.payload.repository.name,
        context.payload.issue.number,
        context.payload.comment,
        commentLabel,
        connString
      );

      if (error) throw error;

      await context.octokit.issues.deleteComment({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        comment_id: context.payload.comment.id
      });

      const comments = await context.octokit.issues.listComments({
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        issue_number: context.payload.issue.number
      })

      const metabotComment = comments.data.find(comment => comment.user?.login === "metabot-puc[bot]")

      if (metabotComment) {
        const { documents, error } = await fetchBotsComments(
          context.payload.repository.owner.login,
          context.payload.repository.name,
          context.payload.issue.number,
          connString
        );

        if (error) throw error;
        const body = buildGitHubComment(context.payload.repository.owner.login, documents, config.metabotBotsToWaitForComment);

        await context.octokit.issues.updateComment({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          comment_id: metabotComment.id,
          body
        });
      }
    } else {
      //user comment
    }
  });
};

