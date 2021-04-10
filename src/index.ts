import { Probot } from "probot";
import { sleep } from './helpers/utils';
import { buildGitHubComment, fetchBotsComments, saveBotComment, labelResolver } from './bot';
import { DateTime } from 'luxon'

import type { BotsConfig } from "./helpers/types"

const SLEEP_TIME_MILLISECONDS = 10000;

export = (app: Probot) => {
  const connString = process.env.MONGO_CONN_STRING!;

  app.on("pull_request.opened", async (context) => {
    // waiting for all bots' comments to be posted, saved on database and deleted.
    await sleep(SLEEP_TIME_MILLISECONDS);
    const config = <BotsConfig>(await context.config("config.yml"));

    const { documents, error } = await fetchBotsComments(
      context.payload.repository.owner.login,
      context.payload.repository.name,
      context.payload.number,
      connString
    );

    if (error) throw error;

    if (documents.length > 0) {
      const prOwner = context.payload.pull_request.user.login;
      const body = buildGitHubComment(prOwner, documents, config.metabotBotsToWaitForComment);
      const issueComment = context.issue({ body });

      await context.octokit.issues.createComment(issueComment);
    }
  });

  app.on("issue_comment.created", async (context) => {
    if (context.isBot && context.payload.comment.user.login !== "the-funnel-bot[bot]") {
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

      const metabotComment = comments.data.find(comment => comment.user?.login === "the-funnel-bot[bot]")

      const issueCreationTimeWithOffset = DateTime.fromISO(context.payload.issue.created_at)
        .plus({ milliseconds: SLEEP_TIME_MILLISECONDS });
      const currentTime = DateTime.now();

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

      } else if (currentTime > issueCreationTimeWithOffset) {
        const { documents, error } = await fetchBotsComments(
          context.payload.repository.owner.login,
          context.payload.repository.name,
          context.payload.issue.number,
          connString
        );

        if (error) throw error;

        if (documents.length > 0) {
          const prOwner = context.payload.repository.owner.login;
          const body = buildGitHubComment(prOwner, documents, config.metabotBotsToWaitForComment);
          const issueComment = context.issue({ body });

          await context.octokit.issues.createComment(issueComment);
        }
      }
    } else {
      //user comment
    }
  });
};

