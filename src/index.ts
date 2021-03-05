import { Probot } from "probot";
import { Mongo } from './helpers/mongo'
// import { sleep } from './helpers/utils'

export = (app: Probot) => {
  app.on("pull_request.opened", async (context) => {
    // waiting for all bots' comments to be posted.
    //await sleep(10000);

    const payload = context.payload;

    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const issue_number = payload.number;

    const comments = await context.octokit.issues.listComments({ owner, repo, issue_number });

    const document: any = {};
    document.comments = comments.data;
    document.owner = owner;
    document.repo = repo;
    document.issue_number = issue_number;

    document.comments.forEach(comment => {
      comment.label = comment.user.login === "request-info[bot]" ? "critical" : "informative";
    });

    const connString = process.env.MONGO_CONN_STRING!;
    const client = new Mongo(connString);

    // const { result, error } = await client.insertOne("metabot", "comments", document)

    // fetching documents from db using multiple propeties as query.
    const { document: result, error } = await client.findAll("metabot", "comments", {
      owner: owner,
      repo: repo,
      issue_number: issue_number,
      comments: { $all: [{ "$elemMatch": { "label": "informative" } }] }
    });

    if (!error) {
      context.log(result)
    } else {
      throw error;
    }
  });
};