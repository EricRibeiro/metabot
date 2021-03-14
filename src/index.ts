import { Probot } from "probot";
import { getGitHubComment, sleep } from './helpers/utils';
import { fetchBotsComments, saveBotComment } from './bot';

export = (app: Probot) => {
  const connString = process.env.MONGO_CONN_STRING!;

  app.on("pull_request.opened", async (context) => {
    // waiting for all bots' comments to be posted, saved on database and deleted.
    await sleep(900000);

    const { documents, error } = await fetchBotsComments(
      context.payload.repository.owner.login,
      context.payload.repository.name,
      context.payload.number,
      connString
    );

    if (error) { throw error; }

    const prOwner = context.payload.pull_request.user.login;
    const body = getGitHubComment(prOwner, documents);
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

