export type BotsPerLabel = {
    [label: string]: string[];
}

export type BotsConfig = {
    requestInfoReplyComment: string,
    metabotLabels: BotsPerLabel[],
    metabotBotsToWaitForComment: string[]
}