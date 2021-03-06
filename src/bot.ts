import { Mongo } from 'metabot-utils'

import type { EventPayloads } from "@octokit/webhooks/dist-types/generated/event-payloads"

export async function saveBotComment(
    owner: string, 
    repo: string, 
    issue_number: number, 
    comment: EventPayloads.WebhookPayloadIssueCommentComment, 
    commentSender: string,  
    connString: string)
    : Promise<{ result: { ok?: number, n?: number }, error: any }> {
 
    const document = {
        comment: comment,
        owner,
        repo,
        issue_number,
        label: resolveLabel(commentSender)
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

function resolveLabel(botName: string): string {
    let label: string;

    switch (botName) {
        case "request-info[bot]":
            label = "warning";
            break;

        case "todo[bot]":
            label = "info";
            break;

        default:
            label = "unlabelled";
            break;
    }

    return label;
}