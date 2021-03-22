import { Mongo } from 'metabot-utils'

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