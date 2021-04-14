import { Mongo } from 'metabot-utils'
import { strReplaceLast } from "./helpers/utils"

import type { EventPayloads } from "@octokit/webhooks/dist-types/generated/event-payloads"
import type { BotsPerLabel } from "./helpers/types"

export async function saveBotComment(
    owner: string, 
    repo: string, 
    issue_number: number, 
    comment: EventPayloads.WebhookPayloadIssueCommentComment,
    commentLabel: string,  
    connString: string)
    : Promise<{ result: { ok?: number, n?: number }, error: any }> {
 
    const document = {
        comment: comment,
        owner,
        repo,
        issue_number,
        label: commentLabel
    }

    return await new Mongo(connString).insertOne("metabot", "comments", document);
}

export async function fetchBotsComments(owner: string, repo: string, issue_number: number, connString: string): Promise<{ documents: any, error: any }> {
    return await new Mongo(connString).findAll("metabot", "comments", {
        owner,
        repo,
        issue_number
    });
}

export function labelResolver(botsPerLabel: BotsPerLabel[], userLogin: string): string {
    const defaultLabel = "unlabelled";

    if (botsPerLabel.length === 0) return defaultLabel;
    const botsPerLabelWithUserLogin = botsPerLabel.filter(label => Object.values(label)[0].some(login => userLogin.includes(login)));

    if (botsPerLabelWithUserLogin.length === 0) return defaultLabel;
    const label = Object.keys(botsPerLabelWithUserLogin[0])[0];

    return label;
}

export function buildGitHubComment(prOwner: string, documents: any, botsToWaitForComment: string[] = []): string {
    const commentsPerLabelCount = documents.length;
    const commentsPerLabelPerBot = {}
  
    documents.forEach((curr) => {
      commentsPerLabelPerBot[curr.label] = commentsPerLabelPerBot[curr.label]
        ? commentsPerLabelPerBot[curr.label]
        : {};
  
      commentsPerLabelPerBot[curr.label][curr.comment.user.login] = commentsPerLabelPerBot[curr.label][curr.comment.user.login]
        ? commentsPerLabelPerBot[curr.label][curr.comment.user.login]
        : [];
  
      commentsPerLabelPerBot[curr.label][curr.comment.user.login].push(curr.comment.body);
    });
  
    let body = `\
          Hi @${prOwner}
    
          You have ${commentsPerLabelCount} ${commentsPerLabelCount === 1 ? "comment" : "comments"} made by bots installed on this repo regarding this pull request. \
          Check them below:\n`;
  
    for (const [label, commentsPerBot] of (<any>Object).entries(commentsPerLabelPerBot)) {
      const amountOfComments = (<any>Object)
        .values(commentsPerBot)
        .reduce((acc, curr) => { return acc + curr.length }, 0);
  
      body += `\
              <details>
              <summary>There ${amountOfComments === 1 ? "is" : "are"} <b>${amountOfComments}</b> ${amountOfComments === 1 ? "comment" : "comments"} classified as <b>${label}</b></summary>
              <br /> \n\n`;
  
      for (const [bot, comments] of (<any>Object).entries(commentsPerBot)) {
        body += `\
          <ul>
          <li>
          <details>
          <summary>${comments.length} ${comments.length === 1 ? "comment" : "comments"} made by <i>${bot}</i></summary>
          <br />\n\n`;
  
        comments.forEach(comment => body += `${comment}\n\n`);
  
        body += `\
          </details>
          </li>
          </ul>\n\n`;
      }
  
      body += `</details>`;
    }
  
    const botsThatHaventCommented = botsToWaitForComment.reduce((acc: string[], curr: string) => {
      if (!documents.some(doc => doc.comment.user.login.includes(curr))) acc.push(curr);
      return acc
    }, []);
  
    if (botsThatHaventCommented.length > 0) {
      body += "\n";
  
      let bots = botsThatHaventCommented
        .map(curr => `<b>${curr}</b>`)
        .join(", ");
  
      if (botsThatHaventCommented.length > 1) {
        bots = strReplaceLast(bots, ",", " and");
      }
  
      body += `⚠️ The ${botsThatHaventCommented.length > 1 ? "bots" : "bot"} ${bots} `;
      body += `did not comment anything yet. I'll update this comment as soon as they do.`;
    }
  
    // removing empty tab spaces to have a valid markdown.
    return body.replace(/  /g, "");
}